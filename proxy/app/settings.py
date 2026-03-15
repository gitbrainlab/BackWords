from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", env_file=".env", extra="ignore")

    DATA_DIR: Path = Path(__file__).resolve().parents[2] / "data"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    MODEL_VERSION: str = "mock-seed-v1"


settings = Settings()
