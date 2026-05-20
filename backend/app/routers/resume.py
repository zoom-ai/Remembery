"""
Remembery — Resume / CV Parsing Router
=========================================
POST /api/resume/parse         → Receives plain-text resume content, calls Gemini AI
                                 to extract structured timeline events.
POST /api/resume/extract-text  → Accepts PDF / DOCX / TXT file uploads and returns
                                 extracted plain text for the frontend textarea.

The extracted data is returned to the frontend so the user can review and edit
each event before persisting them to the archive timeline.
"""

import os
import io
import re
import uuid
import zipfile
import xml.etree.ElementTree as ET

from fastapi import APIRouter, HTTPException, status, File, UploadFile

from app import schemas
from app.services.ai_service import parse_resume_text, assess_competency

router = APIRouter(prefix="/resume", tags=["Resume / CV Parsing"])

# Allowed MIME types and extensions
_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"}
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# ─────────────────────────────────────────────────────────
# Helper: Extract text from various file formats
# ─────────────────────────────────────────────────────────
def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
        return "\n\n".join(pages)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려 있을 수 있습니다. ({e})",
        )


def _extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX by parsing the underlying XML."""
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            if "word/document.xml" not in z.namelist():
                raise ValueError("word/document.xml not found in archive")
            xml_content = z.read("word/document.xml")

        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for p in tree.iter(f"{{{ns['w']}}}p"):
            texts = [t.text for t in p.iter(f"{{{ns['w']}}}t") if t.text]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs)
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="DOCX 파일을 읽을 수 없습니다. 파일이 손상되었을 수 있습니다.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"DOCX 파싱 실패: {e}",
        )


def _extract_text_from_plain(file_bytes: bytes) -> str:
    """Extract text from plain text files with encoding detection."""
    for encoding in ("utf-8", "utf-8-sig", "euc-kr", "cp949", "latin-1"):
        try:
            return file_bytes.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            continue
    return file_bytes.decode("utf-8", errors="replace")


# ─────────────────────────────────────────────────────────
# POST /extract-text — Extract text from uploaded file
# ─────────────────────────────────────────────────────────
@router.post(
    "/extract-text",
    summary="Extract text from an uploaded resume file",
    description=(
        "Accepts PDF, DOCX, or TXT file uploads and returns the extracted "
        "plain text. The frontend can then display this text in the textarea "
        "for user review before sending it to `/parse`."
    ),
)
async def extract_text_from_file(
    file: UploadFile = File(...),
):
    """
    1. Validate file type and size.
    2. Read file bytes.
    3. Extract text based on file extension / MIME type.
    4. Return extracted text and metadata.
    """
    # ── Validate filename & extension ────────────────────────────────
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원되지 않는 파일 형식입니다: {ext}. "
                   f"PDF, DOCX, TXT 파일만 업로드할 수 있습니다.",
        )

    # ── Read file bytes with size limit ──────────────────────────────
    file_bytes = await file.read()
    if len(file_bytes) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="파일 크기가 10MB를 초과합니다.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="빈 파일입니다. 내용이 있는 파일을 업로드해 주세요.",
        )

    # ── Extract text ─────────────────────────────────────────────────
    extracted = ""

    if ext == ".pdf":
        extracted = _extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        if ext == ".doc":
            # .doc (legacy binary) — attempt plain text fallback
            extracted = _extract_text_from_plain(file_bytes)
        else:
            extracted = _extract_text_from_docx(file_bytes)
    else:
        # .txt, .md, .rtf
        extracted = _extract_text_from_plain(file_bytes)

    # Clean up excessive whitespace
    extracted = re.sub(r'\n{3,}', '\n\n', extracted).strip()

    if not extracted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="파일에서 텍스트를 추출할 수 없습니다. "
                   "이미지 기반 PDF(스캔)는 지원되지 않습니다. "
                   "텍스트가 포함된 파일을 업로드해 주세요.",
        )

    return {
        "extracted_text": extracted,
        "filename": filename,
        "file_size": len(file_bytes),
        "char_count": len(extracted),
    }


# ─────────────────────────────────────────────────────────
# POST /parse — Parse resume text with AI
# ─────────────────────────────────────────────────────────
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

