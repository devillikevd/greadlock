import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/traffic_db"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/traffic_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = "mock-key"
    SECRET_KEY: str = "4eb8d9bfd68e596da34b45efea01c80f123456789abcdef0123456789abcdef"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: str = "*"
    OPENWEATHER_API_KEY: str = ""

    # Check for .env in current dir and backend/ directory
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        if not self.ALLOWED_ORIGINS or self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
