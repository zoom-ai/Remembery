"""
Remembery — Security & Password Utilities
=========================================
Provides secure password hashing and verification using the bcrypt library directly.
Used for user authentication.
"""

import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "remembery-eternal-secret-key-super-secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against its corresponding hashed password.
    """
    try:
        # bcrypt.checkpw expects bytes for both arguments
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception as e:
        print(f"[Security Helper] Error verifying password: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Generate a secure bcrypt hash of a plain text password.
    """
    # bcrypt.hashpw expects bytes for both arguments and returns bytes
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token signed with our SECRET_KEY.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT access token. Returns None if invalid or expired.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


