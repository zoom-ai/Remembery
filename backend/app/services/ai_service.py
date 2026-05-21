import os
import json
import urllib.request
import base64
import re
from typing import Optional, Dict, Any, List

# Resolve Gemini API Key from environment or manual .env file
# Try to load .env manually from the backend root
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(_env_path):
    try:
        with open(_env_path, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    os.environ[_k.strip()] = _v.strip()
    except Exception as _e:
        print(f"[AI Service] Warning: Failed to parse manual .env: {_e}")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def _call_gemini_api(contents: list, model: str = "gemini-2.5-flash") -> Optional[str]:
    """
    Call the official Gemini API using Python's standard urllib library
    to avoid external dependency issues. Enforces JSON output schema.
    """
    if not GEMINI_API_KEY:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=60) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)
            
            candidates = res_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text")
    except Exception as e:
        print(f"[AI Service ERROR] Failed calling Gemini API: {e}")
    return None


def _extract_text_from_file(file_path: str) -> str:
    """
    Extracts text from a .txt or .pdf file.
    Supports up to 5000 characters for analysis.
    """
    if not os.path.exists(file_path):
        return ""
    
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read(5000)
        except Exception as e:
            print(f"[AI Service] Error reading TXT file: {e}")
            return ""
            
    elif ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            text = ""
            for idx in range(min(5, len(reader.pages))):  # Read first 5 pages
                text += reader.pages[idx].extract_text() or ""
            return text[:5000]
        except Exception as e:
            print(f"[AI Service] Error extracting PDF text: {e}")
            return ""
            
    return ""


def synthesize_custom_attributes(custom_attrs: Optional[dict], category_name: str) -> str:
    """
    Synthesizes custom attributes into premium, localized Korean sentences
    based on the archive item's category.
    """
    if not custom_attrs or not isinstance(custom_attrs, dict):
        return ""
        
    sentences = []
    cat_lower = category_name.lower() if category_name else ""
    
    # 1. Papers / 논문
    if any(k in cat_lower for k in ["논문", "research", "paper", "academic"]):
        authors = custom_attrs.get("authors") or custom_attrs.get("author") or custom_attrs.get("저자")
        journal = custom_attrs.get("journal") or custom_attrs.get("저널명") or custom_attrs.get("저널") or custom_attrs.get("학술지")
        doi = custom_attrs.get("doi")
        
        if authors and journal:
            sentences.append(f"이 자료는 {authors}가 쓴 논문이며, {journal}에 게재되었습니다.")
        elif authors:
            sentences.append(f"이 자료는 {authors}가 저술한 논문 자료입니다.")
        elif journal:
            sentences.append(f"이 자료는 {journal} 학술지에 게재된 논문입니다.")
            
        if doi:
            sentences.append(f"논문의 DOI 식별자는 {doi}입니다.")

    # 2. Diaries / 일기
    elif any(k in cat_lower for k in ["일기", "diary", "journal"]):
        weather = custom_attrs.get("weather") or custom_attrs.get("날씨")
        emotion = custom_attrs.get("emotion") or custom_attrs.get("감정") or custom_attrs.get("오늘 느낀 감정")
        
        if weather and emotion:
            sentences.append(f"기록 당시 날씨는 {weather}였으며, 오늘의 감정은 {emotion}이었습니다.")
        elif weather:
            sentences.append(f"기록 당시 날씨는 {weather}였습니다.")
        elif emotion:
            sentences.append(f"이 일기를 기록할 당시 감정은 {emotion}이었습니다.")

    # 3. Photos / 사진
    elif any(k in cat_lower for k in ["사진", "photo", "image", "이미지"]):
        location = custom_attrs.get("location") or custom_attrs.get("촬영 장소") or custom_attrs.get("장소")
        taken_with = custom_attrs.get("taken_with") or custom_attrs.get("촬영 기기") or custom_attrs.get("기기") or custom_attrs.get("camera") or custom_attrs.get("카메라")
        
        if location and taken_with:
            sentences.append(f"이 사진은 {location}에서 촬영되었으며, {taken_with} 카메라로 찍었습니다.")
        elif location:
            sentences.append(f"이 사진은 {location}에서 촬영되었습니다.")
        elif taken_with:
            sentences.append(f"이 사진은 {taken_with} 카메라로 촬영되었습니다.")

    # 4. Generic fallback for any other category or remaining custom attributes
    exclude_keys = {"authors", "author", "저자", "journal", "저널명", "저널", "학술지", "doi", 
                    "weather", "날씨", "emotion", "감정", "오늘 느낀 감정", 
                    "location", "촬영 장소", "장소", "taken_with", "촬영 기기", "기기", "camera", "카메라"}
                    
    other_attrs = {k: v for k, v in custom_attrs.items() if k not in exclude_keys and v}
    if other_attrs:
        fallback_parts = []
        for key, val in other_attrs.items():
            fallback_parts.append(f"{key}은(는) '{val}'")
        if fallback_parts:
            sentences.append("추가 정보로 " + ", ".join(fallback_parts) + "입니다.")
            
    return " ".join(sentences)


