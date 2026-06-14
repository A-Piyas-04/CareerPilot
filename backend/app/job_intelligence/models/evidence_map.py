"""Pydantic models for JD ↔ CV Evidence Map API."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

EvidenceMapStatus = Literal["strong", "weak", "missing"]
EvidenceMapCategory = Literal[
    "skill", "technical", "experience", "education", "soft_skill", "other"
]
EvidenceMapSource = Literal["skill_extraction", "jd_parse", "llm_extract"]


class EvidenceMapChunk(BaseModel):
    chunk_id: str
    section_name: str
    snippet: str
    similarity: float = 0.0


class EvidenceMapRow(BaseModel):
    id: str
    label: str
    category: EvidenceMapCategory
    status: EvidenceMapStatus
    source: EvidenceMapSource
    matched_skill: bool = False
    top_similarity: float = 0.0
    evidence_chunks: list[EvidenceMapChunk] = Field(default_factory=list)
    guidance: Optional[str] = None


class EvidenceMapSummary(BaseModel):
    strong_count: int = 0
    weak_count: int = 0
    missing_count: int = 0
    total_requirements: int = 0
    coverage_percent: int = 0


class EvidenceMapJob(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None


class EvidenceMapResponse(BaseModel):
    match_id: str
    job: EvidenceMapJob
    fit_score: float
    summary: EvidenceMapSummary
    rows: list[EvidenceMapRow] = Field(default_factory=list)
    generated_at: str
    empty_reason: Optional[str] = None
