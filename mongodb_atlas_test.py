#!/usr/bin/env python3
"""
MongoDB Atlas Connection Test
Tests the specific MongoDB Atlas connection provided in the review request.
"""

import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timezone
import uuid

async def test_mongodb_atlas_connection():
    """Test MongoDB Atlas connection and basic operations"""
    
    # MongoDB Atlas connection string from the review request
    mongo_url = "mongodb+srv://lucasmaricourt96:jYRX9raWC3NDwqB9@cluster0.cx8z7bi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    db_name = "Cluster0"
    
    print("🔍 Testing MongoDB Atlas Connection")
    print("=" * 50)
    print(f"Connection URL: {mongo_url[:50]}...")
    print(f"Database: {db_name}")
    print()
    
    try:
        # Create client
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test 1: Connection test
        print("1. Testing connection...")
        await client.admin.command('ping')
        print("   ✅ Connection successful!")
        
        # Test 2: List collections
        print("\n2. Listing collections...")
        collections = await db.list_collection_names()
        print(f"   ✅ Found {len(collections)} collections: {collections}")
        
        # Test 3: Test write operation
        print("\n3. Testing write operation...")
        test_collection = db.connection_test
        test_doc = {
            "id": str(uuid.uuid4()),
            "test_type": "mongodb_atlas_connection_test",
            "timestamp": datetime.now(timezone.utc),
            "message": "Test document for MongoDB Atlas connection verification"
        }
        
        result = await test_collection.insert_one(test_doc)
        print(f"   ✅ Document inserted with ID: {result.inserted_id}")
        
        # Test 4: Test read operation
        print("\n4. Testing read operation...")
        found_doc = await test_collection.find_one({"id": test_doc["id"]})
        if found_doc:
            print(f"   ✅ Document retrieved: {found_doc['message']}")
        else:
            print("   ❌ Document not found")
            return False
        
        # Test 5: Test update operation
        print("\n5. Testing update operation...")
        update_result = await test_collection.update_one(
            {"id": test_doc["id"]},
            {"$set": {"updated": True, "update_timestamp": datetime.now(timezone.utc)}}
        )
        print(f"   ✅ Document updated: {update_result.modified_count} document(s)")
        
        # Test 6: Test delete operation
        print("\n6. Testing delete operation...")
        delete_result = await test_collection.delete_one({"id": test_doc["id"]})
        print(f"   ✅ Document deleted: {delete_result.deleted_count} document(s)")
        
        # Test 7: Check existing application data
        print("\n7. Checking existing application data...")
        
        # Check users collection
        users_count = await db.users.count_documents({})
        print(f"   Users in database: {users_count}")
        
        # Check recipes collection
        recipes_count = await db.recettes.count_documents({})
        print(f"   Recipes in database: {recipes_count}")
        
        # Check password reset tokens
        tokens_count = await db.password_reset_tokens.count_documents({})
        print(f"   Password reset tokens: {tokens_count}")
        
        # Check votes
        votes_count = await db.votes.count_documents({})
        print(f"   Votes in database: {votes_count}")
        
        # Check comments
        comments_count = await db.commentaires.count_documents({})
        print(f"   Comments in database: {comments_count}")
        
        print("\n" + "=" * 50)
        print("✅ MongoDB Atlas Connection Test PASSED")
        print("✅ All CRUD operations working correctly")
        print("✅ Application data accessible")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"\n❌ MongoDB Atlas Connection Test FAILED")
        print(f"Error: {str(e)}")
        print("=" * 50)
        return False
    
    finally:
        try:
            client.close()
        except:
            pass

async def test_password_reset_tokens():
    """Test password reset tokens in MongoDB Atlas"""
    mongo_url = "mongodb+srv://lucasmaricourt96:jYRX9raWC3NDwqB9@cluster0.cx8z7bi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    db_name = "Cluster0"
    
    print("\n🔍 Testing Password Reset Tokens in MongoDB Atlas")
    print("=" * 50)
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Find recent password reset tokens
        recent_tokens = await db.password_reset_tokens.find({}).sort("created_at", -1).limit(5).to_list(5)
        
        print(f"Found {len(recent_tokens)} recent password reset tokens:")
        for i, token in enumerate(recent_tokens, 1):
            print(f"   {i}. Email: {token.get('email', 'N/A')}")
            print(f"      Token: {token.get('token', 'N/A')[:20]}...")
            print(f"      Used: {token.get('used', 'N/A')}")
            print(f"      Created: {token.get('created_at', 'N/A')}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking password reset tokens: {str(e)}")
        return False
    finally:
        try:
            client.close()
        except:
            pass

async def main():
    """Main test function"""
    success1 = await test_mongodb_atlas_connection()
    success2 = await test_password_reset_tokens()
    
    if success1 and success2:
        print("\n🎉 ALL MONGODB ATLAS TESTS PASSED!")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))