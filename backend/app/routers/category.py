"""
Remembery — Category Router
==============================
POST   /api/categories        → Create a new custom category
GET    /api/categories        → List categories (system defaults + user custom)
GET    /api/categories/{id}   → Get a single category
PATCH  /api/categories/{id}   → Update category name, description, icon, color
DELETE /api/categories/{id}   → Delete a custom category (system defaults are protected)
POST   /api/categories/seed   → Seed default system categories (dev/setup utility)
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, crud, schemas
from app.database import get_db
from app.services import ai_service
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)

# System default categories to seed
DEFAULT_CATEGORIES = [
    {"name": "사진",     "icon": "Image",    "color": "#0ea5e9", "description": "사진 및 이미지 자료"},
    {"name": "문서",     "icon": "FileText", "color": "#f59e0b", "description": "편지, 보고서, 에세이 등 텍스트 문서"},
    {"name": "동영상",   "icon": "Video",    "color": "#ef4444", "description": "비디오 녹화물 및 영상 기록"},
    {"name": "도서",     "icon": "BookOpen", "color": "#10b981", "description": "출판물, 개인 서적, 논문"},
    {"name": "음성",     "icon": "Music",    "color": "#8b5cf6", "description": "음성 녹음, 인터뷰, 음악"},
    {"name": "일기",     "icon": "PenLine",  "color": "#f97316", "description": "개인 일기 및 저널"},
]


# ─────────────────────────────────────────────────────────
# POST / — Create a new custom category
# ─────────────────────────────────────────────────────────
@router.post(
    "/",
    response_model=schemas.CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new custom category",
)
def create_category(
    payload: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Enforce scoping: set user_id to current_user.id
    payload.user_id = current_user.id

    # Check for duplicate name under the same user scope
    existing = db.query(models.Category).filter(
        models.Category.name == payload.name,
        models.Category.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{payload.name}' already exists for this user.",
        )

    return crud.create_category(db, payload)


# ─────────────────────────────────────────────────────────
# GET / — List categories
# ─────────────────────────────────────────────────────────
@router.get(
    "/",
    response_model=List[schemas.CategoryResponse],
    summary="List categories (defaults + user custom)",
)
def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Retrieve user's custom categories plus system defaults
    return crud.get_categories(db, user_id=current_user.id, include_defaults=True)


# ─────────────────────────────────────────────────────────
# GET /suggest-fields — Suggest custom fields based on category name
# ─────────────────────────────────────────────────────────
@router.get(
    "/suggest-fields",
    response_model=List[schemas.CustomFieldSuggestion],
    summary="Get AI-suggested custom fields for a category name",
    description="Calls the Gemini API to get a tailored list of custom fields "
                "or returns a high-quality local fallback recommendation.",
)
def suggest_fields(
    category_name: str = Query(..., description="The name of the category (e.g. '학술 논문')"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not category_name or not category_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name query parameter is required.",
        )
    return ai_service.suggest_custom_fields_ai(category_name)


# ─────────────────────────────────────────────────────────
# GET /{category_id} — Get a single category
# ─────────────────────────────────────────────────────────
@router.get(
    "/{category_id}",
    response_model=schemas.CategoryResponse,
    summary="Get a single category by ID",
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if not cat.is_default and cat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this category")
    return cat


# ─────────────────────────────────────────────────────────
# PATCH /{category_id} — Update a category
# ─────────────────────────────────────────────────────────
@router.patch(
    "/{category_id}",
    response_model=schemas.CategoryResponse,
    summary="Update a category (name, description, icon, color)",
    description="Partial update — only fields included in the request body "
                "will be modified. System default category names are protected "
                "from renaming, but description/icon/color can still be changed.",
)
def update_category(
    category_id: int,
    payload: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    if cat.is_default:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System default categories cannot be modified."
        )
    if cat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this category."
        )

    # Check for duplicate name under the same user scope
    if payload.name is not None and payload.name != cat.name:
        existing = db.query(models.Category).filter(
            models.Category.name == payload.name,
            models.Category.user_id == current_user.id,
            models.Category.id != category_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category '{payload.name}' already exists for this user.",
            )

    updated = crud.update_category(db, category_id, payload)
    return updated


# ─────────────────────────────────────────────────────────
# DELETE /{category_id} — Delete a custom category
# ─────────────────────────────────────────────────────────
@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a custom category (defaults are protected)",
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.is_default:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System default categories cannot be deleted.",
        )
    if cat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this category.",
        )
    crud.delete_category(db, category_id)


# ─────────────────────────────────────────────────────────
# POST /seed — Seed default system categories
# ─────────────────────────────────────────────────────────
@router.post(
    "/seed",
    response_model=List[schemas.CategoryResponse],
    summary="Seed default system categories",
    description="Idempotent: only creates defaults that don't already exist.",
)
def seed_default_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    created = []
    for cat_data in DEFAULT_CATEGORIES:
        existing = db.query(models.Category).filter(
            models.Category.name == cat_data["name"],
            models.Category.is_default == True,  # noqa: E712
        ).first()
        if not existing:
            schema = schemas.CategoryCreate(
                name=cat_data["name"],
                description=cat_data["description"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                is_default=True,
                user_id=None,
            )
            created.append(crud.create_category(db, schema))
        else:
            created.append(existing)
    return created

