"""
Remembery — Exhibition Router (AI Curation)
=============================================
POST /api/exhibition/curate  → AI analyses the archive and generates a
                                curated exhibition scenario for a given theme.

Architecture:
  1. Parse the curator's theme and description.
  2. Search the archive for items relevant to the theme (keyword + semantic).
  3. AI ranks, selects, and writes commentary for each selected item.
  4. Generate exhibition metadata (title, subtitle, description, color).
  5. Return a complete exhibition scenario ready for frontend rendering.
"""

import random
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/exhibition",
    tags=["exhibition"],
)


# ═════════════════════════════════════════════════════════
# Mock AI Curation Engine
# ═════════════════════════════════════════════════════════

# Palette of elegant exhibition colors
_THEME_COLORS = [
    "#6366f1",  # Indigo
    "#8b5cf6",  # Violet
    "#ec4899",  # Pink
    "#f59e0b",  # Amber
    "#10b981",  # Emerald
    "#3b82f6",  # Blue
    "#f43f5e",  # Rose
    "#06b6d4",  # Cyan
]


def _mock_select_items_for_theme(
    db: Session,
    theme: str,
    max_items: int,
    curator_id: int,
) -> List[models.ArchiveItem]:
    """
    Mock: Select archive items relevant to the theme.

    Production replacement:
      1. Embed the theme using the same model as archive embeddings.
      2. Perform vector similarity search in AIMemoryIndex.
      3. Re-rank results with an LLM for thematic coherence.
    """
    # Keyword-based fallback search strictly scoped to the curator_id
    search_pattern = f"%{theme}%"
    query = db.query(models.ArchiveItem).filter(
        models.ArchiveItem.user_id == curator_id,
        or_(
            models.ArchiveItem.title.ilike(search_pattern),
            models.ArchiveItem.description.ilike(search_pattern),
            models.ArchiveItem.tags.ilike(search_pattern),
        )
    )

    matched = query.limit(max_items).all()

    # If keyword search returns too few, supplement with recent items from the same curator
    if len(matched) < max_items:
        existing_ids = {item.id for item in matched}
        supplement = (
            db.query(models.ArchiveItem)
            .filter(
                models.ArchiveItem.user_id == curator_id,
                models.ArchiveItem.id.notin_(existing_ids)
            )
            .order_by(models.ArchiveItem.created_at.desc())
            .limit(max_items - len(matched))
            .all()
        )
        matched.extend(supplement)

    return matched[:max_items]


def _mock_generate_curator_note(item: models.ArchiveItem, theme: str, language: str = "ko") -> str:
    """
    Mock: Generate an AI curator's commentary for an item in the exhibition context.

    Production replacement:
        prompt = f"Write a museum curator note for '{item.title}' in the context of '{theme}'"
        response = llm.invoke(prompt)
        return response.content
    """
    if language == "ko":
        notes = [
            f"이 자료는 '{theme}' 주제의 핵심을 담고 있습니다. "
            f"'{item.title}'은(는) 당시의 시대적 분위기와 개인의 깊은 성찰을 동시에 보여주는 귀중한 기록입니다.",

            f"'{item.title}'은(는) 전시의 서사적 흐름에서 중요한 전환점 역할을 합니다. "
            f"이 기록을 통해 관람자는 '{theme}'에 대한 새로운 시각을 얻을 수 있습니다.",

            f"도슨트가 특별히 선정한 이 자료는 '{theme}'이라는 주제 아래 "
            f"인간적인 따뜻함과 지적 깊이를 모두 전달합니다.",
        ]
    else:
        notes = [
            f"This piece captures the essence of '{theme}'. "
            f"'{item.title}' offers a valuable record that reveals both the zeitgeist "
            f"and deeply personal reflections of the era.",

            f"'{item.title}' serves as a pivotal turning point in the exhibition's narrative arc. "
            f"Through this record, visitors gain fresh perspective on '{theme}'.",

            f"Hand-selected by the AI docent, this piece conveys both "
            f"human warmth and intellectual depth under the theme of '{theme}'.",
        ]
    return random.choice(notes)


