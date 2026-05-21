"""
Remembery — Verification & Test Suite for Multi-User Migration
==============================================================
Tests schema changes, data backfilling, SQLAlchemy models, and security utilities.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import text, inspect
from app.database import engine, SessionLocal
from app import models
from app.utils.security import get_password_hash, verify_password


def run_tests():
    print("========================================")
    print("Remembery: Running Multi-User Verification Tests")
    print("========================================")

    # --- TEST 1: Password Security Utilities ---
    print("\n[Test 1] Testing Password Hashing & Verification...")
    test_pw = "RememberySecurePassword2026!"
    hashed = get_password_hash(test_pw)

    assert hashed != test_pw, "Password hash must not match plain password."
    assert hashed.startswith("$2b$"), "Hash should be a standard bcrypt hash (starting with $2b$)."
    assert verify_password(test_pw, hashed) is True, "Password verification failed for correct password."
    assert verify_password("WrongPassword", hashed) is False, "Password verification succeeded for incorrect password."
    print("✅ Security Password Utilities Passed!")

    # --- TEST 2: Schema Modifications ---
    print("\n[Test 2] Testing SQLite Table Column Upgrades...")
    inspector = inspect(engine)

    # Verify users table columns
    users_cols = [c["name"] for c in inspector.get_columns("users")]
    assert "name" in users_cols, "Column 'name' was not added to 'users' table."

    # Verify archive_items table columns
    archive_items_cols = [c["name"] for c in inspector.get_columns("archive_items")]
    assert "user_id" in archive_items_cols, "Column 'user_id' was not added to 'archive_items' table."

    # Verify exhibitions table columns
    exhibitions_cols = [c["name"] for c in inspector.get_columns("exhibitions")]
    assert "user_id" in exhibitions_cols, "Column 'user_id' was not added to 'exhibitions' table."

    # Verify memories table columns
    memories_cols = [c["name"] for c in inspector.get_columns("memories")]
    assert "user_id" in memories_cols, "Column 'user_id' was not added to 'memories' table."

    print("✅ SQLite Column Upgrades Checked & Verified!")

    # --- TEST 3: Data Backfill Integrity ---
    print("\n[Test 3] Testing Data Backfill Integrity...")
    with engine.connect() as connection:
        # Check users name backfill
        users_result = connection.execute(text("SELECT display_name, name FROM users;")).fetchall()
        for display_name, name in users_result:
            assert name == display_name, f"User name '{name}' does not match display_name '{display_name}'."

        # Check archive_items user_id backfill
        items_result = connection.execute(text("SELECT owner_id, user_id FROM archive_items;")).fetchall()
        for owner_id, user_id in items_result:
            assert user_id == owner_id, f"ArchiveItem user_id '{user_id}' does not match owner_id '{owner_id}'."

    print("✅ SQLite Data Backfill Verified successfully!")

    # --- TEST 4: SQLAlchemy Relationship Integrations ---
    print("\n[Test 4] Testing SQLAlchemy Relationship Mapping...")
    db = SessionLocal()
    try:
        # Fetch the main legacy user
        user = db.query(models.User).filter_by(id=1).first()
        if user:
            print(f"Found User ID 1: {user.display_name} (email: {user.email})")

            # Check archive_items relationship
            print(f"User archive items count: {len(user.archive_items)}")
            print(f"User archive items (by user relationship) count: {len(user.archive_items_by_user)}")

            # Check that both collections are identical for single-user backfill
            assert len(user.archive_items) == len(user.archive_items_by_user), \
                "Legacy owner collection and modern user collections differ in size."

            if user.archive_items:
                first_item = user.archive_items_by_user[0]
                print(f"First item title: '{first_item.title}', owner ID: {first_item.owner_id}, user ID: {first_item.user_id}")
                assert first_item.user_id == 1, "First archive item is not associated with User 1."
        else:
            print("⚠️ Warning: No User found in DB for relation testing.")
    finally:
        db.close()

    print("✅ SQLAlchemy Relationships Tested successfully!")

    print("\n========================================")
    print("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉")
    print("========================================")


if __name__ == "__main__":
    run_tests()
