from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.career_assistant.routes.applications import router as applications_router
from app.core.config import settings

app = FastAPI(title="CareerPilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    applications_router,
    prefix=settings.api_v1_prefix,
)


@app.get("/")
def root():
    return {"message": "CareerPilot Backend Running"}


@app.get("/health")
def health():
    return {"status": "ok"}
