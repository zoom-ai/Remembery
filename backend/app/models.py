"""
Remembery — Core Data Models
=============================
Defines the five primary entities that power the Remembery digital archive:

  User  ─┬──<  Category
          │        └──<  ArchiveItem  ──  AIMemoryIndex   (1:1)
          │
          └──<  Exhibition  >──< ArchiveItem     (M:N via association)

Relationships
─────────────
• User          1 ──── N  Category       (creator of custom library categories)
• User          1 ──── N  ArchiveItem    (owner of uploaded archives)
• User          1 ──── N  Exhibition     (curator of exhibitions)
• Category      1 ──── N  ArchiveItem    (each item belongs to one category)
• ArchiveItem   1 ──── 1  AIMemoryIndex  (each item has one AI embedding record)
• Exhibition    M ──── N  ArchiveItem    (exhibitions contain many items, items can appear in many exhibitions)
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float,
    ForeignKey, Table, Enum, Boolean, JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# ─────────────────────────────────────────────────────────
# Enumerations (stored as VARCHAR for SQLite compatibility)
# ─────────────────────────────────────────────────────────
import enum


class UserRole(str, enum.Enum):
    """User privilege levels."""
    OWNER = "owner"           # The person whose legacy is being preserved
    ADMIN = "admin"           # Trusted curator / family member
    VISITOR = "visitor"       # General public viewer


class ArchiveItemType(str, enum.Enum):
    """Types of archivable digital materials."""
    DOCUMENT = "document"     # Letters, articles, essays
    BOOK = "book"             # Published or personal books
    PHOTO = "photo"           # Photographs
    VIDEO = "video"           # Video recordings
    AUDIO = "audio"           # Voice memos, interviews, music
    JOURNAL = "journal"       # Personal diary entries
    OTHER = "other"


class ExhibitionStatus(str, enum.Enum):
    """Publication lifecycle of an exhibition."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# ─────────────────────────────────────────────────────────
# Many-to-Many Association Table
# Exhibition <──> ArchiveItem
# ─────────────────────────────────────────────────────────
exhibition_items = Table(
    "exhibition_items",
    Base.metadata,
    Column("exhibition_id", Integer, ForeignKey("exhibitions.id", ondelete="CASCADE"), primary_key=True),
    Column("archive_item_id", Integer, ForeignKey("archive_items.id", ondelete="CASCADE"), primary_key=True),
    Column("display_order", Integer, default=0),          # Ordering within the exhibition
    Column("curator_note", Text, nullable=True),           # AI or human commentary for this item in context
    Column("added_at", DateTime, default=datetime.utcnow),
)


# ─────────────────────────────────────────────────────────
# 1. User — 유저 정보 및 권한
# ─────────────────────────────────────────────────────────
class User(Base):
    """
    Represents a registered Remembery user.

    Roles:
      • OWNER   – The individual whose legacy is preserved (주인공)
      • ADMIN   – A family member or trusted curator with management rights (관리자)
      • VISITOR – A general visitor with read-only access (방문자)
    """
    __tablename__ = "users"

    id: Mapped[int]                 = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str]              = mapped_column(String(255), unique=True, index=True, nullable=False)
    display_name: Mapped[str]       = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str]    = mapped_column(String(255), nullable=False)
    role: Mapped[str]               = mapped_column(String(20), default=UserRole.VISITOR.value)
    subtitle: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "1942 - 2024"
    title: Mapped[Optional[str]]    = mapped_column(String(255), nullable=True) # e.g. "교육자, 시인, 그리고 아버지"
    bio: Mapped[Optional[str]]      = mapped_column(Text, nullable=True)
    timeline_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # JSON list of timeline events
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool]         = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ────────────────────────────────────
    archive_items: Mapped[List["ArchiveItem"]] = relationship(
        "ArchiveItem", back_populates="owner", cascade="all, delete-orphan", lazy="selectin"
    )
    exhibitions: Mapped[List["Exhibition"]] = relationship(
        "Exhibition", back_populates="curator", cascade="all, delete-orphan", lazy="selectin"
    )
    categories: Mapped[List["Category"]] = relationship(
        "Category", back_populates="creator", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


# ─────────────────────────────────────────────────────────
# 2. Category — 사용자 커스텀 라이브러리 카테고리
# ─────────────────────────────────────────────────────────
class Category(Base):
    """
    A user-defined or system-default library category.

    Users can create custom categories (e.g. '연구 논문', '가족 편지',
    '골프 스코어카드') to organise their archive items flexibly.
    System defaults (사진, 문서, 동영상, etc.) are seeded with
    is_default=True and belong to no specific user.
    """
    __tablename__ = "categories"

    id: Mapped[int]                 = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]]  = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )  # NULL for system-default categories

    name: Mapped[str]               = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]]     = mapped_column(String(50), nullable=True)   # e.g. "FileText", "Camera", "BookOpen"
    color: Mapped[Optional[str]]    = mapped_column(String(7), nullable=True)    # Hex color e.g. "#f59e0b"
    is_default: Mapped[bool]        = mapped_column(Boolean, default=False)

    # Lifecycle
    created_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ────────────────────────────────────
    creator: Mapped[Optional["User"]] = relationship("User", back_populates="categories")

    archive_items: Mapped[List["ArchiveItem"]] = relationship(
        "ArchiveItem", back_populates="category", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}', default={self.is_default})>"


