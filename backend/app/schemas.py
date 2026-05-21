"""
Remembery — Pydantic Schemas
==============================
Request / Response validation schemas for all core entities.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr


# ─────────────────────────────────────────────────────────
# User Schemas
# ─────────────────────────────────────────────────────────
class UserBase(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    display_name: str = Field(..., min_length=1, max_length=100)
    role: Optional[str] = "visitor"
    subtitle: Optional[str] = None # Deprecated
    title: Optional[str] = None
    bio: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    birth_place: Optional[str] = None
    resting_place: Optional[str] = None
    motto: Optional[str] = None
    timeline_json: Optional[list] = None
    avatar_url: Optional[str] = None

class OnboardingRequest(BaseModel):
    display_name: str
    title: Optional[str] = None
    bio: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    birth_place: Optional[str] = None
    resting_place: Optional[str] = None
    motto: Optional[str] = None
    timeline_json: Optional[list] = None

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    birth_place: Optional[str] = None
    resting_place: Optional[str] = None
    motto: Optional[str] = None

class TimelineEventCreate(BaseModel):
    year: str = Field(..., min_length=1, max_length=20)
    event: str = Field(..., min_length=1, max_length=200)
    icon: Optional[str] = "🌱"

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────
# Category Schemas
# ─────────────────────────────────────────────────────────
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryCreate(CategoryBase):
    user_id: Optional[int] = Field(None, description="NULL for system-default categories")
    is_default: bool = False

class CategoryUpdate(BaseModel):
    """Partial update schema — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    user_id: Optional[int] = None
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CustomFieldSuggestion(BaseModel):
    key: str = Field(..., description="영문 key")
    label: str = Field(..., description="한국어 설명")
    type: str = Field(..., description="데이터 타입 (e.g. 'text', 'date', 'number')")


# ─────────────────────────────────────────────────────────
# ArchiveItem Schemas
# ─────────────────────────────────────────────────────────
class ArchiveItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    item_type: Optional[str] = None  # Deprecated: use category_id
    category_id: Optional[int] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: Optional[str] = ""
    metadata_json: Optional[str] = None
    original_date: Optional[datetime] = None
    source: Optional[str] = None
    ai_summary: Optional[str] = None
    highlight_quote: Optional[str] = None
    preview_url: Optional[str] = None
    custom_attributes: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = True

class ArchiveItemCreate(ArchiveItemBase):
    owner_id: int

class ArchiveItemResponse(ArchiveItemBase):
    id: int
    owner_id: int
    category_name: Optional[str] = None  # Denormalised for convenience
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


# ╔═════════════════════════════════════════════════════════╗
# ║  ENDPOINT-SPECIFIC DTOs (Request / Response)           ║
# ╚═════════════════════════════════════════════════════════╝

# ─────────────────────────────────────────────────────────
# POST /api/archive/upload — Archive Upload DTOs
# ─────────────────────────────────────────────────────────
class ArchiveUploadRequest(BaseModel):
    """Request body for uploading a new archive item."""
    owner_id: int = Field(..., description="ID of the user who owns this item")
    title: str = Field(..., min_length=1, max_length=200, description="Title of the archive item")
    description: Optional[str] = Field(None, description="Human-readable description of the item")
    category_id: Optional[int] = Field(None, description="Category ID from the categories table")
    item_type: Optional[str] = Field(None, description="Deprecated: use category_id instead")
    file_url: Optional[str] = Field(None, description="URL or local path to the uploaded file")
    thumbnail_url: Optional[str] = Field(None, description="URL of the preview thumbnail")
    tags: Optional[str] = Field("", description="Comma-separated tags, e.g. 'family, 1990s, letters'")
    metadata_json: Optional[str] = Field(None, description="Arbitrary JSON metadata (author, ISBN, EXIF, etc.)")
    original_date: Optional[datetime] = Field(None, description="Date the original material was created")
    source: Optional[str] = Field(None, description="Origin of the material")
    is_public: bool = Field(True, description="Whether this item is visible to visitors")
    auto_index: bool = Field(True, description="Automatically generate AI summary & embedding on upload")

class ArchiveUploadResponse(BaseModel):
    """Response after a successful archive upload."""
    item: ArchiveItemResponse
    ai_index_status: str = Field(..., description="'indexed', 'pending', or 'skipped'")
    message: str

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────
# GET /api/archive/list — Archive List / Search DTOs
# ─────────────────────────────────────────────────────────
class ArchiveListResponse(BaseModel):
    """Paginated response for archive listing."""
    items: List[ArchiveItemResponse]
    total: int
    skip: int
    limit: int
    filters_applied: dict


# ─────────────────────────────────────────────────────────
# POST /api/ai/query — RAG Q&A DTOs
# ─────────────────────────────────────────────────────────
class RAGQueryRequest(BaseModel):
    """Visitor's question sent to the RAG pipeline."""
    question: str = Field(..., min_length=1, max_length=1000, description="The visitor's question")
    owner_id: Optional[int] = Field(None, description="Scope search to a specific owner's archive")
    top_k: int = Field(3, ge=1, le=10, description="Number of context documents to retrieve")
    language: str = Field("ko", description="Preferred response language: 'ko' or 'en'")