def analyze_document(
    file_path: Optional[str],
    title: str,
    description: Optional[str] = None,
    custom_attributes: Optional[dict] = None,
    category_name: Optional[str] = None
) -> Dict[str, Optional[str]]:
    """
    Analyze a PDF or TXT document/book to extract:
    - ai_summary (1-2 sentences core summary in Korean)
    - highlight_quote (1 memorable quote from the text)
    """
    text_content = ""
    if file_path:
        text_content = _extract_text_from_file(file_path)

    synthesized_context = synthesize_custom_attributes(custom_attributes, category_name or "Document")

    # 1. Use real Gemini API if key is available
    if GEMINI_API_KEY:
        context_prompt = ""
        if synthesized_context:
            context_prompt = f"\nContextual facts about this document:\n{synthesized_context}\n"

        contents = [
            {
                "parts": [
                    {
                        "text": f"""
                        You are an expert personal archivist. Below is the text content from a preserved document/book titled '{title}'.{context_prompt}
                        Your task is to analyze this text and extract:
                        1. 'ai_summary': A 1-2 sentence core summary of this record in Korean. Make it feel warm, respectful, and emotional yet accurate. If contextual facts are provided above, weave them naturally into the summary where relevant.
                        2. 'highlight_quote': One of the most emotional, philosophical, inspiring, or memorable quotes directly extracted from the text in Korean. It must exist in the text.
                        
                        Text content snippet:
                        ---
                        {text_content or description or "No text content available."}
                        ---
                        
                        Format the response strictly as a JSON object with keys: "ai_summary" and "highlight_quote".
                        """
                    }
                ]
            }
        ]
        
        response_text = _call_gemini_api(contents)
        if response_text:
            try:
                res_json = json.loads(response_text)
                return {
                    "ai_summary": res_json.get("ai_summary"),
                    "highlight_quote": res_json.get("highlight_quote")
                }
            except Exception as e:
                print(f"[AI Service] JSON parse error: {e}. Raw response: {response_text}")

    # 2. Smart fallbacks if API call fails or no API key is set
    print("[AI Service] Falling back to local document analysis rules.")
    fallback_summary = f"이 문서는 '{title}'에 대한 아카이브 기록으로, 저자가 남긴 가치 있는 생각과 삶의 경험을 온전히 담아내고 있습니다."
    if description:
        fallback_summary = f"'{title}'에 관한 기록입니다. {description}"

    if synthesized_context:
        fallback_summary = f"{fallback_summary} {synthesized_context}"

    fallback_quote = "기록한다는 것은 우리의 삶이 결코 바람 속에 사라지지 않게 하는 가장 아름다운 방법이다."
    
    # Try to extract a realistic quote from actual text if available
    if text_content:
        sentences = re.split(r'[.!?\n]', text_content)
        cleaned_sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
        # Look for a nice quote containing subjective pronouns or key concepts
        for s in cleaned_sentences:
            if any(k in s for k in ["나는", "우리", "삶", "생각", "인생", "마음", "기록"]):
                fallback_quote = s
                break
        else:
            if cleaned_sentences:
                fallback_quote = cleaned_sentences[0]

    return {
        "ai_summary": fallback_summary,
        "highlight_quote": fallback_quote
    }


