"""
Remembery — Multi-User Auth and Data Isolation Test Suite
==========================================================
Tests the FastAPI authentication system and ensures strict multi-tenant
data isolation across all API endpoints (categories, archive items,
AI curation, memories, and RAG Q&A queries).
"""

import sys
import os

# Add current directory to path to resolve imports correctly
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app import models, schemas, crud

# ─────────────────────────────────────────────────────────
# Setup Isolated In-Memory Testing Database
# ─────────────────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = "sqlite://"  # In-memory SQLite for testing

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in the clean memory DB
Base.metadata.create_all(bind=engine)

# Seed default categories in the test database
def seed_test_categories(db):
    default_cats = [
        {"name": "사진", "icon": "Image", "color": "#0ea5e9", "description": "사진 및 이미지 자료"},
        {"name": "문서", "icon": "FileText", "color": "#f59e0b", "description": "편지, 보고서, 에세이 등 텍스트 문서"},
        {"name": "동영상", "icon": "Video", "color": "#ef4444", "description": "비디오 녹화물 및 영상 기록"},
        {"name": "도서", "icon": "BookOpen", "color": "#10b981", "description": "출판물, 개인 서적, 논문"},
        {"name": "음성", "icon": "Music", "color": "#8b5cf6", "description": "음성 녹음, 인터뷰, 음악"},
        {"name": "일기", "icon": "PenLine", "color": "#f97316", "description": "개인 일기 및 저널"},
    ]
    for cat in default_cats:
        db_cat = models.Category(
            name=cat["name"],
            icon=cat["icon"],
            color=cat["color"],
            description=cat["description"],
            is_default=True,
            user_id=None
        )
        db.add(db_cat)
    db.commit()

# Run category seeding
db_init = TestingSessionLocal()
seed_test_categories(db_init)
db_init.close()

# FastAPI Dependency Override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Initialize the FastAPI Test Client
client = TestClient(app)

