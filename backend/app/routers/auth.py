"""
Remembery — Authentication Router
==================================
POST /api/auth/signup  → Register a new user with secure password hash
POST /api/auth/login   → Verify credentials and issue a JWT token
GET  /api/auth/me      → Return current authenticated user profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.database import get_db
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Dependency to validate the Bearer token in the request header and return the authenticated User.
    Raises 401 Unauthorized for invalid/expired tokens.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post(
    "/signup",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def signup(payload: schemas.UserSignup, db: Session = Depends(get_db)):
    """
    Creates a new user account with hashed password.
    Returns the created user object.
    """
    existing_user = crud.get_user_by_email(db, email=payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이메일이 이미 존재합니다.",
        )

    hashed_password = get_password_hash(payload.password)
    user_create = schemas.UserCreate(
        email=payload.email,
        display_name=payload.name,
        password=hashed_password,
        role=models.UserRole.OWNER.value,
        title="나의 기록 보관소",
        bio="나의 소중한 생애와 업적을 보존하는 공간입니다.",
    )
    user = crud.create_user(db, user_create)
    return user


@router.post(
    "/login",
    response_model=schemas.Token,
    summary="User login to acquire JWT access token",
)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Verifies user credentials. On success, issues a signed JWT access token.
    """
    user = crud.get_user_by_email(db, email=payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return schemas.Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=schemas.UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Returns the profile information of the currently authenticated user.
    """
    return current_user
