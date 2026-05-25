"""Resume chunk model - Text chunks with embeddings for RAG."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

try:
    from pydantic import ConfigDict
    HAS_VECTOR_SUPPORT = True
except ImportError:
    HAS_VECTOR_SUPPORT = False


class ResumeChunkBase(BaseModel):
    """Base resume chunk fields."""
    section_name: Optional[str] = None
    chunk_index: int
    chunk_text: str
    token_count: Optional[int] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ResumeChunkCreate(ResumeChunkBase):
    """Resume chunk creation schema."""
    resume_id: str
    user_id: str
    section_id: Optional[str] = None
    embedding: Optional[list[float]] = None


class ResumeChunkUpdate(BaseModel):
    """Resume chunk update schema."""
    chunk_text: Optional[str] = None
    token_count: Optional[int] = None
    embedding: Optional[list[float]] = None
    metadata: Optional[dict[str, Any]] = None


class ResumeChunk(ResumeChunkBase):
    """Full resume chunk model."""
    id: str
    resume_id: str
    user_id: str
    section_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeChunkWithEmbedding(ResumeChunk):
    """Resume chunk with vector embedding."""
    embedding: list[float]