# ─────────────────────────────────────────────────────────
# Test Execution
# ─────────────────────────────────────────────────────────
def run_isolation_tests():
    print("==================================================")
    print("Remembery: Running Authentication & Isolation Tests")
    print("==================================================")

    # -----------------------------------------------------
    # Test 1: User Signup
    # -----------------------------------------------------
    print("\n[Test 1] Testing Signup Endpoints...")
    
    # User A Signup
    signup_payload_a = {
        "email": "usera@remembery.com",
        "password": "Password123A!",
        "name": "User A"
    }
    response = client.post("/api/auth/signup", json=signup_payload_a)
    assert response.status_code == 201, f"User A signup failed: {response.text}"
    user_a_data = response.json()
    assert user_a_data["email"] == signup_payload_a["email"]
    assert user_a_data["display_name"] == signup_payload_a["name"]
    print("✅ User A Signup Successful!")

    # Duplicate Signup Conflict Check
    response = client.post("/api/auth/signup", json=signup_payload_a)
    assert response.status_code == 409, "Should reject signup for duplicate email with 409 Conflict."
    print("✅ Duplicate Signup Conflict Rejected correctly!")

    # User B Signup
    signup_payload_b = {
        "email": "userb@remembery.com",
        "password": "Password123B!",
        "name": "User B"
    }
    response = client.post("/api/auth/signup", json=signup_payload_b)
    assert response.status_code == 201, f"User B signup failed: {response.text}"
    user_b_data = response.json()
    print("✅ User B Signup Successful!")

    # -----------------------------------------------------
    # Test 2: User Login & Token Generation
    # -----------------------------------------------------
    print("\n[Test 2] Testing Login Endpoints & Credentials Verification...")
    
    # Invalid Password Login
    bad_login = {
        "email": signup_payload_a["email"],
        "password": "WrongPassword!"
    }
    response = client.post("/api/auth/login", json=bad_login)
    assert response.status_code == 401, "Should reject login with invalid credentials."
    print("✅ Login with incorrect password rejected correctly!")

    # User A Successful Login
    login_a = {
        "email": signup_payload_a["email"],
        "password": signup_payload_a["password"]
    }
    response = client.post("/api/auth/login", json=login_a)
    assert response.status_code == 200, f"User A login failed: {response.text}"
    token_a_data = response.json()
    assert "access_token" in token_a_data
    assert token_a_data["token_type"] == "bearer"
    token_a = token_a_data["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print("✅ User A Login Successful & JWT Token generated!")

    # User B Successful Login
    login_b = {
        "email": signup_payload_b["email"],
        "password": signup_payload_b["password"]
    }
    response = client.post("/api/auth/login", json=login_b)
    assert response.status_code == 200, f"User B login failed: {response.text}"
    token_b_data = response.json()
    token_b = token_b_data["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print("✅ User B Login Successful & JWT Token generated!")

    # -----------------------------------------------------
    # Test 3: Authenticated Profile (/api/auth/me)
    # -----------------------------------------------------
    print("\n[Test 3] Testing Profile Retrieval (/api/auth/me)...")
    
    response = client.get("/api/auth/me", headers=headers_a)
    assert response.status_code == 200, f"Profile fetch failed: {response.text}"
    profile_a = response.json()
    assert profile_a["email"] == signup_payload_a["email"]
    assert profile_a["display_name"] == signup_payload_a["name"]
    print("✅ Profile Retrieval via Bearer Token matches correct user metadata!")

    # -----------------------------------------------------
    # Test 4: Category Router Security and Tenant Isolation
    # -----------------------------------------------------
    print("\n[Test 4] Testing Category Isolation...")
    
    # 1. User A lists categories (should see default categories only)
    response = client.get("/api/categories/", headers=headers_a)
    assert response.status_code == 200
    cats_a_initial = response.json()
    assert len(cats_a_initial) == 6  # Seeded defaults
    for cat in cats_a_initial:
        assert cat["is_default"] is True
    print("✅ List categories returned only system defaults at startup.")

    # 2. User A creates a custom category
    custom_cat_payload = {
        "name": "User A Custom Cat",
        "description": "Category private to User A",
        "icon": "Heart",
        "color": "#ff0000"
    }
    response = client.post("/api/categories/", json=custom_cat_payload, headers=headers_a)
    assert response.status_code == 201
    created_cat_a = response.json()
    assert created_cat_a["name"] == custom_cat_payload["name"]
    assert created_cat_a["user_id"] == user_a_data["id"]
    assert created_cat_a["is_default"] is False
    cat_id_a = created_cat_a["id"]
    print("✅ User A created a private custom category successfully!")

    # 3. User B lists categories (should NOT see User A's custom category)
    response = client.get("/api/categories/", headers=headers_b)
    assert response.status_code == 200
    cats_b = response.json()
    assert len(cats_b) == 6  # Should only see system default categories
    for cat in cats_b:
        assert cat["id"] != cat_id_a
    print("✅ User B is strictly isolated from User A's custom categories during listings!")

    # 4. User B attempts to read, edit, or delete User A's category directly
    response = client.get(f"/api/categories/{cat_id_a}", headers=headers_b)
    assert response.status_code == 403, "Should reject access to another user's private category."
    
    update_payload = {"name": "Malicious Update"}
    response = client.patch(f"/api/categories/{cat_id_a}", json=update_payload, headers=headers_b)
    assert response.status_code == 403, "Should block update to another user's category."

    response = client.delete(f"/api/categories/{cat_id_a}", headers=headers_b)
    assert response.status_code == 403, "Should block deletion of another user's category."
    print("✅ Direct modifications/reads of private categories by foreign users blocked!")

    # -----------------------------------------------------
    # Test 5: Archive Isolation
    # -----------------------------------------------------
    print("\n[Test 5] Testing Archive Items Tenant Isolation...")
    
    # User A uploads an item
    archive_payload_a = {
        "title": "A Private Diary Entry",
        "description": "This is a private diary entry belonging to User A",
        "category_id": cats_a_initial[1]["id"],  # "문서" category
        "tags": "diary, private",
        "is_public": False,
        "auto_index": False
    }
    # Form data is handled as standard upload or dict/form format depending on endpoint definition
    # Let's post it to /api/archive/upload
    # Note: /api/archive/upload in backend is typically a multipart/form-data endpoint, 
    # but the implementation plan specifies it extracts owner_id dynamically.
    files = {
        "file": ("diary.txt", b"Today was a great day.", "text/plain")
    }
    data = {
        "owner_id": str(user_a_data["id"]),
        "title": archive_payload_a["title"],
        "description": archive_payload_a["description"],
        "category_id": str(archive_payload_a["category_id"]),
        "tags": archive_payload_a["tags"],
        "is_public": "false",
        "auto_index": "false"
    }
    response = client.post("/api/archive/upload", data=data, files=files, headers=headers_a)
    assert response.status_code == 201, f"Archive upload failed: {response.text}"
    uploaded_item_a = response.json()["item"]
    item_id_a = uploaded_item_a["id"]
    assert uploaded_item_a["owner_id"] == user_a_data["id"]
    print("✅ User A successfully uploaded an archive item!")
 
    # User B lists archives (should see 0 items since B has uploaded nothing)
    response = client.get("/api/archive/list", headers=headers_b)
    assert response.status_code == 200
    list_b = response.json()
    assert list_b["total"] == 0
    assert len(list_b["items"]) == 0
    print("✅ User B's archive item list returned empty (strictly isolated)!")

    # User B tries to retrieve User A's item detail directly
    response = client.get(f"/api/archive/{item_id_a}", headers=headers_b)
    assert response.status_code in [403, 404], f"Should block reading item detail. Got status: {response.status_code}"
    print("✅ User B blocked from accessing User A's archive item detail directly!")

    # -----------------------------------------------------
    # Test 6: AI Exhibition Isolation
    # -----------------------------------------------------
    print("\n[Test 6] Testing AI Curation Isolation...")
    
    # 1. User B curates an exhibition with a theme matching User A's items.
    # Since B has no items in their archive at all, this should raise a 404 error (proving isolation of A's items!).
    curate_payload = {
        "curator_id": user_b_data["id"],
        "theme": "A Private Diary Entry",
        "max_items": 5,
        "language": "ko"
    }
    response = client.post("/api/exhibition/curate", json=curate_payload, headers=headers_b)
    assert response.status_code == 404, f"Should reject curation with 404 for empty user archive, got: {response.status_code}"
    print("✅ User B's AI Curation returned 404 Not Found due to empty archive (isolation works)!")

    # 2. User B uploads an unrelated item
    files_b = {
        "file": ("golf.txt", b"Scored 85 today on the golf course.", "text/plain")
    }
    data_b = {
        "owner_id": str(user_b_data["id"]),
        "title": "B Golf Scorecard",
        "description": "Golf score and log",
        "category_id": str(cats_a_initial[1]["id"]),  # "문서" category
        "tags": "golf, log",
        "is_public": "false",
        "auto_index": "false"
    }
    response = client.post("/api/archive/upload", data=data_b, files=files_b, headers=headers_b)
    assert response.status_code == 201, f"User B archive upload failed: {response.text}"
    uploaded_item_b = response.json()["item"]
    item_id_b = uploaded_item_b["id"]

    # 3. User B curates again. Curation should now succeed because B has an item, 
    # but the curation must ONLY contain B's item (golf) and completely exclude A's private diary!
    response = client.post("/api/exhibition/curate", json=curate_payload, headers=headers_b)
    assert response.status_code == 200, f"Curation failed: {response.text}"
    curation_b = response.json()
    assert len(curation_b["curated_items"]) == 1
    assert curation_b["curated_items"][0]["archive_item_id"] == item_id_b, "Should only include B's item."
    assert all(item["archive_item_id"] != item_id_a for item in curation_b["curated_items"]), "User A's item leaked into B's curation!"
    print("✅ User B's AI Curation succeeded after upload and completely excluded User A's private files!")

    # 4. User A curates an exhibition.
    curate_payload_a = {
        "curator_id": user_a_data["id"],
        "theme": "A Private Diary Entry",
        "max_items": 5,
        "language": "ko"
    }
    response = client.post("/api/exhibition/curate", json=curate_payload_a, headers=headers_a)
    assert response.status_code == 200, f"User A curation failed: {response.text}"
    curation_a = response.json()
    assert len(curation_a["curated_items"]) > 0, "User A's curation should find and include User A's item!"
    assert curation_a["curated_items"][0]["archive_item_id"] == item_id_a
    assert all(item["archive_item_id"] != item_id_b for item in curation_a["curated_items"]), "User B's item leaked into A's curation!"
    print("✅ User A's AI Curation correctly retrieves User A's private items only!")

    # -----------------------------------------------------
    # Test 7: AI RAG Query Isolation
    # -----------------------------------------------------
    print("\n[Test 7] Testing AI RAG Query Isolation...")
    
    # User B asks a question about User A's private diary
    rag_payload = {
        "question": "What is written in the private diary?",
        "owner_id": user_a_data["id"],
        "top_k": 3,
        "language": "ko"
    }
    response = client.post("/api/ai/query", json=rag_payload, headers=headers_b)
    assert response.status_code == 200
    rag_response_b = response.json()
    assert all(chunk["archive_item_id"] != item_id_a for chunk in rag_response_b["context_used"]), "Foreign user's RAG context includes isolated data."
    print("✅ User B's AI RAG Query did not leak any context items from User A's private archive!")

    # User A asks the same question
    response = client.post("/api/ai/query", json=rag_payload, headers=headers_a)
    assert response.status_code == 200
    rag_response_a = response.json()
    # User A should find the diary in the context
    assert len(rag_response_a["context_used"]) > 0, "User A's RAG search failed to retrieve their own document."
    assert rag_response_a["context_used"][0]["archive_item_id"] == item_id_a
    print("✅ User A's AI RAG Query successfully retrieves their own document for context!")

    # -----------------------------------------------------
    # Test 8: Memories Isolation
    # -----------------------------------------------------
    print("\n[Test 8] Testing Legacy Memories Scoping...")
    
    # User A creates a memory
    memory_payload_a = {
        "title": "User A Memory",
        "content": "Secret memory of User A",
        "tags": "secret",
        "category": "General"
    }
    response = client.post("/api/memories/", json=memory_payload_a, headers=headers_a)
    assert response.status_code == 201
    memory_a = response.json()
    memory_id_a = memory_a["id"]
    print("✅ User A created a private legacy memory successfully!")

    # User B lists memories (should see 0)
    response = client.get("/api/memories/", headers=headers_b)
    assert response.status_code == 200
    memories_b = response.json()
    assert len(memories_b) == 0
    print("✅ User B lists 0 memories (private memory isolated)!")

    # User B tries to read User A's memory directly
    response = client.get(f"/api/memories/{memory_id_a}", headers=headers_b)
    assert response.status_code == 403, "Should reject foreign read of memory with 403 Forbidden."
    print("✅ Direct memory read by foreign user blocked!")

    # User B tries to delete User A's memory
    response = client.delete(f"/api/memories/{memory_id_a}", headers=headers_b)
    assert response.status_code == 403, "Should reject foreign deletion of memory with 403 Forbidden."
    print("✅ Direct memory deletion by foreign user blocked!")

    # User A successfully deletes their own memory
    response = client.delete(f"/api/memories/{memory_id_a}", headers=headers_a)
    assert response.status_code == 200, f"User A memory delete failed: {response.text}"
    print("✅ User A successfully deleted their own memory!")

    print("\n==================================================")
    print("🎉 ALL AUTH & ISOLATION TESTS PASSED SUCCESSFULLY! 🎉")
    print("==================================================")

if __name__ == "__main__":
    run_isolation_tests()
