"""Authentication helpers for FastAPI routes."""
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_supabase_client


bearer_scheme = HTTPBearer(auto_error=False)


def _read_attr(value: Any, name: str) -> Any:
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name, None)


def _extract_user_id(auth_response: Any) -> str | None:
    data = _read_attr(auth_response, "data") or auth_response
    user = _read_attr(data, "user") or data
    user_id = _read_attr(user, "id") or _read_attr(user, "sub")

    if user_id:
        return str(user_id)

    claims = _read_attr(auth_response, "claims") or _read_attr(data, "claims")
    claim_sub = _read_attr(claims, "sub")
    return str(claim_sub) if claim_sub else None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """Validate the Supabase access token and return the authenticated user id."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = credentials.credentials
    supabase = get_supabase_client()

    try:
        if hasattr(supabase.auth, "get_claims"):
            auth_response = supabase.auth.get_claims(token)
        else:
            auth_response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from exc

    user_id = _extract_user_id(auth_response)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    return user_id
