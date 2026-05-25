"""Job Intelligence models package."""
from app.job_intelligence.models.job_search import JobSearch, JobSearchCreate, JobSearchUpdate
from app.job_intelligence.models.job import Job, JobCreate, JobUpdate
from app.job_intelligence.models.job_match import JobMatch, JobMatchCreate, JobMatchUpdate

__all__ = [
    "JobSearch",
    "JobSearchCreate",
    "JobSearchUpdate",
    "Job",
    "JobCreate",
    "JobUpdate",
    "JobMatch",
    "JobMatchCreate",
    "JobMatchUpdate",
]