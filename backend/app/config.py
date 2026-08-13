from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "KEMENHAJ Riau API"
    app_env: str = "production"
    secret_key: str
    access_token_expire_minutes: int = 480
    database_url: str
    cors_origins: str = "https://kemenhaj-pi.vercel.app"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
