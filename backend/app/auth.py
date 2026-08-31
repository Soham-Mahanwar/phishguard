"""Real user accounts: signup/login/logout/me, plus optional-auth dependency
helpers used additively by other routers. Purely additive feature - nothing
here is required for the app to function anonymously.

Tokens are itsdangerous URLSafeTimedSerializer tokens (stateless - nothing
server-tracked, so "logout" is just a client-side localStorage clear).
"""
import os

from fastapi import APIRouter, Depends, Header, HTTPException
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.models import User

router = APIRouter()

SESSION_SECRET = os.getenv("SESSION_SECRET", "dev-secret-change-me")
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30  # 30 days

_serializer = URLSafeTimedSerializer(SESSION_SECRET, salt="phishguard-auth")
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _pwd_context.verify(password, password_hash)
    except Exception:  # noqa: BLE001 - malformed hash should never crash login
        return False


def make_token(user: User) -> str:
    return _serializer.dumps({"user_id": user.id, "email": user.email})


def _decode_token(token: str) -> dict | None:
    try:
        return _serializer.loads(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired, Exception):  # noqa: BLE001
        return None


def get_current_user_optional(
    authorization: str | None = Header(None),
    session: Session = Depends(get_session),
) -> User | None:
    """Never raises. Returns None whenever the header is missing, malformed,
    expired, or doesn't resolve to a real user - callers treat that exactly
    like an anonymous request.
    """
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    if not token:
        return None
    data = _decode_token(token)
    if not data:
        return None
    user_id = data.get("user_id")
    if user_id is None:
        return None
    try:
        return session.query(User).filter(User.id == user_id).first()
    except Exception:  # noqa: BLE001
        return None


def get_current_user_required(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="not authenticated")
    return user


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    email: str


@router.post("/auth/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, session: Session = Depends(get_session)):
    email = payload.email.strip().lower()
    password = payload.password or ""
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="a valid email is required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="password must be at least 6 characters")

    existing = session.query(User).filter(User.email == email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="an account with this email already exists")

    user = User(email=email, password_hash=hash_password(password))
    session.add(user)
    session.commit()
    session.refresh(user)

    return AuthResponse(token=make_token(user), email=user.email)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    email = payload.email.strip().lower()
    user = session.query(User).filter(User.email == email).first()
    if user is None or not verify_password(payload.password or "", user.password_hash):
        raise HTTPException(status_code=401, detail="invalid email or password")

    return AuthResponse(token=make_token(user), email=user.email)


@router.post("/auth/logout")
def logout():
    # Stateless tokens: nothing to invalidate server-side. The frontend is
    # responsible for clearing its stored token.
    return {"ok": True}


@router.get("/auth/me")
def me(user: User = Depends(get_current_user_required)):
    return {"id": user.id, "email": user.email}
