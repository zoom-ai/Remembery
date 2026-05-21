"""
Remembery — Archive Router
============================
POST /api/archive/upload  → Upload a new archive item with metadata + auto AI indexing
GET  /api/archive/list    → Search & filter uploaded archive items
GET  /api/archive/{id}    → Retrieve a single archive item by ID
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile, Form, BackgroundTasks
from sqlalchemy import or_
from sqlalchemy.orm import Session
import os
import uuid
import re
import json

from app import models, crud, schemas
from app.database import get_db
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/archive",
    tags=["archive"],
)


def process_archive_ai_background(
    item_id: int,
    file_path: Optional[str],
    category_name: str,
    title: str,
    description: Optional[str]
):
    """Asynchronous background worker to analyze files and generate rich preview metrics."""
    from app.services import ai_service
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        # 1. Retrieve the archive item
        db_item = db.query(models.ArchiveItem).filter(models.ArchiveItem.id == item_id).first()
        if not db_item:
            print(f"[AI Background] Archive item {item_id} not found.")
            return

        # 2. Determine file category
        cat_lower = category_name.lower() if category_name else ""
        file_ext = os.path.splitext(file_path)[1].lower() if file_path else ""

        is_image = any(k in cat_lower for k in ["사진", "이미지", "photo", "image"]) or file_ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"]
        is_video = any(k in cat_lower for k in ["동영상", "비디오", "영상", "video", "movie"]) or file_ext in [".mp4", ".mov", ".avi", ".mkv"]
        is_doc = any(k in cat_lower for k in ["문서", "책", "도서", "일기", "편지", "doc", "book", "pdf", "txt"]) or file_ext in [".pdf", ".txt", ".docx"]

        print(f"[AI Background] Processing item {item_id} (Type: Image={is_image}, Video={is_video}, Doc={is_doc})")

        # 3. Invoke appropriate AI service
        custom_attrs = db_item.custom_attributes
        ai_data = {"ai_summary": None, "highlight_quote": None}
        if is_image:
            ai_data = ai_service.analyze_image(file_path, title, description, custom_attrs, category_name)
        elif is_video:
            ai_data = ai_service.analyze_video(file_path, title, description, custom_attrs, category_name)
        else:  # Default to document
            ai_data = ai_service.analyze_document(file_path, title, description, custom_attrs, category_name)

        # 4. Update the DB record
        db_item.ai_summary = ai_data.get("ai_summary")
        db_item.highlight_quote = ai_data.get("highlight_quote")
        
        if is_image:
            db_item.preview_url = db_item.file_url
        else:
            db_item.preview_url = None

        db.commit()
        print(f"[AI Background] Completed processing for item {item_id}. Saved to DB.")

        # 5. Also update AIMemoryIndex stub if it exists
        ai_index = db.query(models.AIMemoryIndex).filter(models.AIMemoryIndex.archive_item_id == item_id).first()
        if ai_index:
            context_prefix = f"[카테고리: {category_name}] " if category_name else ""
            summary_body = db_item.ai_summary or f"Auto-summary for: {db_item.title}"
            
            # Synthesize custom attributes to enrich RAG search context
            synthesized_str = ai_service.synthesize_custom_attributes(custom_attrs, category_name)
            if synthesized_str:
                summary_body = f"{summary_body} {synthesized_str}"
                
            ai_index.summary = f"{context_prefix}{summary_body}"
            ai_index.is_indexed = True
            db.commit()
            print(f"[AI Background] Updated AIMemoryIndex for item {item_id}.")

    except Exception as e:
        print(f"[AI Background ERROR] Failed processing item {item_id}: {e}")
        db.rollback()
    finally:
        db.close()


def _item_to_response(item: models.ArchiveItem) -> schemas.ArchiveItemResponse:
    """Build ArchiveItemResponse with denormalised category_name."""
    data = schemas.ArchiveItemResponse.model_validate(item)
    if item.category:
        data.category_name = item.category.name
    return data

# ─────────────────────────────────────────────────────────
# POST /parse-exif — Parse EXIF metadata from uploaded image
# ─────────────────────────────────────────────────────────
@router.post(
    "/parse-exif",
    summary="Parse EXIF metadata from an uploaded image",
    description="Parses and returns EXIF tags (Make, Model, DateTimeOriginal, GPSLatitude, GPSLongitude) from an uploaded image without saving it.",
)
def parse_image_exif(
    file: UploadFile = File(...),
):
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    is_image = (file.content_type and file.content_type.startswith("image/")) or file_ext in [".jpg", ".jpeg", ".png", ".webp"]
    if not is_image:
        return {}

    try:
        temp_name = f"temp_{uuid.uuid4().hex}{file_ext}"
        temp_path = os.path.join("uploads", temp_name)
        
        os.makedirs("uploads", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(file.file.read())
            
        try:
            from app.utils.exif import extract_image_exif
            exif_data = extract_image_exif(temp_path)
            return exif_data
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    except Exception as e:
        print(f"[Parse EXIF Route Error] Failed to parse: {e}")
        return {}


# ─────────────────────────────────────────────────────────
# POST /upload — Upload & register a new archive item
# ─────────────────────────────────────────────────────────
@router.post(
    "/upload",
    response_model=schemas.ArchiveUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new archive item",
    description="Creates an ArchiveItem record with metadata and saves the uploaded file locally. "
                "If `auto_index` is true, an AIMemoryIndex stub is created "
                "automatically for later embedding generation.",
)
def upload_archive_item(
    background_tasks: BackgroundTasks,
    owner_id: Optional[int] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    item_type: Optional[str] = Form(None),
    tags: Optional[str] = Form(""),
    metadata_json: Optional[str] = Form(None),
    custom_attributes: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
    auto_index: bool = Form(False),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Enforce multi-tenant scoping: set owner_id to current_user.id
    owner_id = current_user.id

    # Resolve category name for directory creation and context enrichment
    category_label = ""
    cat_dir_name = "uncategorized"
    if category_id:
        cat = crud.get_category(db, category_id)
        if cat:
            if not cat.is_default and cat.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to use this category"
                )
            category_label = cat.name
            # Create a safe directory name
            cat_dir_name = re.sub(r'[^a-zA-Z0-9_\-\uac00-\ud7a3]', '_', cat.name)

    # Save the file locally if provided
    file_url = None
    file_path = None
    if file:
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        
        # Determine the directory path
        upload_dir = os.path.join("uploads", cat_dir_name)
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, unique_filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
            
        file_url = f"/uploads/{cat_dir_name}/{unique_filename}"

    # 2. Create the ArchiveItem record
    custom_attrs_dict = None
    if custom_attributes:
        try:
            custom_attrs_dict = json.loads(custom_attributes)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON format for custom_attributes: {e}"
            )

    # Automatically extract EXIF metadata for images if custom_attributes is not provided
    if file and file_path:
        file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        is_image = (file.content_type and file.content_type.startswith("image/")) or file_ext in [".jpg", ".jpeg", ".png", ".webp"]
        if is_image and not custom_attrs_dict:
            try:
                from app.utils.exif import extract_image_exif
                exif_data = extract_image_exif(file_path)
                custom_attrs_dict = exif_data
            except Exception as e:
                print(f"[EXIF Router Error] Failed during extraction: {e}")
                custom_attrs_dict = {}

    item_schema = schemas.ArchiveItemCreate(
        owner_id=owner_id,
        category_id=category_id,
        title=title,
        description=description,
        item_type=item_type,
        file_url=file_url,
        thumbnail_url=None,
        tags=tags,
        metadata_json=metadata_json,
        custom_attributes=custom_attrs_dict,
        original_date=None,
        source=source,
        is_public=False,
    )
    db_item = crud.create_archive_item(db, item_schema)

    # 3. Optionally create an AIMemoryIndex stub for future embedding
    ai_index_status = "skipped"
    if auto_index:
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
        base_topics = tags or ""
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

    # 4. Trigger asynchronous AI generation in the background
    background_tasks.add_task(
        process_archive_ai_background,
        item_id=db_item.id,
        file_path=file_path,
        category_name=category_label,
        title=title,
        description=description,
    )

    # 5. Re-query to include relationships in the response
    db_item = crud.get_archive_item(db, db_item.id)

    return schemas.ArchiveUploadResponse(
        item=_item_to_response(db_item),
        ai_index_status=ai_index_status,
        message=f"Archive item '{db_item.title}' uploaded successfully. AI rich preview generation has been queued.",
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
    current_user: models.User = Depends(get_current_user),
):
    # Build dynamic query strictly isolated to current_user.id
    query = db.query(models.ArchiveItem).filter(models.ArchiveItem.user_id == current_user.id)

    # Apply filters
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
            "owner_id": current_user.id,
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
    current_user: models.User = Depends(get_current_user),
):
    item = crud.get_archive_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Archive item not found")
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this archive item"
        )
    return item


# ─────────────────────────────────────────────────────────
# POST /batch — Batch create archive items (no file upload)
# ─────────────────────────────────────────────────────────
@router.post(
    "/batch",
    response_model=schemas.BatchArchiveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Batch create archive items",
    description="Creates multiple ArchiveItem records at once from structured data (e.g. resume import). "
                "Does not support file uploads — only metadata and text fields.",
)
def batch_create_archive_items(
    request: schemas.BatchArchiveRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Enforce multi-tenant scoping: set request.owner_id to current_user.id
    request.owner_id = current_user.id

    # Validate that categories used in batch items are authorized
    for item_input in request.items:
        if item_input.category_id:
            cat = crud.get_category(db, item_input.category_id)
            if not cat or (not cat.is_default and cat.user_id != current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not authorized to use category with ID {item_input.category_id}"
                )

    created_ids = []
    for item_input in request.items:
        # Parse original_date string to datetime if provided
        original_dt = None
        if item_input.original_date:
            try:
                from datetime import datetime as dt
                # Try common formats
                for fmt in ["%Y-%m-%d", "%Y", "%Y-%m"]:
                    try:
                        original_dt = dt.strptime(item_input.original_date, fmt)
                        break
                    except ValueError:
                        continue
            except Exception:
                original_dt = None

        item_schema = schemas.ArchiveItemCreate(
            owner_id=request.owner_id,
            category_id=item_input.category_id,
            title=item_input.title,
            description=item_input.description,
            item_type=item_input.item_type,
            file_url=None,
            thumbnail_url=None,
            tags=item_input.tags or "",
            metadata_json=None,
            original_date=original_dt,
            source=item_input.source or "resume_import",
            custom_attributes=item_input.custom_attributes,
            is_public=item_input.is_public if item_input.is_public is not None else True,
        )
        db_item = crud.create_archive_item(db, item_schema)
        created_ids.append(db_item.id)

    return schemas.BatchArchiveResponse(
        created_count=len(created_ids),
        item_ids=created_ids,
        message=f"{len(created_ids)}개의 기록물이 라이브러리에 성공적으로 저장되었습니다.",
    )