def analyze_image(
    file_path: Optional[str],
    title: str,
    description: Optional[str] = None,
    custom_attributes: Optional[dict] = None,
    category_name: Optional[str] = None
) -> Dict[str, Optional[str]]:
    """
    Analyze an uploaded photograph to generate a caption (ai_summary) using Gemini Vision.
    """
    synthesized_context = synthesize_custom_attributes(custom_attributes, category_name or "Photo")

    if file_path and os.path.exists(file_path) and GEMINI_API_KEY:
        try:
            # Base64 encode the image
            with open(file_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
                
            mime_type = "image/jpeg"
            if file_path.lower().endswith(".png"):
                mime_type = "image/png"
            elif file_path.lower().endswith(".webp"):
                mime_type = "image/webp"

            context_prompt = ""
            if synthesized_context:
                context_prompt = f"\nContextual facts about this photograph:\n{synthesized_context}\n"

            contents = [
                {
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": encoded_string
                            }
                        },
                        {
                            "text": f"""
                            You are an expert personal archivist. Analyze the attached photograph titled '{title}'.{context_prompt}
                            Describe the emotional and factual scene/situation in this photo in 1-2 warm, meaningful, and respectful sentences in Korean.
                            This will serve as a caption summary for the digital memorial gallery. If contextual facts are provided above, weave them naturally into the description where relevant.
                            
                            Format the response strictly as a JSON object with key: "ai_summary".
                            """
                        }
                    ]
                }
            ]
            
            response_text = _call_gemini_api(contents)
            if response_text:
                try:
                    res_json = json.loads(response_text)
                    return {
                        "ai_summary": res_json.get("ai_summary"),
                        "highlight_quote": None
                    }
                except Exception as e:
                    print(f"[AI Service] JSON parse error on image: {e}")
        except Exception as e:
            print(f"[AI Service] Multimodal Vision execution failed: {e}")

    # Fallback captioning logic
    print("[AI Service] Falling back to local image captioning rules.")
    fallback_summary = f"'{title}'의 특별하고 소중했던 온기가 고스란히 담긴 사진 기록입니다."
    if description:
        fallback_summary = f"사진속 순간: {description}"
        
    if synthesized_context:
        fallback_summary = f"{fallback_summary} {synthesized_context}"

    return {
        "ai_summary": fallback_summary,
        "highlight_quote": None
    }


def analyze_video(
    file_path: Optional[str],
    title: str,
    description: Optional[str] = None,
    custom_attributes: Optional[dict] = None,
    category_name: Optional[str] = None
) -> Dict[str, Optional[str]]:
    """
    Analyze video details to generate a warm descriptive summary (ai_summary).
    """
    synthesized_context = synthesize_custom_attributes(custom_attributes, category_name or "Video")

    if GEMINI_API_KEY:
        context_prompt = ""
        if synthesized_context:
            context_prompt = f"\nContextual facts about this video:\n{synthesized_context}\n"

        contents = [
            {
                "parts": [
                    {
                        "text": f"""
                        You are an expert personal archivist. Analyze the details of a preserved video titled '{title}'.{context_prompt}
                        Description: {description or 'None provided'}
                        
                        Write a warm, meaningful, and descriptive 1-2 sentence summary of this video in Korean based on these details. If contextual facts are provided above, weave them naturally into the summary where relevant.
                        
                        Format the response strictly as a JSON object with key: "ai_summary".
                        """
                    }
                ]
            }
        ]
        
        response_text = _call_gemini_api(contents)
        if response_text:
            try:
                res_json = json.loads(response_text)
                return {
                    "ai_summary": res_json.get("ai_summary"),
                    "highlight_quote": None
                }
            except Exception as e:
                print(f"[AI Service] JSON parse error on video: {e}")

    # Fallback captioning
    print("[AI Service] Falling back to local video captioning rules.")
    fallback_summary = f"생전 '{title}'의 생생한 순간과 따뜻한 목소리를 고스란히 품고 있는 영상 기록입니다."
    if description:
        fallback_summary = f"영상 요약: {description}"

    if synthesized_context:
        fallback_summary = f"{fallback_summary} {synthesized_context}"

    return {
        "ai_summary": fallback_summary,
        "highlight_quote": None
    }


