"""Application configuration from environment variables."""
from functools import lru_cache
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    embedding_backend: str = Field(default="hashing", validation_alias="EMBEDDING_BACKEND")

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
