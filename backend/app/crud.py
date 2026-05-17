"""
Remembery — CRUD Operations
==============================
Database query and transaction helpers for all core entities.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app import models, schemas


# ═════════════════════════════════════════════════════════
# User CRUD
# ═════════════════════════════════════════════════════════
def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_owner(db: Session) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.role == "owner").first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        email=user.email,
        display_name=user.display_name,
        hashed_password=user.password,  # TODO: hash with bcrypt in production
        role=user.role,
        subtitle=user.subtitle,
        title=user.title,
        bio=user.bio,
        timeline_json=user.timeline_json,
        avatar_url=user.avatar_url,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_owner(db: Session, req: schemas.OnboardingRequest) -> models.User:
    db_user = models.User(
        email="owner@remembery.local",  # Mock email for onboarding
        display_name=req.display_name,
        hashed_password="not_used_locally",
        role="owner",
        subtitle=req.subtitle,
        title=req.title,
        bio=req.bio,
        timeline_json=req.timeline_json,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# ═════════════════════════════════════════════════════════
# Category CRUD
# ═════════════════════════════════════════════════════════
def get_categories(db: Session, user_id: Optional[int] = None, include_defaults: bool = True) -> List[models.Category]:
    """Get categories. If user_id is specified, returns that user's custom categories.
    If include_defaults is True (default), system defaults are always included."""
    query = db.query(models.Category)
    if user_id is not None and include_defaults:
        query = query.filter(
            (models.Category.user_id == user_id) | (models.Category.is_default == True)  # noqa: E712
        )
    elif user_id is not None:
        query = query.filter(models.Category.user_id == user_id)
    elif include_defaults:
        query = query.filter(models.Category.is_default == True)  # noqa: E712
    return query.order_by(models.Category.is_default.desc(), models.Category.name).all()

def get_category(db: Session, category_id: int) -> Optional[models.Category]:
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def create_category(db: Session, category: schemas.CategoryCreate) -> models.Category:
    db_category = models.Category(
        user_id=category.user_id,
        name=category.name,
        description=category.description,
        icon=category.icon,
        color=category.color,
        is_default=category.is_default,
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, update_data: schemas.CategoryUpdate) -> Optional[models.Category]:
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_cat:
        return None
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(db_cat, field, value)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def delete_category(db: Session, category_id: int) -> bool:
    db_cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_cat:
        db.delete(db_cat)
        db.commit()
        return True
    return False


# ═════════════════════════════════════════════════════════
# ArchiveItem CRUD
# ═════════════════════════════════════════════════════════
def get_archive_items(db: Session, skip: int = 0, limit: int = 100, owner_id: Optional[int] = None, category_id: Optional[int] = None) -> List[models.ArchiveItem]:
    query = db.query(models.ArchiveItem)
    if owner_id:
        query = query.filter(models.ArchiveItem.owner_id == owner_id)
    if category_id:
        query = query.filter(models.ArchiveItem.category_id == category_id)
    return query.order_by(models.ArchiveItem.created_at.desc()).offset(skip).limit(limit).all()

def get_archive_item(db: Session, item_id: int) -> Optional[models.ArchiveItem]:
    return db.query(models.ArchiveItem).filter(models.ArchiveItem.id == item_id).first()

def create_archive_item(db: Session, item: schemas.ArchiveItemCreate) -> models.ArchiveItem:
    db_item = models.ArchiveItem(
        owner_id=item.owner_id,
        category_id=item.category_id,
        title=item.title,
        description=item.description,
        item_type=item.item_type,  # Deprecated fallback
        file_url=item.file_url,
        thumbnail_url=item.thumbnail_url,
        tags=item.tags,
        metadata_json=item.metadata_json,
        original_date=item.original_date,
        source=item.source,
        is_public=item.is_public,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_archive_item(db: Session, item_id: int) -> bool:
    db_item = db.query(models.ArchiveItem).filter(models.ArchiveItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False


# ═════════════════════════════════════════════════════════
# Exhibition CRUD
# ═════════════════════════════════════════════════════════
def get_exhibitions(db: Session, skip: int = 0, limit: int = 100) -> List[models.Exhibition]:
    return db.query(models.Exhibition).order_by(models.Exhibition.created_at.desc()).offset(skip).limit(limit).all()

def get_exhibition(db: Session, exhibition_id: int) -> Optional[models.Exhibition]:
    return db.query(models.Exhibition).filter(models.Exhibition.id == exhibition_id).first()

def create_exhibition(db: Session, exhibition: schemas.ExhibitionCreate) -> models.Exhibition:
    db_exhibition = models.Exhibition(
        curator_id=exhibition.curator_id,
        title=exhibition.title,
        subtitle=exhibition.subtitle,
        description=exhibition.description,
        cover_image_url=exhibition.cover_image_url,
        theme_color=exhibition.theme_color,
        period_start=exhibition.period_start,
        period_end=exhibition.period_end,
        status=exhibition.status,
        is_ai_generated=exhibition.is_ai_generated,
    )
    db.add(db_exhibition)
    db.commit()
    db.refresh(db_exhibition)
    return db_exhibition

def add_item_to_exhibition(db: Session, exhibition_id: int, item_id: int) -> bool:
    """Link an existing ArchiveItem to an Exhibition (M:N)."""
    exhibition = get_exhibition(db, exhibition_id)
    item = get_archive_item(db, item_id)
    if not exhibition or not item:
        return False
    if item not in exhibition.items:
        exhibition.items.append(item)
        db.commit()
    return True

def delete_exhibition(db: Session, exhibition_id: int) -> bool:
    db_exhibition = db.query(models.Exhibition).filter(models.Exhibition.id == exhibition_id).first()
    if db_exhibition:
        db.delete(db_exhibition)
        db.commit()
        return True
    return False


# ═════════════════════════════════════════════════════════
# AIMemoryIndex CRUD
# ═════════════════════════════════════════════════════════
def get_ai_index_by_item(db: Session, archive_item_id: int) -> Optional[models.AIMemoryIndex]:
    return db.query(models.AIMemoryIndex).filter(
        models.AIMemoryIndex.archive_item_id == archive_item_id
    ).first()

def create_ai_index(db: Session, index: schemas.AIMemoryIndexCreate) -> models.AIMemoryIndex:
    db_index = models.AIMemoryIndex(
        archive_item_id=index.archive_item_id,
        summary=index.summary,
        key_topics=index.key_topics,
        embedding_vector=index.embedding_vector,
        embedding_model=index.embedding_model,
        embedding_dim=index.embedding_dim,
    )
    db.add(db_index)
    db.commit()
    db.refresh(db_index)
    return db_index

def update_ai_index(
    db: Session,
    archive_item_id: int,
    summary: Optional[str] = None,
    key_topics: Optional[str] = None,
    embedding_vector: Optional[str] = None,
    embedding_model: Optional[str] = None,
    embedding_dim: Optional[int] = None,
) -> Optional[models.AIMemoryIndex]:
    db_index = get_ai_index_by_item(db, archive_item_id)
    if not db_index:
        return None
    if summary is not None:
        db_index.summary = summary
    if key_topics is not None:
        db_index.key_topics = key_topics
    if embedding_vector is not None:
        db_index.embedding_vector = embedding_vector
        db_index.is_indexed = True
        db_index.indexed_at = datetime.utcnow()
    if embedding_model is not None:
        db_index.embedding_model = embedding_model
    if embedding_dim is not None:
        db_index.embedding_dim = embedding_dim
    db.commit()
    db.refresh(db_index)
    return db_index


# ═════════════════════════════════════════════════════════
# Legacy Memory CRUD (backward compatibility)
# ═════════════════════════════════════════════════════════
def get_memories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Memory).order_by(models.Memory.date.desc()).offset(skip).limit(limit).all()

def get_memory(db: Session, memory_id: int):
    return db.query(models.Memory).filter(models.Memory.id == memory_id).first()

def create_memory(db: Session, memory: schemas.MemoryCreate):
    db_date = memory.date if memory.date else datetime.now()
    db_memory = models.Memory(
        title=memory.title,
        content=memory.content,
        tags=memory.tags,
        category=memory.category,
        date=db_date
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

def delete_memory(db: Session, memory_id: int):
    db_memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
    if db_memory:
        db.delete(db_memory)
        db.commit()
        return True
    return False
