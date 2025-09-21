import requests
import sys
import json
from datetime import datetime
import base64
import io

class RecipeAPITester:
    def __init__(self, base_url="https://recipe-manager-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_id = None
        self.created_recipe_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart/form-data
                    if 'Content-Type' in test_headers:
                        del test_headers['Content-Type']
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "nom": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@test.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_login_user(self):
        """Test user login with existing credentials"""
        login_data = {
            "email": f"testuser{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        return success

    def test_init_admin(self):
        """Test admin initialization"""
        success, response = self.run_test(
            "Initialize Admin",
            "POST",
            "init-admin",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@recettes.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_id = response['user']['id']
            print(f"   Admin ID: {self.admin_id}")
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_categories(self):
        """Test getting recipe categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "recettes/categories",
            200
        )
        
        if success and 'categories' in response:
            print(f"   Categories: {response['categories']}")
            return True
        return False

    def test_create_recipe(self):
        """Test creating a recipe"""
        recipe_data = {
            "titre": "Salade de Tomates Basilic",
            "ingredients": "tomates, basilic frais, mozzarella, huile d'olive, vinaigre balsamique",
            "instructions": "1. Couper les tomates en tranches\n2. Ajouter la mozzarella\n3. Garnir de basilic\n4. Assaisonner",
            "categorie": "Entrée"
        }
        
        success, response = self.run_test(
            "Create Recipe",
            "POST",
            "recettes",
            200,
            data=recipe_data,
            files={},  # Simulate form data
            headers={'Authorization': f'Bearer {self.token}'}
        )
        
        if success and 'recette' in response:
            self.created_recipe_id = response['recette']['id']
            print(f"   Recipe ID: {self.created_recipe_id}")
            return True
        return False

    def test_get_my_recipes(self):
        """Test getting user's recipes"""
        success, response = self.run_test(
            "Get My Recipes",
            "GET",
            "recettes/mes",
            200
        )
        
        if success:
            print(f"   Found {len(response)} recipes")
            return True
        return False

    def test_get_public_recipes(self):
        """Test getting public (approved) recipes"""
        success, response = self.run_test(
            "Get Public Recipes",
            "GET",
            "recettes",
            200
        )
        
        if success:
            print(f"   Found {len(response)} public recipes")
            return True
        return False

    def test_ai_suggestions(self):
        """Test AI recipe suggestions"""
        suggestion_data = {
            "ingredients": "tomates, basilic, mozzarella"
        }
        
        success, response = self.run_test(
            "AI Recipe Suggestions",
            "POST",
            "ia/suggestions",
            200,
            data=suggestion_data
        )
        
        if success and 'suggestion' in response:
            print(f"   AI Suggestion received (length: {len(response['suggestion'])})")
            return True
        return False

    def test_admin_get_pending_recipes(self):
        """Test admin getting pending recipes"""
        # Switch to admin token
        old_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Admin Get Pending Recipes",
            "GET",
            "admin/recettes",
            200
        )
        
        # Restore user token
        self.token = old_token
        
        if success:
            print(f"   Found {len(response)} pending recipes")
            return True
        return False

    def test_admin_approve_recipe(self):
        """Test admin approving a recipe"""
        if not self.created_recipe_id:
            print("❌ No recipe to approve")
            return False
            
        # Switch to admin token
        old_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Admin Approve Recipe",
            "POST",
            f"admin/recettes/{self.created_recipe_id}/approuver",
            200
        )
        
        # Restore user token
        self.token = old_token
        return success

    def test_admin_stats(self):
        """Test admin statistics"""
        # Switch to admin token
        old_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Admin Statistics",
            "GET",
            "admin/stats",
            200
        )
        
        # Restore user token
        self.token = old_token
        
        if success:
            print(f"   Stats: {response}")
            return True
        return False

    def test_rate_recipe(self):
        """Test rating a recipe"""
        if not self.created_recipe_id:
            print("❌ No recipe to rate")
            return False
            
        rating_data = {
            "note": 5
        }
        
        success, response = self.run_test(
            "Rate Recipe",
            "POST",
            f"recettes/{self.created_recipe_id}/noter",
            200,
            data=rating_data
        )
        return success

    def test_add_comment(self):
        """Test adding a comment to a recipe"""
        if not self.created_recipe_id:
            print("❌ No recipe to comment on")
            return False
            
        comment_data = {
            "commentaire": "Excellente recette, très savoureuse !"
        }
        
        success, response = self.run_test(
            "Add Comment",
            "POST",
            f"recettes/{self.created_recipe_id}/commentaires",
            200,
            data=comment_data
        )
        return success

    def test_get_comments(self):
        """Test getting comments for a recipe"""
        if not self.created_recipe_id:
            print("❌ No recipe to get comments for")
            return False
            
        success, response = self.run_test(
            "Get Comments",
            "GET",
            f"recettes/{self.created_recipe_id}/commentaires",
            200
        )
        
        if success:
            print(f"   Found {len(response)} comments")
            return True
        return False

def main():
    print("🧪 Starting Recipe Management API Tests")
    print("=" * 50)
    
    tester = RecipeAPITester()
    
    # Test sequence
    tests = [
        ("User Registration", tester.test_register_user),
        ("Get Current User", tester.test_get_me),
        ("Get Categories", tester.test_get_categories),
        ("Create Recipe", tester.test_create_recipe),
        ("Get My Recipes", tester.test_get_my_recipes),
        ("Get Public Recipes", tester.test_get_public_recipes),
        ("AI Suggestions", tester.test_ai_suggestions),
        ("Initialize Admin", tester.test_init_admin),
        ("Admin Login", tester.test_admin_login),
        ("Admin Get Pending Recipes", tester.test_admin_get_pending_recipes),
        ("Admin Approve Recipe", tester.test_admin_approve_recipe),
        ("Admin Statistics", tester.test_admin_stats),
        ("Rate Recipe", tester.test_rate_recipe),
        ("Add Comment", tester.test_add_comment),
        ("Get Comments", tester.test_get_comments),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())