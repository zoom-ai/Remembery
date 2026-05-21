"""
Remembery — Database Migration System
=====================================
Executes safe SQLite schema updates to migrate from single-user to multi-user architecture.
Runs automatically on startup.
"""

import logging
from sqlalchemy import text
from app.database import engine

logger = logging.getLogger("remembery.migration")
logging.basicConfig(level=logging.INFO)


def run_migrations():
    logger.info("Starting database migration check...")

    with engine.begin() as connection:
        # Helper function to inspect columns in a table
        def get_columns(table_name):
            try:
                result = connection.execute(text(f"PRAGMA table_info({table_name});"))
                return [row[1] for row in result.fetchall()]
            except Exception as e:
                logger.warning(f"Could not inspect columns for {table_name}: {e}")
                return []

        # Check existing tables and columns
        users_cols = get_columns("users")
        archive_items_cols = get_columns("archive_items")
        exhibitions_cols = get_columns("exhibitions")
        memories_cols = get_columns("memories")

        # Check if target tables exist. If users doesn't exist, SQLAlchemy hasn't created tables yet.
        # In this case, Base.metadata.create_all() will create them with the new schema, so we skip migration.
        if not users_cols:
            logger.info("Users table not found. Skipping migration since DB might be brand new.")
            return

        # 1. Add columns if they do not exist
        # Add 'name' to 'users' table
        if "name" not in users_cols:
            logger.info("Adding 'name' column to 'users' table...")
            connection.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(100);"))

        # Add 'user_id' to 'archive_items' table
        if "user_id" not in archive_items_cols:
            logger.info("Adding 'user_id' column to 'archive_items' table...")
            connection.execute(
                text("ALTER TABLE archive_items ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;")
            )

        # Add 'user_id' to 'exhibitions' table
        if "user_id" not in exhibitions_cols:
            logger.info("Adding 'user_id' column to 'exhibitions' table...")
            connection.execute(
                text("ALTER TABLE exhibitions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;")
            )

        # Add 'user_id' to 'memories' table
        if "user_id" not in memories_cols:
            logger.info("Adding 'user_id' column to 'memories' table...")
            connection.execute(
                text("ALTER TABLE memories ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;")
            )

        # 2. Data Backfilling and Copying
        logger.info("Performing data backfill and copying...")

        # Copy display_name to name in users
        connection.execute(text("UPDATE users SET name = display_name WHERE name IS NULL;"))

        # Backfill user_id from owner_id in archive_items
        if "owner_id" in archive_items_cols:
            connection.execute(text("UPDATE archive_items SET user_id = owner_id WHERE user_id IS NULL;"))

        # Backfill user_id from curator_id in exhibitions
        if "curator_id" in exhibitions_cols:
            connection.execute(text("UPDATE exhibitions SET user_id = curator_id WHERE user_id IS NULL;"))

        # Find a fallback user ID (defaulting to 1, or first user in database)
        user_id_result = connection.execute(text("SELECT id FROM users LIMIT 1;")).fetchone()
        if user_id_result:
            fallback_user_id = user_id_result[0]
        else:
            fallback_user_id = 1

        # Backfill user_id to fallback in memories
        connection.execute(
            text("UPDATE memories SET user_id = :fallback_id WHERE user_id IS NULL;"),
            {"fallback_id": fallback_user_id}
        )

        logger.info("Database migration check completed successfully.")


if __name__ == "__main__":
    run_migrations()
