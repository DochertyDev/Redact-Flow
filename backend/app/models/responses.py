from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TokenInfo(BaseModel):
    """
    Represents information about a detected token.
    """

    token: str = Field(..., description="The generated token string (e.g., [PERSON_1]).")
    original_value: str = Field(..., description="The original PII value before tokenization.") # <--- Add this
    entity_type: str = Field(..., description="The type of entity detected (e.g., PERSON, EMAIL_ADDRESS).")
    start: int = Field(..., description="The start index of the original entity in the text.")
    end: int = Field(..., description="The end index of the original entity in the text.")
    score: float = Field(..., description="The confidence score of the entity detection.")


class SanitizeResponse(BaseModel):
    """
    Response model for text sanitization.
    """

    sanitized_text: str = Field(..., description="The text with PII replaced by tokens.")
    token_map_id: UUID = Field(..., description="The ID of the generated token map.")
    tokens: List[TokenInfo] = Field(..., description="List of detected tokens and their information.")
    processing_time_ms: float = Field(..., description="Time taken for sanitization in milliseconds.")
    additional_occurrences: Optional[int] = Field(None, description="Number of additional occurrences found and tokenized (for manual tokenization).")


class DetokenizeResponse(BaseModel):
    """
    Response model for text detokenization.
    """

    detokenized_text: str = Field(..., description="The text with tokens replaced by original PII.")
    processing_time_ms: float = Field(..., description="Time taken for detokenization in milliseconds.")


class ErrorResponse(BaseModel):
    """
    Standard error response model.
    """

    code: str = Field(..., description="A unique error code.")
    message: str = Field(..., description="A human-readable error message.")
    details: Optional[dict] = Field(None, description="Optional additional error details.")
