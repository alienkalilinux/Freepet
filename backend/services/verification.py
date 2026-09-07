import hashlib
from datetime import datetime, timedelta, timezone


CODE_EXPIRY_MINUTES = 5


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def create_code_with_expiry() -> tuple[str, str, datetime]:
    """Returns (hashed_code, raw_code, expires_at)"""
    import secrets
    import string

    chars = string.ascii_uppercase + string.digits
    raw = ''.join(secrets.choice(chars) for _ in range(8))
    raw = f"{raw[:4]}-{raw[4:]}"

    hashed = hash_code(raw)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)

    return hashed, raw, expires_at


def create_sms_code_with_expiry() -> tuple[str, str, datetime]:
    """Returns (hashed_code, raw_code, expires_at) for SMS"""
    import random
    import string

    raw = ''.join(random.choices(string.digits, k=6))
    hashed = hash_code(raw)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)

    return hashed, raw, expires_at


def is_code_expired(expires_at: datetime | None) -> bool:
    if expires_at is None:
        return True
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return now > expires_at


def verify_code(stored_hash: str | None, raw_code: str, expires_at: datetime | None) -> tuple[bool, str]:
    if not stored_hash:
        return False, "Код верификации не найден"

    if is_code_expired(expires_at):
        return False, "Срок действия кода истёк (5 минут). Запросите новый"

    input_hash = hash_code(raw_code)
    if input_hash != stored_hash:
        return False, "Неверный код верификации"

    return True, "OK"
