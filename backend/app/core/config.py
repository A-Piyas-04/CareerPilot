"""Application configuration from environment variables."""
from os import getenv
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase
    supabase_url: str = getenv("SUPABASE_URL", "")
    supabase_key: str = getenv("SUPABASE_SERVICE_KEY", "")
    supabase_anon_key: str = getenv("SUPABASE_ANON_KEY", "")
    
    # Database
    database_url: str = getenv("DATABASE_URL", "")
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    project_name: str = "CareerPilot"
    debug: bool = getenv("DEBUG", "false").lower() == "true"
    
    # CORS
    cors_origins: list[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()