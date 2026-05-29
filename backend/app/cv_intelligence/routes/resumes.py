"""CV Intelligence resume routes."""
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.core.database import get_supabase_client
from app.cv_intelligence.models.resume import Resume
from app.cv_intelligence.models.resume_chunk import ResumeChunk
from app.cv_intelligence.models.resume_section import ResumeSection
from app.cv_intelligence.models.user_skill import UserSkill
from app.cv_intelligence.services import rag_context_service, resume_service

router = APIRouter(prefix="/resumes", tags=["resumes"])


# ---------------------------------------------------------------------------
# Response / request schemas (route-specific, not DB models)
# ---------------------------------------------------------------------------

class ResumeDetailResponse(BaseModel):
    resume: Resume
    sections: list[ResumeSection]
    skills: list[UserSkill]
    chunk_count: int


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    resume_id: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=50)


class AnswerRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    resume_id: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)


class AnswerResponse(BaseModel):
    answer: str
    evidence_chunks: list["ChunkQueryResult"]


class ChunkQueryResult(BaseModel):
    chunk_id: str
    resume_id: str
    section_name: Optional[str] = None
    chunk_text: str
    similarity: float


class BuildSectionInput(BaseModel):
    section_name: str = Field(..., min_length=1, max_length=64)
    content: str = Field(..., min_length=1, max_length=20000)


class BuildResumeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    sections: list[BuildSectionInput] = Field(..., min_length=1, max_length=12)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/build",
    response_model=Resume,
    status_code=status.HTTP_201_CREATED,
    summary="Create and index a CV from in-app builder sections",
)
def build_resume(
    payload: BuildResumeRequest,
    user_id: str = Depends(get_current_user),
) -> Resume:
    """Accept structured sections, chunk, embed, and mark the resume processed."""
    section_dicts = [
        {"section_name": s.section_name, "content": s.content}
        for s in payload.sections
    ]
    return resume_service.process_resume_from_sections(
        user_id=user_id,
        title=payload.title,
        sections=section_dicts,
    )


@router.put(
    "/{resume_id}/build",
    response_model=Resume,
    summary="Rebuild an existing CV from in-app builder sections",
)
def rebuild_resume(
    resume_id: str,
    payload: BuildResumeRequest,
    user_id: str = Depends(get_current_user),
) -> Resume:
    """Replace sections/chunks/skills for an owned resume and re-index."""
    section_dicts = [
        {"section_name": s.section_name, "content": s.content}
        for s in payload.sections
    ]
    return resume_service.rebuild_resume_from_sections(
        user_id=user_id,
        resume_id=resume_id,
        title=payload.title,
        sections=section_dicts,
    )


@router.post(
    "/upload",
    response_model=Resume,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process a CV (PDF or DOCX)",
)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
) -> Resume:
    """
    Accept a PDF or DOCX file, extract text, detect sections, generate
    embeddings, and store all CV data in Supabase.
    """
    file_bytes = await file.read()
    return resume_service.process_resume(
        user_id=user_id,
        filename=file.filename or "resume",
        file_bytes=file_bytes,
    )


@router.get(
    "",
    response_model=list[Resume],
    summary="List all resumes for the current user",
)
def list_resumes(
    user_id: str = Depends(get_current_user),
) -> list[Resume]:
    """Return the current user's resumes ordered by created_at descending."""
    return resume_service.list_resumes(user_id=user_id)


@router.get(
    "/{resume_id}",
    response_model=ResumeDetailResponse,
    summary="Get resume detail with sections, skills, and chunk count",
)
def get_resume_detail(
    resume_id: str,
    user_id: str = Depends(get_current_user),
) -> ResumeDetailResponse:
    """Return full resume metadata including sections, extracted skills, and chunk count."""
    detail = resume_service.get_resume_detail(user_id=user_id, resume_id=resume_id)
    return ResumeDetailResponse(**detail)


@router.get(
    "/{resume_id}/chunks",
    response_model=list[ResumeChunk],
    summary="List all text chunks for a resume",
)
def get_resume_chunks(
    resume_id: str,
    user_id: str = Depends(get_current_user),
) -> list[ResumeChunk]:
    """Return all chunks for the specified resume. Ownership is enforced."""
    return resume_service.get_resume_chunks(user_id=user_id, resume_id=resume_id)


@router.post(
    "/query",
    response_model=list[ChunkQueryResult],
    summary="Semantic search over resume chunks",
)
def query_resume_chunks(
    payload: QueryRequest,
    user_id: str = Depends(get_current_user),
) -> list[ChunkQueryResult]:
    """
    Embed the query and return the top-k most relevant resume chunks.

    Optionally scope the search to a single resume via resume_id.
    Uses pgvector RPC when available, falls back to numpy cosine similarity.
    """
    supabase = get_supabase_client()
    rag = rag_context_service.retrieve_cv_context(
        user_id=user_id,
        query=payload.query,
        supabase=supabase,
        resume_id=payload.resume_id,
        top_k=payload.top_k,
        intent="general",
    )
    return [ChunkQueryResult(**c) for c in rag.chunks]


@router.post(
    "/answer",
    response_model=AnswerResponse,
    summary="Ask a question grounded in your CV (RAG + LLM)",
)
def answer_cv_question(
    payload: AnswerRequest,
    user_id: str = Depends(get_current_user),
) -> AnswerResponse:
    """
    Retrieve the most relevant CV chunks for the question, then ask Gemini to
    answer using only those chunks as evidence.  Returns the AI answer plus the
    evidence chunks so the frontend can display citations.
    """
    from app.cv_intelligence.services import llm_service  # noqa: PLC0415

    supabase = get_supabase_client()
    rag = rag_context_service.retrieve_cv_context(
        user_id=user_id,
        query=payload.question,
        supabase=supabase,
        resume_id=payload.resume_id,
        top_k=payload.top_k,
        intent="general",
    )
    answer = llm_service.answer_from_chunks(
        question=payload.question,
        chunks=rag.chunks,
    )
    return AnswerResponse(
        answer=answer,
        evidence_chunks=[ChunkQueryResult(**c) for c in rag.chunks],
    )


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a resume and all associated data",
)
def delete_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user),
) -> Response:
    """
    Delete a resume row.  Cascade DELETE in the DB removes resume_sections,
    resume_chunks, and sets resume_id=null on user_skills automatically.
    Returns 404 if the resume does not exist or belongs to another user.
    """
    resume_service.delete_resume(user_id=user_id, resume_id=resume_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
