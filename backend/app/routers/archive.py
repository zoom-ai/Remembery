"""
Remembery — Archive Router
============================
POST /api/archive/upload  → Upload a new archive item with metadata + auto AI indexing
GET  /api/archive/list    → Search & filter uploaded archive items
GET  /api/archive/{id}    → Retrieve a single archive item by ID
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, crud, schemas
from app.database import get_db

router = APIRouter(
    prefix="/archive",
    tags=["archive"],
)


def _item_to_response(item: models.ArchiveItem) -> schemas.ArchiveItemResponse:
    """Build ArchiveItemResponse with denormalised category_name."""
    data = schemas.ArchiveItemResponse.model_validate(item)
    if item.category:
        data.category_name = item.category.name
    return data

# ─────────────────────────────────────────────────────────
# POST /upload — Upload & register a new archive item
# ─────────────────────────────────────────────────────────
@router.post(
    "/upload",
    response_model=schemas.ArchiveUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new archive item",
    description="Creates an ArchiveItem record with metadata. "
                "If `auto_index` is true, an AIMemoryIndex stub is created "
                "automatically for later embedding generation.",
)
def upload_archive_item(
    payload: schemas.ArchiveUploadRequest,
    db: Session = Depends(get_db),
):
    # 1. Validate that the owner exists
    owner = crud.get_user(db, payload.owner_id)
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id={payload.owner_id} not found. "
                   "Please register the owner first.",
        )

    # 2. Create the ArchiveItem record
    item_schema = schemas.ArchiveItemCreate(
        owner_id=payload.owner_id,
        category_id=payload.category_id,
        title=payload.title,
        description=payload.description,
        item_type=payload.item_type,
        file_url=payload.file_url,
        thumbnail_url=payload.thumbnail_url,
        tags=payload.tags,
        metadata_json=payload.metadata_json,
        original_date=payload.original_date,
        source=payload.source,
        is_public=payload.is_public,
    )
    db_item = crud.create_archive_item(db, item_schema)

    # 3. Optionally create an AIMemoryIndex stub for future embedding
    ai_index_status = "skipped"
    if payload.auto_index:
        # Resolve category name for context enrichment
        category_label = ""
        if db_item.category_id:
            cat = crud.get_category(db, db_item.category_id)
            if cat:
                category_label = cat.name

        # Build context-enriched summary that tells the RAG engine
        # which category this item belongs to
        context_prefix = (
            f"[카테고리: {category_label}] " if category_label else ""
        )
        enriched_summary = (
            f"{context_prefix}"
            f"[Pending] Auto-summary for: {db_item.title}"
        )

        # Prepend category as a topic for semantic retrieval
        base_topics = payload.tags or ""
        enriched_topics = (
            f"{category_label}, {base_topics}" if category_label else base_topics
        )

        ai_index_schema = schemas.AIMemoryIndexCreate(
            archive_item_id=db_item.id,
            summary=enriched_summary,
            key_topics=enriched_topics,
            embedding_vector=None,
            embedding_model=None,
            embedding_dim=None,
        )
        crud.create_ai_index(db, ai_index_schema)
        ai_index_status = "pending"

    # 4. Re-query to include relationships in the response
    db_item = crud.get_archive_item(db, db_item.id)

    return schemas.ArchiveUploadResponse(
        item=_item_to_response(db_item),
        ai_index_status=ai_index_status,
        message=f"Archive item '{db_item.title}' uploaded successfully.",
    )


# ─────────────────────────────────────────────────────────
# GET /list — Search & filter archive items
# ─────────────────────────────────────────────────────────
@router.get(
    "/list",
    response_model=schemas.ArchiveListResponse,
    summary="List archive items with filtering & search",
    description="Returns a paginated, filterable list of archive items. "
                "Supports keyword search (title, description, tags), "
                "item type filtering, owner scoping, and public/private filtering.",
)
def list_archive_items(
    q: Optional[str] = Query(None, description="Keyword search across title, description, tags"),
    item_type: Optional[str] = Query(None, description="Filter by legacy item type (deprecated)"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    owner_id: Optional[int] = Query(None, description="Filter by owner user ID"),
    is_public: Optional[bool] = Query(None, description="Filter by public visibility"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
):
    # Build dynamic query
    query = db.query(models.ArchiveItem)

    # Apply filters
    if owner_id is not None:
        query = query.filter(models.ArchiveItem.owner_id == owner_id)
    if category_id is not None:
        query = query.filter(models.ArchiveItem.category_id == category_id)
    if item_type is not None:
        query = query.filter(models.ArchiveItem.item_type == item_type)
    if is_public is not None:
        query = query.filter(models.ArchiveItem.is_public == is_public)

    # Keyword search across multiple text fields
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                models.ArchiveItem.title.ilike(search_pattern),
                models.ArchiveItem.description.ilike(search_pattern),
                models.ArchiveItem.tags.ilike(search_pattern),
                models.ArchiveItem.source.ilike(search_pattern),
            )
        )

    # Get total count before pagination
    total = query.count()

    # Apply ordering and pagination
    items = (
        query
        .order_by(models.ArchiveItem.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return schemas.ArchiveListResponse(
        items=[_item_to_response(item) for item in items],
        total=total,
        skip=skip,
        limit=limit,
        filters_applied={
            "q": q,
            "item_type": item_type,
            "category_id": category_id,
            "owner_id": owner_id,
            "is_public": is_public,
        },
    )


# ─────────────────────────────────────────────────────────
# GET /{item_id} — Retrieve a single archive item
# ─────────────────────────────────────────────────────────
@router.get(
    "/{item_id}",
    response_model=schemas.ArchiveItemResponse,
    summary="Get a single archive item by ID",
)
def get_archive_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = crud.get_archive_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Archive item not found")
    return item
