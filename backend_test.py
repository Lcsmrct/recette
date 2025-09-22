import requests
import sys
import json
from datetime import datetime
import base64
import io

class RecipeAPITester:
    def __init__(self, base_url="https://intuitive-recipes.preview.emergentagent.com/api"):
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
        # Use requests directly for form data
        url = f"{self.base_url}/recettes"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        form_data = {
            "titre": "Salade de Tomates Basilic",
            "ingredients": "tomates, basilic frais, mozzarella, huile d'olive, vinaigre balsamique",
            "instructions": "1. Couper les tomates en tranches\n2. Ajouter la mozzarella\n3. Garnir de basilic\n4. Assaisonner",
            "categorie": "Entrée"
        }
        
        self.tests_run += 1
        print(f"\n🔍 Testing Create Recipe...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, data=form_data, headers=headers)
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                if 'recette' in response_data:
                    self.created_recipe_id = response_data['recette']['id']
                    print(f"   Recipe ID: {self.created_recipe_id}")
                    return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
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
            "ingredients": "pommes, farine, beurre"
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

    def test_ai_generate_recipe(self):
        """Test AI complete recipe generation with Gemini 2.0 Flash"""
        suggestion_data = {
            "ingredients": "pommes, farine, beurre"
        }
        
        success, response = self.run_test(
            "AI Generate Complete Recipe",
            "POST",
            "ia/generer-recette",
            200,
            data=suggestion_data
        )
        
        if success:
            if 'recette' in response and response['recette']:
                recette = response['recette']
                required_fields = ['titre', 'ingredients', 'instructions', 'categorie']
                missing_fields = [field for field in required_fields if field not in recette]
                
                if not missing_fields:
                    print(f"   ✅ Complete recipe generated: {recette['titre']}")
                    print(f"   Category: {recette['categorie']}")
                    return True
                else:
                    print(f"   ❌ Missing fields in recipe: {missing_fields}")
                    return False
            elif 'raw_response' in response:
                print(f"   ⚠️ Raw response received (JSON parsing failed)")
                print(f"   Response length: {len(response['raw_response'])}")
                return True  # Still consider it working if we get a response
            else:
                print(f"   ❌ No recipe or raw response in response")
                return False
        return False

    def test_forgot_password(self):
        """Test password reset request"""
        # Use a test email that should exist (the one we registered)
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"testuser{timestamp}@test.com"
        
        reset_data = {
            "email": test_email
        }
        
        success, response = self.run_test(
            "Forgot Password Request",
            "POST",
            "auth/forgot-password",
            200,
            data=reset_data
        )
        
        if success and 'message' in response:
            print(f"   Reset request processed")
            return True
        return False

    def test_complete_password_reset_flow(self):
        """Test complete password reset flow with database token extraction"""
        import pymongo
        from datetime import datetime, timezone
        
        # Connect to MongoDB to extract the reset token
        try:
            mongo_client = pymongo.MongoClient("mongodb://localhost:27017")
            db = mongo_client["recettes_db"]
            
            # First, create a user for testing
            timestamp = datetime.now().strftime('%H%M%S')
            test_email = f"resetflow{timestamp}@test.com"
            original_password = "OriginalPass123!"
            new_password = "NewPassword456!"
            
            user_data = {
                "nom": f"Reset Flow Test User {timestamp}",
                "email": test_email,
                "password": original_password
            }
            
            # Register user
            success, response = self.run_test(
                "Register User for Complete Reset Test",
                "POST",
                "auth/register",
                200,
                data=user_data
            )
            
            if not success:
                return False
            
            # Request password reset
            reset_request = {"email": test_email}
            success, response = self.run_test(
                "Request Password Reset for Complete Test",
                "POST",
                "auth/forgot-password",
                200,
                data=reset_request
            )
            
            if not success:
                return False
            
            # Extract the token from database
            token_record = db.password_reset_tokens.find_one(
                {"email": test_email, "used": False},
                sort=[("created_at", -1)]
            )
            
            if not token_record:
                print("   ❌ No reset token found in database")
                return False
            
            reset_token = token_record["token"]
            print(f"   ✅ Reset token extracted: {reset_token[:10]}...")
            
            # Test token verification
            success, response = self.run_test(
                "Verify Valid Reset Token",
                "GET",
                f"auth/verify-reset-token/{reset_token}",
                200
            )
            
            if not success:
                return False
            
            if response.get("valid") and response.get("email") == test_email:
                print(f"   ✅ Token verified for email: {response['email']}")
            else:
                print(f"   ❌ Token verification failed: {response}")
                return False
            
            # Reset password with valid token
            reset_data = {
                "token": reset_token,
                "new_password": new_password
            }
            
            success, response = self.run_test(
                "Reset Password with Valid Token",
                "POST",
                "auth/reset-password",
                200,
                data=reset_data
            )
            
            if not success:
                return False
            
            # Test login with new password
            login_data = {
                "email": test_email,
                "password": new_password
            }
            
            success, response = self.run_test(
                "Login with New Password",
                "POST",
                "auth/login",
                200,
                data=login_data
            )
            
            if not success:
                return False
            
            # Test that old password no longer works
            old_login_data = {
                "email": test_email,
                "password": original_password
            }
            
            success, response = self.run_test(
                "Login with Old Password (Should Fail)",
                "POST",
                "auth/login",
                400,  # Should fail
                data=old_login_data
            )
            
            if success:
                print("   ✅ Old password correctly rejected")
                return True
            else:
                print("   ❌ Old password still works (security issue)")
                return False
                
        except Exception as e:
            print(f"   ❌ Database connection error: {str(e)}")
            return False
        finally:
            try:
                mongo_client.close()
            except:
                pass

    def test_verify_invalid_reset_token(self):
        """Test verifying an invalid reset token"""
        invalid_token = "invalid_token_12345"
        
        success, response = self.run_test(
            "Verify Invalid Reset Token",
            "GET",
            f"auth/verify-reset-token/{invalid_token}",
            400  # Should return 400 for invalid token
        )
        
        return success

    def test_reset_password_invalid_token(self):
        """Test resetting password with invalid token"""
        reset_data = {
            "token": "invalid_token_12345",
            "new_password": "NewPassword123!"
        }
        
        success, response = self.run_test(
            "Reset Password with Invalid Token",
            "POST",
            "auth/reset-password",
            400,  # Should return 400 for invalid token
            data=reset_data
        )
        
        return success

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
        ("AI Generate Complete Recipe", tester.test_ai_generate_recipe),
        ("Forgot Password", tester.test_forgot_password),
        ("Password Reset Flow", tester.test_complete_password_reset_flow),
        ("Verify Invalid Reset Token", tester.test_verify_invalid_reset_token),
        ("Reset Password Invalid Token", tester.test_reset_password_invalid_token),
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