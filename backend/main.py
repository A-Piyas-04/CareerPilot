import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.career_assistant.routes.applications import router as applications_router
from app.career_assistant.routes.career import router as career_router
from app.career_assistant.routes.goals import router as goals_router
from app.cv_intelligence.routes.rag import router as rag_router
from app.cv_intelligence.routes.resumes import router as resumes_router
from app.cv_intelligence.services.embedding_config_validator import (
    get_embedding_config_summary,
    validate_embedding_config_at_startup,
)
from app.cv_intelligence.services.reembedding_service import get_reembedding_status
from app.job_intelligence.routes.jobs import router as jobs_router
from app.core.config import settings

logger = logging.getLogger(__name__)

_embedding_config_cache: dict = {}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Validate embedding configuration on startup."""
    global _embedding_config_cache
    try:
        _embedding_config_cache = validate_embedding_config_at_startup(strict=True)
    except Exception as exc:
        logger.error("Embedding configuration validation failed: %s", exc)
        raise
    yield


app = FastAPI(title="CareerPilot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cors_headers(request: Request) -> dict[str, str]:
    """Return CORS headers for the request origin when the origin is allowed."""
    origin = request.headers.get("origin")
    if origin and (origin in settings.cors_origins or "*" in settings.cors_origins):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Ensure HTTPException responses always carry CORS headers."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_cors_headers(request),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch unhandled exceptions and return a CORS-safe 500 response."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=_cors_headers(request),
    )


app.include_router(
    applications_router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    career_router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    goals_router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    resumes_router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    rag_router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    jobs_router,
    prefix=settings.api_v1_prefix,
)


@app.get("/")
def root():
    return {"message": "CareerPilot Backend Running"}


@app.get("/health")
def health():
    embedding_config = _embedding_config_cache or get_embedding_config_summary()
    return {
        "status": "ok",
        "embedding_config": embedding_config,
        "embedding_migration": get_reembedding_status(),
    }