class RAGContextChunk(BaseModel):
    """A single retrieved context document used to ground the answer."""
    archive_item_id: int
    title: str
    snippet: str = Field(..., description="Relevant excerpt from the archive item")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score")

class RAGQueryResponse(BaseModel):
    """LLM-generated answer grounded in retrieved archive context."""
    answer: str = Field(..., description="AI-generated answer based on archive context")
    context_used: List[RAGContextChunk] = Field(..., description="Retrieved documents that grounded the answer")
    model: str = Field(..., description="LLM model used for generation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Estimated confidence of the answer")
    disclaimer: str = Field(
        "이 답변은 아카이브에 보관된 실제 기록을 기반으로 AI가 생성한 것입니다.",
        description="Legal/ethical disclaimer"
    )


# ─────────────────────────────────────────────────────────
# POST /api/exhibition/curate — AI Exhibition Curation DTOs
# ─────────────────────────────────────────────────────────
class CurationRequest(BaseModel):
    """Request for AI-curated exhibition scenario generation."""
    curator_id: int = Field(..., description="ID of the user requesting curation")
    theme: str = Field(..., min_length=1, max_length=200, description="Exhibition theme, e.g. '1990년대 가족 여행의 기록'")
    description: Optional[str] = Field(None, description="Additional context or instructions for the AI curator")
    max_items: int = Field(10, ge=1, le=50, description="Maximum number of items to include")
    language: str = Field("ko", description="Preferred output language: 'ko' or 'en'")
    theme_color: Optional[str] = Field(None, description="Optional custom hex color theme override")
    layout_style: Optional[str] = Field(None, description="Optional layout style preset: 'timeline', 'grid', 'slideshow', 'bento'")

class CuratedItemSummary(BaseModel):
    """Summary of an archive item selected for the exhibition."""
    archive_item_id: int
    title: str
    item_type: str
    ai_curator_note: str = Field(..., description="AI-written commentary for this item in the exhibition context")
    display_order: int
    relevance_score: float

class CurationResponse(BaseModel):
    """AI-generated exhibition scenario."""
    exhibition_title: str
    exhibition_subtitle: str
    exhibition_description: str
    theme_color: str = Field(..., description="Suggested hex color for the exhibition, e.g. '#6366f1'")
    layout_style: str = Field("timeline", description="Chosen layout style for rendering this exhibition")
    curated_items: List[CuratedItemSummary]
    total_items_reviewed: int
    model: str = Field(..., description="AI model used for curation")
    message: str


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


# ─────────────────────────────────────────────────────────
# POST /api/archive/batch — Batch Archive Upload DTOs
# ─────────────────────────────────────────────────────────
class BatchArchiveItemInput(BaseModel):
    """A single item in a batch upload request."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category_id: Optional[int] = None
    item_type: Optional[str] = None
    tags: Optional[str] = ""
    original_date: Optional[str] = None
    source: Optional[str] = "resume_import"
    custom_attributes: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = True

class BatchArchiveRequest(BaseModel):
    """Request body for POST /api/archive/batch"""
    owner_id: int = Field(..., description="ID of the user who owns these items")
    items: List[BatchArchiveItemInput] = Field(..., min_length=1, description="List of items to create")

class BatchArchiveResponse(BaseModel):
    """Response body for POST /api/archive/batch"""
    created_count: int
    item_ids: List[int]
    message: str


# ─────────────────────────────────────────────────────────
# Resume / CV Parsing Schemas
# ─────────────────────────────────────────────────────────
class ResumeParseRequest(BaseModel):
    """Request body for POST /api/resume/parse"""
    resume_text: str = Field(
        ...,
        min_length=10,
        max_length=100000,
        description="Plain-text content of the resume / CV to analyze."
    )
    include_competency: bool = Field(
        default=False,
        description="If true, additionally returns a 5-axis competency assessment."
    )

class ResumeTimelineEvent(BaseModel):
    """A single timeline event extracted from a resume."""
    year: str = Field(..., description="Year or period (e.g. '2015' or '2018-2020')")
    title: str = Field(..., description="Activity name or job title")
    description: str = Field(default="", description="Detailed description (1-2 sentences, Korean)")
    category: str = Field(default="career", description="One of: career, study, project, award")

class ResumeCompetency(BaseModel):
    """A single competency dimension score."""
    key: str = Field(..., description="Competency key (e.g. 'technical_skill')")
    label: str = Field(..., description="Korean display label (e.g. '기술력')")
    score: int = Field(..., ge=0, le=100, description="Score from 0 to 100")
    reason: str = Field(default="", description="One-line Korean justification")

class ResumeParseResponse(BaseModel):
    """Response body for POST /api/resume/parse"""
    timeline_events: List[ResumeTimelineEvent] = Field(
        default_factory=list,
        description="Extracted career/education/project events for timeline creation."
    )
    competency: Optional[List[ResumeCompetency]] = Field(
        default=None,
        description="5-axis competency assessment (only when include_competency=true)."
    )


# ─────────────────────────────────────────────────────────
# User Authentication Schemas
# ─────────────────────────────────────────────────────────
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

