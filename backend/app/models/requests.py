from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SanitizeRequest(BaseModel):
    """
    Request model for sanitizing text.
    """

    text: str = Field(..., min_length=1, description="The text to be sanitized.")
    presidio_config: Optional[dict] = Field(
        None, description="Optional custom Presidio configuration for entity detection."
    )


class DetokenizeRequest(BaseModel):
    """
    Request model for detokenizing text.
    """

    token_map_id: UUID = Field(..., description="The ID of the token map to use for detokenization.")
    text: str = Field(..., min_length=1, description="The text containing tokens to be detokenized.")


class TokenUpdate(BaseModel):
    """
    Model for a single token update.
    """

    token: str = Field(..., description="The token string (e.g., [PERSON_1]).")
    original_value: str = Field(..., description="The new original value for the token.")
    entity_type: str = Field(..., description="The entity type of the token (e.g., PERSON).")


class TokenUpdateRequest(BaseModel):
    """
    Request model for updating multiple tokens in a token map.
    """

    token_map_id: UUID = Field(..., description="The ID of the token map to update.")
    updates: List[TokenUpdate] = Field(..., min_length=1, description="List of token updates.")


class ManualTokenRequest(BaseModel):
    """
    Request model for manually adding a token.
    """
    token_map_id: UUID = Field(..., description="The ID of the token map to update.")
    text_to_tokenize: str = Field(..., min_length=1, description="The exact text span to tokenize.")
    entity_type: str = Field(..., description="The entity type for the manual token (e.g., EMPLOYEE_ID).")
    start: int = Field(..., ge=0, description="The start index of the text_to_tokenize in the original document.")
    end: int = Field(..., ge=0, description="The end index of the text_to_tokenize in the original document.")


class RevertTokenRequest(BaseModel):
    """
    Request model for reverting a single token back to its original value.
    """
    token_map_id: UUID = Field(..., description="The ID of the token map to update.")
    token: str = Field(..., description="The token string to revert (e.g., [PERSON_1]).")
