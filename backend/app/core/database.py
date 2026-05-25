"""Database connection and client setup for Supabase."""
from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """Get or create Supabase client instance."""
    global _supabase_client
    
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables"
            )
        _supabase_client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key
        )
    
    return _supabase_client


def get_anon_client() -> Client:
    """Get Supabase client with anon key for client-side operations."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables"
        )
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_anon_key
    )