def suggest_custom_fields_ai(category_name: str) -> List[Dict[str, str]]:
    """
    Calls the Gemini API to get a tailored list of suggested custom fields (metadata attributes)
    for a given category name. If the API is not available or fails, returns a high-quality local fallback.
    """
    # 1. Local smart fallbacks based on keywords
    cat_lower = category_name.lower() if category_name else ""
    
    # Defaults
    fallback_suggestions = [
        {"key": "notes", "label": "추가 메모", "type": "text"},
        {"key": "importance", "label": "중요도", "type": "number"}
    ]
    
    if any(k in cat_lower for k in ["논문", "research", "paper", "academic", "학술"]):
        fallback_suggestions = [
            {"key": "authors", "label": "저자", "type": "text"},
            {"key": "journal", "label": "저널명", "type": "text"},
            {"key": "doi", "label": "DOI 주소", "type": "text"},
            {"key": "published_date", "label": "발행일", "type": "date"}
        ]
    elif any(k in cat_lower for k in ["일기", "diary", "journal", "기록"]):
        fallback_suggestions = [
            {"key": "weather", "label": "날씨", "type": "text"},
            {"key": "emotion", "label": "오늘 느낀 감정", "type": "text"},
            {"key": "location", "label": "기록 장소", "type": "text"}
        ]
    elif any(k in cat_lower for k in ["사진", "photo", "image", "이미지", "그림"]):
        fallback_suggestions = [
            {"key": "location", "label": "촬영 장소", "type": "text"},
            {"key": "taken_with", "label": "촬영 기기", "type": "text"},
            {"key": "taken_date", "label": "촬영 일자", "type": "date"}
        ]
    elif any(k in cat_lower for k in ["동영상", "video", "영상", "영화"]):
        fallback_suggestions = [
            {"key": "location", "label": "촬영 장소", "type": "text"},
            {"key": "duration", "label": "영상 길이", "type": "text"},
            {"key": "participants", "label": "함께 한 사람들", "type": "text"}
        ]
    elif any(k in cat_lower for k in ["음성", "오디오", "audio", "녹음"]):
        fallback_suggestions = [
            {"key": "speaker", "label": "말하는 사람", "type": "text"},
            {"key": "recorded_at", "label": "녹음 장소", "type": "text"},
            {"key": "duration", "label": "재생 시간", "type": "text"}
        ]
    elif any(k in cat_lower for k in ["여행", "travel", "trip"]):
        fallback_suggestions = [
            {"key": "destination", "label": "여행지", "type": "text"},
            {"key": "travel_period", "label": "여행 기간", "type": "text"},
            {"key": "companions", "label": "동반자", "type": "text"}
        ]

    if not GEMINI_API_KEY:
        print("[AI Service] No Gemini API key found. Using local custom fields fallback suggestions.")
        return fallback_suggestions

    prompt = f"""
    사용자가 라이브러리에 '{category_name}'라는 카테고리를 만들려고 합니다. 이 카테고리의 디지털 자료를 관리할 때 필요한 맞춤형 메타데이터 속성명(영문 key)과 한국어 설명(label), 그리고 데이터 타입(type: 'text', 'date', 'number' 등)을 포함한 JSON 배열을 다른 텍스트 없이 오직 유효한 JSON 형식으로만 반환해 주세요.
    
    반환 구조 예시:
    [
      {{"key": "doi", "label": "DOI 주소", "type": "text"}},
      {{"key": "authors", "label": "저자", "type": "text"}}
    ]
    
    최대 4-5개의 실용적이고 가장 권장되는 필드를 추천해 주세요. 오직 JSON 배열만 반환해 주세요. Markdown 백틱(```)이나 다른 설명 텍스트를 포함하지 마세요.
    """

    contents = [
        {
            "parts": [
                {
                    "text": prompt
                }
            ]
        }
    ]

    try:
        response_text = _call_gemini_api(contents)
        if response_text:
            # Clean response text just in case Gemini outputs markdown code block
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            parsed = json.loads(clean_text)
            if isinstance(parsed, list):
                # Validate the fields
                validated_suggestions = []
                for item in parsed:
                    if isinstance(item, dict) and "key" in item and "label" in item and "type" in item:
                        validated_suggestions.append({
                            "key": str(item["key"]),
                            "label": str(item["label"]),
                            "type": str(item["type"])
                        })
                if validated_suggestions:
                    print(f"[AI Service] Successfully generated {len(validated_suggestions)} custom fields from Gemini.")
                    return validated_suggestions
    except Exception as e:
        print(f"[AI Service ERROR] Failed parsing Gemini category suggestions: {e}")

    print("[AI Service] Falling back to local category suggestions rules.")
    return fallback_suggestions