# ─────────────────────────────────────────────────────────
# 3. ArchiveItem — 디지털 자료 (문서, 도서, 사진, 동영상 등)
# ─────────────────────────────────────────────────────────
class ArchiveItem(Base):
    """
    A single unit of preserved digital material.

    Stores the file reference (URL or local path), descriptive metadata,
    and links to its owner, category, and any exhibitions it participates in.

    Classification:
      • category_id (FK) — Primary classification via the Category table.
      • item_type (str)  — Deprecated legacy field, kept for backward
                           compatibility during migration. New code should
                           use category_id exclusively.
    """
    __tablename__ = "archive_items"

    id: Mapped[int]                 = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int]           = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )  # New: references the Category table

    # Core content fields
    title: Mapped[str]              = mapped_column(String(200), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    item_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)  # Deprecated: use category_id
    file_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # S3 / local file path
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Rich metadata
    tags: Mapped[Optional[str]]     = mapped_column(Text, default="")  # Comma-separated tag list
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Flexible JSON blob (author, ISBN, EXIF, etc.)
    original_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # Date the original material was created
    source: Mapped[Optional[str]]   = mapped_column(String(300), nullable=True)  # Where the item came from

    # Lifecycle
    is_public: Mapped[bool]         = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ────────────────────────────────────
    owner: Mapped["User"] = relationship("User", back_populates="archive_items")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="archive_items")

    exhibitions: Mapped[List["Exhibition"]] = relationship(
        "Exhibition", secondary=exhibition_items, back_populates="items", lazy="selectin"
    )

    ai_index: Mapped[Optional["AIMemoryIndex"]] = relationship(
        "AIMemoryIndex", back_populates="archive_item", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        cat = self.category.name if self.category else self.item_type
        return f"<ArchiveItem(id={self.id}, title='{self.title}', category='{cat}')>"


# ─────────────────────────────────────────────────────────
# 4. Exhibition — 온라인 전시회 정보
# ─────────────────────────────────────────────────────────
class Exhibition(Base):
    """
    A curated online exhibition grouping ArchiveItems under
    a specific theme, era, or narrative arc.

    Can be auto-generated by the AI curation engine or hand-crafted
    by an ADMIN / OWNER.
    """
    __tablename__ = "exhibitions"

    id: Mapped[int]                 = mapped_column(Integer, primary_key=True, index=True)
    curator_id: Mapped[int]         = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Exhibition metadata
    title: Mapped[str]              = mapped_column(String(200), index=True, nullable=False)
    subtitle: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    theme_color: Mapped[Optional[str]]  = mapped_column(String(7), nullable=True)  # Hex color e.g. "#6366f1"

    # Temporal scope of the exhibition content
    period_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    period_end: Mapped[Optional[datetime]]   = mapped_column(DateTime, nullable=True)

    # Publication state
    status: Mapped[str]             = mapped_column(String(20), default=ExhibitionStatus.DRAFT.value)
    is_ai_generated: Mapped[bool]   = mapped_column(Boolean, default=False)

    # Lifecycle
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ────────────────────────────────────
    curator: Mapped["User"] = relationship("User", back_populates="exhibitions")

    items: Mapped[List["ArchiveItem"]] = relationship(
        "ArchiveItem", secondary=exhibition_items, back_populates="exhibitions", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Exhibition(id={self.id}, title='{self.title}', status='{self.status}')>"


# ─────────────────────────────────────────────────────────
# 5. AIMemoryIndex — AI 임베딩 값 및 요약본 (RAG 구현용)
# ─────────────────────────────────────────────────────────
class AIMemoryIndex(Base):
    """
    Stores the AI-generated embedding vector and summarised text
    for a single ArchiveItem.

    Used by the RAG (Retrieval-Augmented Generation) engine to:
      1. Perform semantic similarity searches across the entire archive.
      2. Provide context-grounded answers when visitors "converse"
         with the archived legacy.

    The embedding_vector is stored as a JSON-serialised list of floats
    for maximum portability (SQLite & Postgres).  In production with
    pgvector, this can be swapped for a native VECTOR column.
    """
    __tablename__ = "ai_memory_index"

    id: Mapped[int]                 = mapped_column(Integer, primary_key=True, index=True)
    archive_item_id: Mapped[int]    = mapped_column(
        Integer, ForeignKey("archive_items.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # AI-generated summary of the archive item content
    summary: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    key_topics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Comma-separated extracted topics

    # Embedding vector (JSON-serialised float list, e.g. 768 or 1536 dimensions)
    embedding_vector: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON: [0.012, -0.034, ...]
    embedding_model: Mapped[Optional[str]]  = mapped_column(String(100), nullable=True)  # e.g. "text-embedding-004"
    embedding_dim: Mapped[Optional[int]]    = mapped_column(Integer, nullable=True)  # e.g. 768

    # Processing state
    is_indexed: Mapped[bool]        = mapped_column(Boolean, default=False)
    indexed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[Optional[str]]      = mapped_column(Text, nullable=True)  # Error log if indexing failed

    # Lifecycle
    created_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime]    = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ────────────────────────────────────
    archive_item: Mapped["ArchiveItem"] = relationship("ArchiveItem", back_populates="ai_index")

    def __repr__(self) -> str:
        return f"<AIMemoryIndex(id={self.id}, item_id={self.archive_item_id}, indexed={self.is_indexed})>"


# ─────────────────────────────────────────────────────────
# Legacy Model — Memory (backward compatibility)
# ─────────────────────────────────────────────────────────
class Memory(Base):
    """Original simple memory model. Retained for backward compatibility
    with the existing /api/memories endpoints and frontend dashboard."""
    __tablename__ = "memories"

    id: Mapped[int]              = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str]           = mapped_column(String(200), index=True, nullable=False)
    content: Mapped[str]         = mapped_column(Text, nullable=False)
    tags: Mapped[Optional[str]]  = mapped_column(String, default="")
    category: Mapped[Optional[str]] = mapped_column(String, default="General")
    date: Mapped[Optional[datetime]]       = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
