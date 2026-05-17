"""
Remembery — Pydantic Schemas
==============================
Request / Response validation schemas for all core entities.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


# ─────────────────────────────────────────────────────────
# User Schemas
# ─────────────────────────────────────────────────────────
class UserBase(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    display_name: str = Field(..., min_length=1, max_length=100)
    role: Optional[str] = "visitor"
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────
# ArchiveItem Schemas
# ─────────────────────────────────────────────────────────
class ArchiveItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    item_type: Optional[str] = "document"
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: Optional[str] = ""
    metadata_json: Optional[str] = None
    original_date: Optional[datetime] = None
    source: Optional[str] = None
    is_public: Optional[bool] = True

class ArchiveItemCreate(ArchiveItemBase):
    owner_id: int

class ArchiveItemResponse(ArchiveItemBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────
# Exhibition Schemas
# ─────────────────────────────────────────────────────────
class ExhibitionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    subtitle: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    theme_color: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    status: Optional[str] = "draft"
    is_ai_generated: Optional[bool] = False

class ExhibitionCreate(ExhibitionBase):
    curator_id: int

class ExhibitionResponse(ExhibitionBase):
    id: int
    curator_id: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[ArchiveItemResponse] = []

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────
# AIMemoryIndex Schemas
# ─────────────────────────────────────────────────────────
class AIMemoryIndexBase(BaseModel):
    summary: Optional[str] = None
    key_topics: Optional[str] = None
    embedding_model: Optional[str] = None
    embedding_dim: Optional[int] = None

class AIMemoryIndexCreate(AIMemoryIndexBase):
    archive_item_id: int
    embedding_vector: Optional[str] = None  # JSON-serialised float list

class AIMemoryIndexResponse(AIMemoryIndexBase):
    id: int
    archive_item_id: int
    is_indexed: bool
    indexed_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────
# Legacy Memory Schemas (backward compatibility)
# ─────────────────────────────────────────────────────────
class MemoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str
    tags: Optional[str] = ""
    category: Optional[str] = "General"
    date: Optional[datetime] = None

class MemoryCreate(MemoryBase):
    pass

class MemoryResponse(MemoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
