from pydantic_settings import BaseSettings
from pathlib import Path
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./frpet.db"
    FRONTEND_ORIGIN: str = "http://localhost:3000,http://127.0.0.1:3000"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    MAILRU_REDIRECT_URI: str = "http://localhost:8000/api/auth/mailru/callback"
    SECRET_KEY: str = "frpet-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    UPLOAD_DIR: str = str(Path(__file__).parent / "uploads")
    MAX_FILE_SIZE: int = 5 * 1024 * 1024
    ALLOWED_EXTENSIONS: list = ["jpg", "jpeg", "png", "gif", "webp"]

    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = "ФРИПЕТ <noreply@frpet.ru>"

    BREVO_API_KEY: str = ""

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_EMAIL: str = "admin@frpet.ru"

    TEST_USERNAME: str = "testuser"
    TEST_PASSWORD: str = "123456"
    TEST_EMAIL: str = "test@frpet.ru"

    MAILRU_CLIENT_ID: str = ""
    MAILRU_CLIENT_SECRET: str = ""

    SMS_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
