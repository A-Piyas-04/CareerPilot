from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.career_assistant.routes.applications import router as applications_router
from app.career_assistant.routes.goals import router as goals_router
from app.cv_intelligence.routes.resumes import router as resumes_router
from app.job_intelligence.routes.jobs import router as jobs_router
from app.core.config import settings

app = FastAPI(title="CareerPilot API")

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
    goals_router,
    prefix=settings.api_v1_prefix,
)
app.include_router(
    resumes_router,
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
    return {"status": "ok"}
