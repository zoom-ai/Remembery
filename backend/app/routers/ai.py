"""
Remembery — AI Router (RAG Pipeline)
=======================================
POST /api/ai/query  → Visitor asks a question; the RAG engine retrieves
                      relevant archive context and generates a grounded answer.

Architecture (Production):
  1. Embed the visitor's question using the same model as the index.
  2. Perform semantic similarity search against AIMemoryIndex embeddings.
  3. Retrieve top-K matching ArchiveItem summaries as context.
  4. Feed [question + context] into an LLM (Gemini / GPT) for generation.
  5. Return the answer + cited sources + confidence score.

Current Implementation:
  A fully functional mock pipeline that demonstrates the exact data flow.
  Swap the mock functions with real embedding + LLM calls (e.g., google-genai,
  openai, langchain) to activate production mode.
"""

import json
import random
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.database import get_db

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)


# ═════════════════════════════════════════════════════════
# Mock LLM / Embedding Services
# Replace these with real implementations in production.
# ═════════════════════════════════════════════════════════

def _mock_embed_query(question: str) -> List[float]:
    """
    Mock: Generate a fake embedding vector for the question.

    Production replacement:
        import google.generativeai as genai
        result = genai.embed_content(model="models/text-embedding-004", content=question)
        return result['embedding']
    """
    random.seed(hash(question) % (2**32))
    return [random.uniform(-1, 1) for _ in range(768)]


def _mock_semantic_search(
    db: Session,
    query_embedding: List[float],
    top_k: int = 3,
    owner_id: Optional[int] = None,
) -> List[dict]:
    """
    Mock: Retrieve the most relevant archive items.

    In production, this would compute cosine similarity between
    query_embedding and stored vectors in AIMemoryIndex, or delegate
    to a vector DB (ChromaDB / FAISS / pgvector).

    Current mock strategy:
      - Pulls indexed items from the DB.
      - Assigns random relevance scores for demonstration.
    """
    query = (
        db.query(models.AIMemoryIndex)
        .join(models.ArchiveItem)
        .filter(models.AIMemoryIndex.is_indexed == True)  # noqa: E712
    )
    if owner_id:
        query = query.filter(models.ArchiveItem.owner_id == owner_id)

    indexed_items = query.limit(50).all()

    if not indexed_items:
        # Fallback: pull any archive items even if not yet indexed
        fallback_query = db.query(models.ArchiveItem)
        if owner_id:
            fallback_query = fallback_query.filter(models.ArchiveItem.owner_id == owner_id)
        fallback_items = fallback_query.limit(top_k).all()

        return [
            {
                "archive_item_id": item.id,
                "title": item.title,
                "snippet": (item.description or "")[:200] + "..." if item.description else f"[{item.item_type}] {item.title}",
                "relevance_score": round(random.uniform(0.55, 0.85), 4),
            }
            for item in fallback_items
        ]

    # Simulate scored results
    scored = []
    for idx_record in indexed_items:
        item = idx_record.archive_item
        snippet = idx_record.summary or (item.description or "")[:200]
        score = round(random.uniform(0.60, 0.98), 4)
        scored.append({
            "archive_item_id": item.id,
            "title": item.title,
            "snippet": snippet,
            "relevance_score": score,
        })

    # Sort by score descending and take top_k
    scored.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored[:top_k]


def _mock_llm_generate(question: str, context_chunks: List[dict], language: str = "ko") -> dict:
    """
    Mock: Generate an answer using retrieved context.

    Production replacement:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        prompt = build_rag_prompt(question, context_chunks, language)
        response = llm.invoke(prompt)
        return {"answer": response.content, "model": "gemini-2.0-flash"}
    """
    if not context_chunks:
        if language == "ko":
            return {
                "answer": "현재 아카이브에 관련된 기록이 충분하지 않아 답변을 생성할 수 없습니다. "
                          "더 많은 자료를 업로드해 주세요.",
                "model": "mock-remembery-v1",
                "confidence": 0.0,
            }
        return {
            "answer": "There are not enough records in the archive to generate an answer. "
                      "Please upload more materials.",
            "model": "mock-remembery-v1",
            "confidence": 0.0,
        }

    # Build a mock answer that references the context
    titles = [c["title"] for c in context_chunks]
    avg_score = sum(c["relevance_score"] for c in context_chunks) / len(context_chunks)

    if language == "ko":
        answer = (
            f"아카이브에 보관된 '{titles[0]}' 등 {len(context_chunks)}건의 기록을 분석한 결과, "
            f"질문하신 \"{question}\"에 대해 다음과 같이 답변드립니다.\n\n"
            f"관련 기록들을 종합하면, 해당 주제에 대해 깊은 통찰과 경험이 담겨 있습니다. "
            f"특히 '{titles[0]}'에서는 이 주제에 대한 핵심적인 관점이 기술되어 있으며, "
        )
        if len(titles) > 1:
            answer += f"'{titles[1]}'에서는 보충적인 맥락을 확인할 수 있습니다. "
        answer += (
            "이 답변은 아카이브에 실제로 보관된 기록에 근거하여 생성되었습니다."
        )
    else:
        answer = (
            f"Based on analysis of {len(context_chunks)} archived records including "
            f"'{titles[0]}', here is the response to your question: \"{question}\".\n\n"
            f"The archives reveal deep insights and experiences on this topic. "
            f"In particular, '{titles[0]}' provides a foundational perspective, "
        )
        if len(titles) > 1:
            answer += f"while '{titles[1]}' offers supplementary context. "
        answer += "This answer is grounded in actual archived records."

    return {
        "answer": answer,
        "model": "mock-remembery-v1",
        "confidence": round(min(avg_score + 0.05, 1.0), 4),
    }


# ═════════════════════════════════════════════════════════
# Endpoint
# ═════════════════════════════════════════════════════════

@router.post(
    "/query",
    response_model=schemas.RAGQueryResponse,
    summary="RAG Q&A — Ask a question grounded in the archive",
    description=(
        "Accepts a visitor's free-text question, retrieves semantically "
        "relevant archive records via embedding similarity search, and "
        "generates a context-grounded answer using an LLM.\n\n"
        "**Current mode**: Mock pipeline (swap `_mock_*` functions with "
        "real Gemini / OpenAI / LangChain calls for production)."
    ),
)
def rag_query(
    payload: schemas.RAGQueryRequest,
    db: Session = Depends(get_db),
):
    # 1. Embed the question
    query_embedding = _mock_embed_query(payload.question)

    # 2. Semantic retrieval — find top-K relevant archive items
    context_chunks = _mock_semantic_search(
        db=db,
        query_embedding=query_embedding,
        top_k=payload.top_k,
        owner_id=payload.owner_id,
    )

    # 3. LLM generation with retrieved context
    llm_result = _mock_llm_generate(
        question=payload.question,
        context_chunks=context_chunks,
        language=payload.language,
    )

    # 4. Assemble response
    return schemas.RAGQueryResponse(
        answer=llm_result["answer"],
        context_used=[
            schemas.RAGContextChunk(
                archive_item_id=chunk["archive_item_id"],
                title=chunk["title"],
                snippet=chunk["snippet"],
                relevance_score=chunk["relevance_score"],
            )
            for chunk in context_chunks
        ],
        model=llm_result["model"],
        confidence=llm_result["confidence"],
        disclaimer=(
            "이 답변은 아카이브에 보관된 실제 기록을 기반으로 AI가 생성한 것입니다."
            if payload.language == "ko"
            else "This answer was generated by AI based on actual archived records."
        ),
    )
