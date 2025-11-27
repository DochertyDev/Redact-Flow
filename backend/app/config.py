import logging
import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# Define supported Presidio entity types
# This list can be customized based on application needs
SUPPORTED_PRESIDIO_ENTITY_TYPES = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "DATE_TIME",
    "LOCATION",
    "CREDIT_CARD",
    "US_SSN",
    "US_BANK_ACCOUNT_NUMBER",
    "IP_ADDRESS",
    "URL",
    "IBAN",
    "CRYPTO",
    "NRP",
    "MEDICAL_LICENSE",
    "US_DRIVER_LICENSE",
    "US_PASSPORT",
    "UK_NHS",
    "UK_NATIONAL_INSURANCE_NUMBER",
    "US_ITIN",
]


class Settings(BaseSettings):
    """
    Application settings, loaded from environment variables.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    TOKEN_MAP_TTL_SECONDS: int = 3600  # Time-to-live for token maps in seconds (1 hour)
    LOG_LEVEL: str = "INFO"

    # Presidio configuration
    PRESIDIO_ENTITY_TYPES: List[str] = SUPPORTED_PRESIDIO_ENTITY_TYPES


@lru_cache()
def get_settings():
    """
    Cached function to get application settings.
    """
    return Settings()


def setup_logging():
    """
    Configures logging for the application.
    """
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=log_level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    logging.getLogger("uvicorn").setLevel(log_level)
    logging.getLogger("uvicorn.access").setLevel(log_level)
    logging.getLogger("presidio-analyzer").setLevel(log_level)
    logging.getLogger("presidio-anonymizer").setLevel(log_level)

    # Suppress some chatty loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
