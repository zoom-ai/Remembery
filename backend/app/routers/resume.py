"""
Remembery — Resume / CV Parsing Router
=========================================
POST /api/resume/parse  → Receives plain-text resume content, calls Gemini AI
                          to extract structured timeline events (year, title,
                          description, category) and optionally evaluates 5-axis
                          competency scores.

The extracted data is returned to the frontend so the user can review and edit
each event before persisting them to the archive timeline.
"""

from fastapi import APIRouter, HTTPException, status

from app import schemas
from app.services.ai_service import parse_resume_text, assess_competency

router = APIRouter(prefix="/resume", tags=["Resume / CV Parsing"])


@router.post(
    "/parse",
    response_model=schemas.ResumeParseResponse,
    summary="Parse a resume / CV and extract timeline events",
    description=(
        "Accepts plain-text resume content and uses Gemini AI to extract "
        "structured career, education, project, and award events as a JSON "
        "array.  Optionally returns a 5-axis competency assessment "
        "(technical skill, leadership, creativity, communication, execution) "
        "when `include_competency` is set to `true`."
    ),
)
async def parse_resume(request: schemas.ResumeParseRequest):
    """
    1. Validate the incoming resume text.
    2. Call Gemini API (or local fallback) to extract timeline events.
    3. Optionally call Gemini API for 5-axis competency scoring.
    4. Return the combined result for frontend preview / editing.
    """
    resume_text = request.resume_text.strip()

    if not resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이력서 텍스트가 비어 있습니다. 최소 10자 이상의 이력서 내용을 입력해 주세요.",
        )

    # ── 1. Extract timeline events ──────────────────────────────────────
    timeline_events = parse_resume_text(resume_text)

    # ── 2. (Optional) Assess competency ─────────────────────────────────
    competency = None
    if request.include_competency:
        competency = assess_competency(resume_text)

    return schemas.ResumeParseResponse(
        timeline_events=timeline_events,
        competency=competency,
    )