def _is_date_only_text(text: str) -> bool:
    """
    Checks if the text contains only date indicators (months, year-like numbers, ranges, symbols, present/current).
    Used to filter out date-only lines in regex fallbacks.
    """
    t = text.lower().strip()
    
    # Remove standard month abbreviations/names
    months = [
        "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
        "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december"
    ]
    # Remove other date/time indicators
    time_words = ["present", "current", "to", "till", "from", "현재", "진행중", "진행", "월", "년", "일"]
    
    # Remove all numbers (since years/days might be left)
    t = re.sub(r'\d+', '', t)
    
    # Remove month words
    for m in months:
        t = re.sub(r'\b' + m + r'\b', '', t)
    # Remove time words
    for w in time_words:
        t = re.sub(r'\b' + w + r'\b', '', t)
        t = t.replace(w, '')
        
    # Remove common punctuation and whitespace
    t = re.sub(r'[ \t\r\n\-\–\—\.\,\~\/\(\)\[\]\•\·\●]', '', t)
    
    # If the remaining string is extremely short or empty, it's a date-only string!
    return len(t) <= 1


def parse_resume_text(resume_text: str) -> List[Dict[str, Any]]:
    """
    Parses resume/CV plain text via Gemini API and extracts structured timeline
    events (year, title, description, category) as a JSON array.
    Falls back to a simple regex-based heuristic if the API is unavailable.
    """
    if not resume_text or not resume_text.strip():
        return []

    # ── 1. Gemini API path ──────────────────────────────────────────────
    if GEMINI_API_KEY:
        prompt = (
            "당신은 개인 아카이빙 및 이력서 분석 전문가입니다. 다음 이력서(Resume/CV) 텍스트에서 학력, 경력, 프로젝트, 수상 등 주요 성취를 정확히 추출하여 "
            "JSON 배열로 반환해 주세요. 각 항목은 다음 키를 반드시 포함해야 합니다:\n"
            "- year (string): 해당 이벤트의 연도 또는 전체 기간 (예: '2018 - 2020', '2019 - 현재', '2015'). 단일 연도뿐만 아니라 'Nov. 2019 - present' 처럼 상세 기간이 있으면 전체 기간을 표기해 주세요.\n"
            "- title (string): 회사명/기관명과 직함/활동명을 함께 포함한 명확한 제목 (예: 'Google - Software Engineer', '서울대학교 - 컴퓨터공학 학사')\n"
            "- description (string): 해당 직무, 학업, 또는 프로젝트에서 수행한 구체적인 역할과 성과에 대한 한국어 상세 설명 (1-3문장)\n"
            "- category (string): 다음 4개 값 중 하나에 매핑 — 'career' (경력), 'study' (학업/교육), 'project' (프로젝트), 'award' (수상/자격증)\n\n"
            "주의 사항:\n"
            "1. 절대 날짜나 연도만 있고 상세 역할이 없는 빈 카드를 생성하지 마세요. 모든 카드는 명확한 title과 구체적인 description을 가져야 합니다.\n"
            "2. 동일한 직무나 회사 내에서 기간별 상세 내역이 있다면, 하나의 통합된 경력 카드로 합치거나 각각 명확한 직함/내용을 기재하여 구분하세요.\n"
            "3. 연도 순서대로 오래된 것부터 최신 순으로 정렬해 주세요.\n\n"
            f"이력서 텍스트:\n---\n{resume_text[:12000]}\n---"
        )

        contents = [{"parts": [{"text": prompt}]}]

        try:
            response_text = _call_gemini_api(contents)
            if response_text:
                clean = response_text.strip()
                if clean.startswith("```json"):
                    clean = clean[7:]
                if clean.startswith("```"):
                    clean = clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                clean = clean.strip()

                parsed = json.loads(clean)
                if isinstance(parsed, list):
                    validated = []
                    for item in parsed:
                        if isinstance(item, dict) and "year" in item and "title" in item:
                            validated.append({
                                "year": str(item.get("year", "")),
                                "title": str(item.get("title", "")),
                                "description": str(item.get("description", "")),
                                "category": str(item.get("category", "career")),
                            })
                    if validated:
                        print(f"[AI Service] Successfully parsed {len(validated)} resume events from Gemini.")
                        return validated
        except Exception as e:
            print(f"[AI Service ERROR] Resume parsing via Gemini failed: {e}")

    # ── 2. Local regex fallback ─────────────────────────────────────────
    print("[AI Service] Falling back to local resume parsing heuristic.")
    events: List[Dict[str, Any]] = []
    year_pattern = re.compile(r"((?:19|20)\d{2})")
    for line in resume_text.splitlines():
        line = line.strip()
        if not line:
            continue
        match = year_pattern.search(line)
        if match:
            year = match.group(1)
            title_text = line.replace(year, "").strip(" -–—:·•|/")
            # Filter out lines that are too short or only contain date indicators
            if len(title_text) > 3 and not _is_date_only_text(title_text):
                events.append({
                    "year": year,
                    "title": title_text[:120],
                    "description": f"{title_text}에서의 소중한 기록",
                    "category": "career",
                })
    return events


