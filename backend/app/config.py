from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "sqlite:///./dev.db"
    app_name: str = "Heat Treatment Simulator API"
    debug: bool = True


settings = Settings()
