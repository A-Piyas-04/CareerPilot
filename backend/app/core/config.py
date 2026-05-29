"""Application configuration from environment variables."""
from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Must match Supabase resume_chunks.embedding and match_resume_chunks RPC (vector(384)).
DEFAULT_EMBEDDING_VECTOR_DIM = 384
ALLOWED_EMBEDDING_COLUMNS = frozenset({"embedding", "embedding_new"})


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_URL",
        ),
    )
    supabase_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_SERVICE_KEY",
            "SUPABASE_SECRET_KEY",
        ),
    )
    supabase_anon_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_ANON_KEY",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        ),
    )

    # Database
    database_url: str = Field(default="", validation_alias="DATABASE_URL")

    # API Settings
    api_v1_prefix: str = "/api/v1"
    project_name: str = "CareerPilot"
    debug: bool = Field(default=False, validation_alias="DEBUG")

    # AI / ML
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    embedding_backend: str = Field(default="gemini", validation_alias="EMBEDDING_BACKEND")
    analysis_backend: str = Field(default="gemini", validation_alias="ANALYSIS_BACKEND")
    gemini_embedding_model: str = Field(
        default="models/embedding-001",
        validation_alias="GEMINI_EMBEDDING_MODEL",
    )
    embedding_vector_dim: int = Field(
        default=DEFAULT_EMBEDDING_VECTOR_DIM,
        validation_alias="EMBEDDING_VECTOR_DIM",
    )
    retrieval_require_dim_match: bool = Field(
        default=True,
        validation_alias="RETRIEVAL_REQUIRE_DIM_MATCH",
    )
    embedding_active_column: str = Field(
        default="embedding",
        validation_alias="EMBEDDING_ACTIVE_COLUMN",
    )

    @field_validator("embedding_active_column")
    @classmethod
    def _validate_embedding_column(cls, value: str) -> str:
        column = (value or "embedding").strip()
        if column not in ALLOWED_EMBEDDING_COLUMNS:
            allowed = ", ".join(sorted(ALLOWED_EMBEDDING_COLUMNS))
            raise ValueError(
                f"EMBEDDING_ACTIVE_COLUMN must be one of: {allowed}. Got: {value!r}"
            )
        return column

    @field_validator("embedding_vector_dim")
    @classmethod
    def _validate_embedding_dim(cls, value: int) -> int:
        if value < 1 or value > 4096:
            raise ValueError("EMBEDDING_VECTOR_DIM must be between 1 and 4096.")
        return value

    # ─── External job-search providers ───────────────────────────────────────
    rapidapi_key: str = Field(default="", validation_alias="RAPIDAPI_KEY")
    rapidapi_host: str = Field(
        default="jsearch.p.rapidapi.com",
        validation_alias="RAPIDAPI_HOST",
    )

    # CORS
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        validation_alias="CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
