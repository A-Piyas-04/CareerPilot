"""RAG context API — shared retrieval for assistant and career features."""
from typing import Literal, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.core.database import get_supabase_client
from app.cv_intelligence.services import rag_context_service

router = APIRouter(prefix="/rag", tags=["RAG"])


class RagContextRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=8000)
    resume_id: Optional[str] = None
    top_k: Optional[int] = Field(default=None, ge=1, le=20)
    intent: Optional[
        Literal[
            "readiness_check",
            "skill_gap",
            "roadmap_generation",
            "cover_letter",
            "general",
        ]
    ] = None


class RagChunkResult(BaseModel):
    chunk_id: str
    resume_id: str
    section_name: Optional[str] = None
    chunk_text: str
    similarity: float


class RagContextResponse(BaseModel):
    resume_id: Optional[str] = None
    resume_status: Optional[str] = None
    has_resume: bool
    chunks: list[RagChunkResult]
    chunk_ids: list[str]
    context_text: str
    user_skills: list[str]
    empty_reason: Optional[str] = None


def _to_response(result: rag_context_service.RagContextResult) -> RagContextResponse:
    return RagContextResponse(
        resume_id=result.resume_id,
        resume_status=result.resume_status,
        has_resume=result.has_resume,
        chunks=[
            RagChunkResult(
                chunk_id=str(c["chunk_id"]),
                resume_id=str(c["resume_id"]),
                section_name=c.get("section_name"),
                chunk_text=c.get("chunk_text") or "",
                similarity=float(c.get("similarity", 0.0)),
            )
            for c in result.chunks
        ],
        chunk_ids=result.chunk_ids,
        context_text=result.context_text,
        user_skills=result.user_skills,
        empty_reason=result.empty_reason,
    )


@router.post(
    "/context",
    response_model=RagContextResponse,
    summary="Retrieve RAG-grounded CV context for a query",
)
def get_rag_context(
    payload: RagContextRequest,
    user_id: str = Depends(get_current_user),
) -> RagContextResponse:
    """Return semantic resume chunks and formatted context for downstream AI features."""
    supabase = get_supabase_client()
    result = rag_context_service.retrieve_cv_context(
        user_id=user_id,
        query=payload.query,
        supabase=supabase,
        resume_id=payload.resume_id,
        top_k=payload.top_k,
        intent=payload.intent,
    )
    return _to_response(result)