def _mock_generate_exhibition_meta(
    theme: str,
    items_count: int,
    language: str = "ko",
    custom_color: Optional[str] = None,
) -> dict:
    """
    Mock: Generate exhibition title, subtitle, and description.

    Production replacement:
        prompt = f"Generate museum exhibition metadata for theme: '{theme}'"
        response = llm.invoke(prompt)
        return parse_response(response.content)
    """
    color = custom_color or random.choice(_THEME_COLORS)

    if language == "ko":
        return {
            "title": f"'{theme}' — 기억의 조각들",
            "subtitle": f"AI 도슨트가 엄선한 {items_count}점의 기록으로 만나는 특별 전시",
            "description": (
                f"이 전시는 '{theme}'이라는 주제 아래, 아카이브에 보관된 소중한 기록들을 "
                f"AI 큐레이터가 분석하고 재구성하여 탄생하였습니다. "
                f"총 {items_count}점의 자료가 시간의 흐름과 주제의 깊이에 따라 배치되어 있으며, "
                f"관람자가 기록의 주인공이 남긴 삶의 궤적을 따라 걸을 수 있도록 설계되었습니다."
            ),
            "color": color,
        }
    else:
        return {
            "title": f"'{theme}' — Fragments of Memory",
            "subtitle": f"A special exhibition featuring {items_count} curated records by the AI docent",
            "description": (
                f"This exhibition was born from the AI curator's analysis and reconstruction "
                f"of precious records under the theme '{theme}'. "
                f"{items_count} items have been arranged by chronological flow and thematic depth, "
                f"designed so that visitors can walk through the life trajectory left by the archive's subject."
            ),
            "color": color,
        }


# ═════════════════════════════════════════════════════════
# Endpoint
# ═════════════════════════════════════════════════════════

@router.post(
    "/curate",
    response_model=schemas.CurationResponse,
    summary="AI-curated exhibition scenario generation",
    description=(
        "Given a theme and optional description, the AI curator scans "
        "the archive, selects the most relevant items, generates contextual "
        "commentary for each, and returns a complete exhibition scenario "
        "ready for frontend rendering.\n\n"
        "**Current mode**: Mock AI (replace `_mock_*` functions with "
        "real Gemini / LangChain calls for production)."
    ),
)
def curate_exhibition(
    payload: schemas.CurationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Enforce multi-tenant scoping: override curator_id to current_user.id
    payload.curator_id = current_user.id

    # 2. Count total items reviewed (for analytics display) - strictly scoped to current_user.id
    total_items_in_archive = db.query(models.ArchiveItem).filter(models.ArchiveItem.user_id == current_user.id).count()

    # 3. Select relevant items for the theme
    selected_items = _mock_select_items_for_theme(
        db=db,
        theme=payload.theme,
        max_items=payload.max_items,
        curator_id=payload.curator_id,
    )

    if not selected_items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No archive items found. Please upload materials first.",
        )

    # 4. Generate curator notes and assemble curated item list
    curated_items = []
    for order, item in enumerate(selected_items, start=1):
        note = _mock_generate_curator_note(item, payload.theme, payload.language)
        score = round(random.uniform(0.65, 0.98), 4)
        curated_items.append(
            schemas.CuratedItemSummary(
                archive_item_id=item.id,
                title=item.title,
                item_type=item.item_type or (item.category.name if getattr(item, "category", None) else "기록"),
                ai_curator_note=note,
                display_order=order,
                relevance_score=score,
            )
        )

    # 5. Generate exhibition metadata
    meta = _mock_generate_exhibition_meta(
        theme=payload.theme,
        items_count=len(curated_items),
        language=payload.language,
        custom_color=payload.theme_color,
    )

    layout = payload.layout_style or "timeline"

    return schemas.CurationResponse(
        exhibition_title=meta["title"],
        exhibition_subtitle=meta["subtitle"],
        exhibition_description=meta["description"],
        theme_color=meta["color"],
        layout_style=layout,
        curated_items=curated_items,
        total_items_reviewed=total_items_in_archive,
        model="mock-remembery-curator-v1",
        message=f"Exhibition scenario for '{payload.theme}' generated successfully "
                f"with {len(curated_items)} curated items.",
    )
