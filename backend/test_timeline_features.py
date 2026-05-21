"""
Remembery — Timeline & Resume Sync Multi-User Test Suite
==========================================================
Tests manual timeline event addition/deletion and the automatic resume sync 
during batch archive creation, enforcing strict tenant isolation.
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

# Setup Isolated In-Memory Testing Database
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

# Seed categories
def seed_test_categories(db):
    default_cats = [
        {"name": "사진", "icon": "Image", "color": "#0ea5e9", "description": "사진 및 이미지"},
        {"name": "문서", "icon": "FileText", "color": "#f59e0b", "description": "문서"},
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

db_init = TestingSessionLocal()
seed_test_categories(db_init)
db_init.close()

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def run_timeline_tests():
    print("==================================================")
    print("Remembery: Running Timeline & Resume Sync Tests")
    print("==================================================")

    # 1. Sign up User A and User B
    print("\n[Setup] Registering test users...")
    signup_a = {"email": "usera@test.com", "password": "PasswordA123!", "name": "User A"}
    res = client.post("/api/auth/signup", json=signup_a)
    assert res.status_code == 201, res.text
    user_a = res.json()

    signup_b = {"email": "userb@test.com", "password": "PasswordB123!", "name": "User B"}
    res = client.post("/api/auth/signup", json=signup_b)
    assert res.status_code == 201, res.text
    user_b = res.json()

    # 2. Login
    print("[Setup] Logging in test users...")
    res = client.post("/api/auth/login", json={"email": signup_a["email"], "password": signup_a["password"]})
    token_a = res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    res = client.post("/api/auth/login", json={"email": signup_b["email"], "password": signup_b["password"]})
    token_b = res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Add timeline events to User A
    print("\n[Test 1] Testing manual timeline addition...")
    event_payload = {"year": "2020", "event": "Started college", "icon": "🎓"}
    res = client.post("/api/users/timeline", json=event_payload, headers=headers_a)
    assert res.status_code == 200, res.text
    user_a_updated = res.json()
    assert len(user_a_updated["timeline_json"]) == 1
    assert user_a_updated["timeline_json"][0]["event"] == "Started college"
    assert user_a_updated["timeline_json"][0]["year"] == "2020"
    assert user_a_updated["timeline_json"][0]["icon"] == "🎓"
    print("✅ User A manually added a timeline event successfully!")

    # Verify User B's timeline is empty
    res = client.get("/api/auth/me", headers=headers_b)
    assert len(res.json()["timeline_json"] or []) == 0
    print("✅ User B's timeline remains completely unaffected by User A's manual edit!")

    # 4. Timeline Event Deletion Isolation
    print("\n[Test 2] Testing manual timeline deletion scoping...")
    # User B tries to delete User A's timeline event by deleting index 0 of their own profile
    # Since B has no events, deleting index 0 should do nothing to User A's events.
    res = client.delete("/api/users/timeline/0", headers=headers_b)
    assert res.status_code == 200, res.text
    assert len(res.json()["timeline_json"] or []) == 0

    # Verify User A's timeline event is still intact
    res = client.get("/api/auth/me", headers=headers_a)
    assert len(res.json()["timeline_json"]) == 1
    print("✅ Deleting on User B's scope does not affect User A's timeline events!")

    # User A deletes their own timeline event
    res = client.delete("/api/users/timeline/0", headers=headers_a)
    assert res.status_code == 200, res.text
    assert len(res.json()["timeline_json"]) == 0
    print("✅ User A successfully deleted their own timeline event!")

    # 5. Resume Import Sync and Emoji Mapping (Option A)
    print("\n[Test 3] Testing Resume Batch Import Auto-Sync & Emoji Mapping...")
    # Add a fresh event to A so we see they can coexist
    client.post("/api/users/timeline", json={"year": "2010", "event": "Born", "icon": "👶"}, headers=headers_a)

    batch_payload = {
        "owner_id": user_a["id"],
        "items": [
            {
                "title": "Graduated from High School",
                "description": "Graduation ceremony",
                "original_date": "2018",
                "source": "resume_import",
                "tags": "study",
                "custom_attributes": {"category": "study"}
            },
            {
                "title": "Software Engineer at Google",
                "description": "Building search algorithms",
                "original_date": "2021",
                "source": "resume_import",
                "tags": "career",
                "custom_attributes": {"category": "career"}
            },
            {
                "title": "Remembery Hackathon Winner",
                "description": "First place award",
                "original_date": "2025",
                "source": "resume_import",
                "tags": "award",
                "custom_attributes": {"category": "award"}
            },
            {
                "title": "Personal AI Side Project",
                "description": "Building agent coding assistant",
                "original_date": "2026",
                "source": "resume_import",
                "tags": "project",
                "custom_attributes": {"category": "project"}
            }
        ]
    }
    
    res = client.post("/api/archive/batch", json=batch_payload, headers=headers_a)
    assert res.status_code == 201, res.text
    batch_res = res.json()
    assert batch_res["created_count"] == 4
    
    # Retrieve User A's profile to verify synced timeline_json
    res = client.get("/api/auth/me", headers=headers_a)
    timeline = res.json()["timeline_json"]
    # Total events = 1 (Born) + 4 (Resume items) = 5
    assert len(timeline) == 5
    
    # Verify exact emoji mappings
    assert timeline[0]["event"] == "Born"
    assert timeline[0]["icon"] == "👶"
    
    # Study
    assert timeline[1]["event"] == "Graduated from High School"
    assert timeline[1]["icon"] == "🎓"
    
    # Career
    assert timeline[2]["event"] == "Software Engineer at Google"
    assert timeline[2]["icon"] == "💼"
    
    # Award
    assert timeline[3]["event"] == "Remembery Hackathon Winner"
    assert timeline[3]["icon"] == "🏆"
    
    # Project
    assert timeline[4]["event"] == "Personal AI Side Project"
    assert timeline[4]["icon"] == "🌱"
    
    print("✅ Resume events automatically synced to user's timeline_json with correct HSL/emoji tokens!")

    # Verify User B remains completely unaffected
    res = client.get("/api/auth/me", headers=headers_b)
    assert len(res.json()["timeline_json"] or []) == 0
    print("✅ User B's profile is fully isolated from User A's resume import sync!")

    print("\n==================================================")
    print("🎉 ALL TIMELINE & RESUME SYNC TESTS PASSED! 🎉")
    print("==================================================")

if __name__ == "__main__":
    run_timeline_tests()
