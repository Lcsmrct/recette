#!/usr/bin/env python3
"""
MongoDB Atlas Endpoint Integration Test
Comprehensive test of all API endpoints with MongoDB Atlas
"""

import requests
import sys
import json
from datetime import datetime
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

class AtlasEndpointTester:
    def __init__(self, base_url="https://phone-access-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.mongo_url = "mongodb+srv://lucasmaricourt96:jYRX9raWC3NDwqB9@cluster0.cx8z7bi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        self.db_name = "Cluster0"
        self.token = None
        self.admin_token = None
        self.test_user_email = None
        self.test_recipe_id = None
        self.reset_token = None

    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def api_call(self, method, endpoint, data=None, files=None, expected_status=200):
        """Make API call and return success status and response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    del headers['Content-Type']  # Let requests set it for multipart
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            
            if success:
                self.log(f"✅ {method} {endpoint} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {method} {endpoint} - Expected {expected_status}, got {response.status_code}", "ERROR")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", "ERROR")
                except:
                    self.log(f"   Error text: {response.text}", "ERROR")
                return False, {}
                
        except Exception as e:
            self.log(f"❌ {method} {endpoint} - Exception: {str(e)}", "ERROR")
            return False, {}

    async def verify_database_write(self, collection_name, filter_query):
        """Verify data was written to MongoDB Atlas"""
        try:
            client = AsyncIOMotorClient(self.mongo_url)
            db = client[self.db_name]
            
            doc = await db[collection_name].find_one(filter_query)
            client.close()
            
            if doc:
                self.log(f"✅ Database verification: Document found in {collection_name}")
                return True
            else:
                self.log(f"❌ Database verification: Document not found in {collection_name}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Database verification error: {str(e)}", "ERROR")
            return False

    async def get_reset_token_from_db(self, email):
        """Get password reset token from MongoDB Atlas"""
        try:
            client = AsyncIOMotorClient(self.mongo_url)
            db = client[self.db_name]
            
            token_doc = await db.password_reset_tokens.find_one(
                {"email": email, "used": False},
                sort=[("created_at", -1)]
            )
            client.close()
            
            if token_doc:
                return token_doc["token"]
            return None
            
        except Exception as e:
            self.log(f"❌ Error getting reset token: {str(e)}", "ERROR")
            return None

    async def test_complete_flow(self):
        """Test complete application flow with MongoDB Atlas"""
        
        self.log("🚀 Starting MongoDB Atlas Integration Test")
        self.log("=" * 60)
        
        # Test 1: User Registration
        self.log("1. Testing User Registration with Atlas DB")
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_email = f"atlastest{timestamp}@test.com"
        
        user_data = {
            "nom": f"Atlas Test User {timestamp}",
            "email": self.test_user_email,
            "password": "AtlasTest123!"
        }
        
        success, response = self.api_call("POST", "auth/register", user_data)
        if not success:
            return False
            
        self.token = response.get('token')
        user_id = response.get('user', {}).get('id')
        
        # Verify user was written to Atlas
        if not await self.verify_database_write("users", {"email": self.test_user_email}):
            return False
        
        # Test 2: Recipe Creation
        self.log("2. Testing Recipe Creation with Atlas DB")
        recipe_data = {
            "titre": "Recette Test Atlas",
            "ingredients": "pommes, sucre, cannelle",
            "instructions": "1. Éplucher les pommes\n2. Ajouter le sucre\n3. Saupoudrer de cannelle",
            "categorie": "Dessert"
        }
        
        # Recipe endpoint expects form data, not JSON
        url = f"{self.base_url}/recettes"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.post(url, data=recipe_data, headers=headers)
            success = response.status_code == 200
            
            if success:
                self.log(f"✅ POST recettes - Status: {response.status_code}")
                response_data = response.json()
                self.test_recipe_id = response_data.get('recette', {}).get('id')
            else:
                self.log(f"❌ POST recettes - Expected 200, got {response.status_code}", "ERROR")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", "ERROR")
                except:
                    self.log(f"   Error text: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ POST recettes - Exception: {str(e)}", "ERROR")
            return False
        
        if not success:
            return False
            
        # Verify recipe was written to Atlas
        if not await self.verify_database_write("recettes", {"id": self.test_recipe_id}):
            return False
        
        # Test 3: Password Reset Flow with Atlas
        self.log("3. Testing Password Reset Flow with Atlas DB")
        
        # Request password reset
        reset_data = {"email": self.test_user_email}
        success, response = self.api_call("POST", "auth/forgot-password", reset_data)
        if not success:
            return False
        
        # Get token from Atlas database
        self.reset_token = await self.get_reset_token_from_db(self.test_user_email)
        if not self.reset_token:
            self.log("❌ Could not retrieve reset token from Atlas DB", "ERROR")
            return False
        
        self.log(f"✅ Reset token retrieved from Atlas: {self.reset_token[:20]}...")
        
        # Verify token
        success, response = self.api_call("GET", f"auth/verify-reset-token/{self.reset_token}")
        if not success:
            return False
        
        # Reset password
        new_password_data = {
            "token": self.reset_token,
            "new_password": "NewAtlasPass123!"
        }
        success, response = self.api_call("POST", "auth/reset-password", new_password_data)
        if not success:
            return False
        
        # Test login with new password
        login_data = {
            "email": self.test_user_email,
            "password": "NewAtlasPass123!"
        }
        success, response = self.api_call("POST", "auth/login", login_data)
        if not success:
            return False
        
        self.token = response.get('token')  # Update token
        
        # Test 4: Admin Operations with Atlas
        self.log("4. Testing Admin Operations with Atlas DB")
        
        # Initialize admin
        success, response = self.api_call("POST", "init-admin")
        # Admin might already exist, so we don't fail on this
        
        # Login as admin
        admin_data = {
            "email": "admin@recettes.com",
            "password": "admin123"
        }
        success, response = self.api_call("POST", "auth/login", admin_data)
        if not success:
            return False
        
        admin_token = response.get('token')
        
        # Switch to admin token
        old_token = self.token
        self.token = admin_token
        
        # Get pending recipes
        success, response = self.api_call("GET", "admin/recettes")
        if not success:
            self.token = old_token
            return False
        
        # Approve recipe if it exists
        if self.test_recipe_id:
            success, response = self.api_call("POST", f"admin/recettes/{self.test_recipe_id}/approuver")
            if not success:
                self.token = old_token
                return False
        
        # Get admin stats
        success, response = self.api_call("GET", "admin/stats")
        if not success:
            self.token = old_token
            return False
        
        self.log(f"✅ Admin stats: {response}")
        
        # Restore user token
        self.token = old_token
        
        # Test 5: Recipe Interactions with Atlas
        self.log("5. Testing Recipe Interactions with Atlas DB")
        
        if self.test_recipe_id:
            # Rate recipe
            rating_data = {"note": 5}
            success, response = self.api_call("POST", f"recettes/{self.test_recipe_id}/noter", rating_data)
            if not success:
                return False
            
            # Verify vote was written to Atlas
            if not await self.verify_database_write("votes", {"recette_id": self.test_recipe_id}):
                return False
            
            # Add comment
            comment_data = {"commentaire": "Excellente recette testée avec Atlas!"}
            success, response = self.api_call("POST", f"recettes/{self.test_recipe_id}/commentaires", comment_data)
            if not success:
                return False
            
            # Verify comment was written to Atlas
            if not await self.verify_database_write("commentaires", {"recette_id": self.test_recipe_id}):
                return False
            
            # Get comments
            success, response = self.api_call("GET", f"recettes/{self.test_recipe_id}/commentaires")
            if not success:
                return False
        
        # Test 6: AI Features with Atlas
        self.log("6. Testing AI Features with Atlas DB")
        
        # AI Suggestions
        ai_data = {"ingredients": "tomates, basilic, mozzarella"}
        success, response = self.api_call("POST", "ia/suggestions", ai_data)
        if not success:
            return False
        
        suggestion_length = len(response.get('suggestion', ''))
        self.log(f"✅ AI suggestion received: {suggestion_length} characters")
        
        # AI Recipe Generation
        success, response = self.api_call("POST", "ia/generer-recette", ai_data)
        if not success:
            return False
        
        if response.get('recette'):
            recipe = response['recette']
            self.log(f"✅ AI recipe generated: {recipe.get('titre', 'N/A')}")
        
        self.log("=" * 60)
        self.log("🎉 ALL MONGODB ATLAS INTEGRATION TESTS PASSED!")
        self.log("✅ Database connection working perfectly")
        self.log("✅ All CRUD operations successful")
        self.log("✅ Authentication flow complete")
        self.log("✅ Recipe management functional")
        self.log("✅ Admin operations working")
        self.log("✅ AI features operational")
        self.log("=" * 60)
        
        return True

async def main():
    tester = AtlasEndpointTester()
    success = await tester.test_complete_flow()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))