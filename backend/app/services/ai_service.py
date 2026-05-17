import os
import json
import urllib.request
import base64
import re
from typing import Optional, Dict, Any

# Resolve Gemini API Key from environment
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
        with urllib.request.urlopen(req, timeout=20) as response:
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


def analyze_document(file_path: Optional[str], title: str, description: Optional[str] = None) -> Dict[str, Optional[str]]:
    """
    Analyze a PDF or TXT document/book to extract:
    - ai_summary (1-2 sentences core summary in Korean)
    - highlight_quote (1 memorable quote from the text)
    """
    text_content = ""
    if file_path:
        text_content = _extract_text_from_file(file_path)

    # 1. Use real Gemini API if key is available
    if GEMINI_API_KEY:
        contents = [
            {
                "parts": [
                    {
                        "text": f"""
                        You are an expert personal archivist. Below is the text content from a preserved document/book titled '{title}'.
                        Your task is to analyze this text and extract:
                        1. 'ai_summary': A 1-2 sentence core summary of this record in Korean. Make it feel warm, respectful, and emotional yet accurate.
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


def analyze_image(file_path: Optional[str], title: str, description: Optional[str] = None) -> Dict[str, Optional[str]]:
    """
    Analyze an uploaded photograph to generate a caption (ai_summary) using Gemini Vision.
    """
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
                            You are an expert personal archivist. Analyze the attached photograph titled '{title}'.
                            Describe the emotional and factual scene/situation in this photo in 1-2 warm, meaningful, and respectful sentences in Korean.
                            This will serve as a caption summary for the digital memorial gallery.
                            
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
        
    return {
        "ai_summary": fallback_summary,
        "highlight_quote": None
    }


def analyze_video(file_path: Optional[str], title: str, description: Optional[str] = None) -> Dict[str, Optional[str]]:
    """
    Analyze video details to generate a warm descriptive summary (ai_summary).
    """
    if GEMINI_API_KEY:
        contents = [
            {
                "parts": [
                    {
                        "text": f"""
                        You are an expert personal archivist. Analyze the details of a preserved video titled '{title}'.
                        Description: {description or 'None provided'}
                        
                        Write a warm, meaningful, and descriptive 1-2 sentence summary of this video in Korean based on these details.
                        
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

    return {
        "ai_summary": fallback_summary,
        "highlight_quote": None
    }
