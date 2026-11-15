import secrets
import hashlib
from typing import Optional
from backend.app.core.config import settings

def generate_secure_token(nbytes: int = 32) -> str:
    """Generate a cryptographically secure, unguessable token for jobs and download tokens."""
    return secrets.token_urlsafe(nbytes)

def generate_guest_session_id() -> str:
    """Generate an anonymous session ID for guest tracking."""
    return f"sess_{secrets.token_hex(16)}"

def hash_token(token: str) -> str:
    """Compute SHA-256 hash of a token for secure storage or verification."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