def assess_competency(resume_text: str) -> List[Dict[str, Any]]:
    """
    Evaluates 5 competency dimensions from resume text and returns numeric
    scores (0-100) with brief Korean justifications.

    Dimensions:
      1. 기술력 (Technical Skill)
      2. 리더십 (Leadership)
      3. 창의성 (Creativity)
      4. 커뮤니케이션 (Communication)
      5. 실행력 (Execution / Drive)
    """
    if not resume_text or not resume_text.strip():
        return _default_competency()

    if GEMINI_API_KEY:
        prompt = (
            "다음 이력서(Resume/CV) 텍스트를 분석하여 아래 5가지 역량 지표를 "
            "0부터 100까지의 점수로 수치화하고 각 지표에 대한 한국어 한 줄 근거를 작성해 주세요.\n\n"
            "역량 지표:\n"
            "1. technical_skill (기술력): 전문 기술, 프로그래밍, 도구 활용 능력\n"
            "2. leadership (리더십): 팀 관리, 의사결정, 조직 이끌기 능력\n"
            "3. creativity (창의성): 혁신적 사고, 새로운 접근법 제안 능력\n"
            "4. communication (커뮤니케이션): 발표, 문서 작성, 협업 의사소통 능력\n"
            "5. execution (실행력): 프로젝트 완수, 목표 달성, 성과 창출 능력\n\n"
            "반환 형식 — 오직 JSON 배열만:\n"
            '[{"key": "technical_skill", "label": "기술력", "score": 85, "reason": "근거 한 줄"}]\n\n'
            f"이력서 텍스트:\n---\n{resume_text[:8000]}\n---"
        )

        contents = [{"parts": [{"text": prompt}]}]

        try:
            response_text = _call_gemini_api(contents)
            if response_text:
                clean = response_text.strip()
                if clean.startswith("```json"):
                    clean = clean[7:]
                if clean.startswith("```"):
                    clean = clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                clean = clean.strip()

                parsed = json.loads(clean)
                if isinstance(parsed, list):
                    validated = []
                    for item in parsed:
                        if isinstance(item, dict) and "key" in item and "score" in item:
                            validated.append({
                                "key": str(item["key"]),
                                "label": str(item.get("label", item["key"])),
                                "score": min(100, max(0, int(item["score"]))),
                                "reason": str(item.get("reason", "")),
                            })
                    if validated:
                        print(f"[AI Service] Competency assessment completed with {len(validated)} dimensions.")
                        return validated
        except Exception as e:
            print(f"[AI Service ERROR] Competency assessment via Gemini failed: {e}")

    print("[AI Service] Falling back to default competency scores.")
    return _default_competency()


def _default_competency() -> List[Dict[str, Any]]:
    """Returns neutral default competency scores when AI is unavailable."""
    return [
        {"key": "technical_skill", "label": "기술력", "score": 50, "reason": "이력서 기반 자동 분석이 불가하여 기본값을 적용합니다."},
        {"key": "leadership", "label": "리더십", "score": 50, "reason": "이력서 기반 자동 분석이 불가하여 기본값을 적용합니다."},
        {"key": "creativity", "label": "창의성", "score": 50, "reason": "이력서 기반 자동 분석이 불가하여 기본값을 적용합니다."},
        {"key": "communication", "label": "커뮤니케이션", "score": 50, "reason": "이력서 기반 자동 분석이 불가하여 기본값을 적용합니다."},
        {"key": "execution", "label": "실행력", "score": 50, "reason": "이력서 기반 자동 분석이 불가하여 기본값을 적용합니다."},
    ]
