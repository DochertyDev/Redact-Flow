import logging

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from uuid import UUID

from app.models.requests import TokenUpdateRequest, ManualTokenRequest, RevertTokenRequest
from app.models.responses import ErrorResponse, SanitizeResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/tokens/update", status_code=status.HTTP_200_OK, summary="Update token mappings")
async def update_token_mappings(request: Request, token_update_request: TokenUpdateRequest):
    """
    Updates the original values of specific tokens within an existing token map.
    This is used for manual corrections of PII.
    """
    token_map_service = request.app.state.token_map_service

    try:
        success = token_map_service.update_token_map(
            token_update_request.token_map_id, token_update_request.updates
        )
        if success:
            logger.info(f"Token map {token_update_request.token_map_id} updated successfully.")
            return JSONResponse(content={"message": "Token map updated successfully."}, status_code=status.HTTP_200_OK)
        else:
            error_response = ErrorResponse(
                code="TOKEN_MAP_UPDATE_FAILED",
                message="Failed to update token map. It might not exist or be expired.",
                details={"token_map_id": str(token_update_request.token_map_id)},
            ).model_dump()
            return JSONResponse(content=error_response, status_code=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.exception("Failed to update token map.")
        error_response = ErrorResponse(
            code="TOKEN_MAP_UPDATE_ERROR",
            message="An unexpected error occurred while updating the token map.",
            details={"error": str(e)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.delete("/tokens/{token_map_id}", status_code=status.HTTP_200_OK, summary="Delete a token map")
async def delete_token_map_endpoint(request: Request, token_map_id: str):
    """
    Deletes a specific token map by its ID.
    """
    token_map_service = request.app.state.token_map_service

    try:
        success = token_map_service.delete_token_map(UUID(token_map_id))
        if success:
            logger.info(f"Token map {token_map_id} deleted successfully.")
            return JSONResponse(content={"message": "Token map deleted successfully."}, status_code=status.HTTP_200_OK)
        else:
            error_response = ErrorResponse(
                code="TOKEN_MAP_NOT_FOUND",
                message="Token map not found.",
                details={"token_map_id": token_map_id},
            ).model_dump()
            return JSONResponse(content=error_response, status_code=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.exception("Failed to delete token map.")
        error_response = ErrorResponse(
            code="TOKEN_MAP_DELETE_ERROR",
            message="An unexpected error occurred while deleting the token map.",
            details={"error": str(e)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/tokens/manual", status_code=status.HTTP_200_OK, summary="Manually add a token")
async def manual_tokenization_endpoint(request: Request, manual_token_request: ManualTokenRequest):
    """
    Allows a user to manually tokenize a selected span of text.
    """
    presidio_service = request.app.state.presidio_service
    token_map_service = request.app.state.token_map_service

    try:
        # 1. Retrieve the existing token map and original text
        token_map_entry = token_map_service.get_token_map_entry(manual_token_request.token_map_id)
        if not token_map_entry:
            error_response = ErrorResponse(
                code="TOKEN_MAP_NOT_FOUND",
                message="Token map not found or expired.",
                details={"token_map_id": str(manual_token_request.token_map_id)},
            ).model_dump()
            return JSONResponse(content=error_response, status_code=status.HTTP_404_NOT_FOUND)

        original_text = token_map_entry.original_text
        existing_results = token_map_entry.tokens_info_raw # This is a list of RecognizerResult objects

        # 2. Integrate the manual token and find all occurrences
        updated_results, additional_occurrences = presidio_service.integrate_manual_token(
            original_text,
            existing_results,
            manual_token_request.model_dump() # Pass the relevant info from the request
        )

        # 3. Re-anonymize the text with the updated results
        sanitized_text, token_mapping, tokens_info = presidio_service.anonymize_text(
            original_text, updated_results
        )

        # 4. Update the token map service with the new data
        token_map_service.update_token_map_entry_after_manual_tokenization(
            token_map_id=manual_token_request.token_map_id,
            sanitized_text=sanitized_text,
            token_mapping=token_mapping,
            tokens_info=tokens_info,
            tokens_info_raw=tokens_info # This is List[Dict]
        )

        logger.info(f"Manual token added to token map {manual_token_request.token_map_id}.")
        return SanitizeResponse(
            sanitized_text=sanitized_text,
            token_map_id=manual_token_request.token_map_id,
            tokens=tokens_info,
            processing_time_ms=0.0, # Placeholder, actual time not measured for manual op
            additional_occurrences=additional_occurrences
        )

    except ValueError as e:
        # Handle overlap validation errors with a specific error response
        logger.warning(f"Manual tokenization validation failed: {str(e)}")
        error_response = ErrorResponse(
            code="MANUAL_TOKEN_OVERLAP",
            message=str(e),
            details={"token_map_id": str(manual_token_request.token_map_id)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception("Failed to manually add token to map.")
        error_response = ErrorResponse(
            code="MANUAL_TOKEN_ERROR",
            message="An unexpected error occurred while manually adding a token.",
            details={"error": str(e)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post("/tokens/revert", status_code=status.HTTP_200_OK, summary="Revert a token back to its original value")
async def revert_token_endpoint(request: Request, revert_token_request: RevertTokenRequest):
    """
    Reverts a specific token back to its original value by removing it from the token map
    and re-anonymizing the text without that entity.
    """
    presidio_service = request.app.state.presidio_service
    token_map_service = request.app.state.token_map_service

    try:
        # 1. Retrieve the existing token map and original text
        token_map_entry = token_map_service.get_token_map_entry(revert_token_request.token_map_id)
        if not token_map_entry:
            error_response = ErrorResponse(
                code="TOKEN_MAP_NOT_FOUND",
                message="Token map not found or expired.",
                details={"token_map_id": str(revert_token_request.token_map_id)},
            ).model_dump()
            return JSONResponse(content=error_response, status_code=status.HTTP_404_NOT_FOUND)

        original_text = token_map_entry.original_text
        existing_results = token_map_entry.tokens_info_raw  # List of dict representations
        current_token_mapping = token_map_entry.mappings

        # 2. Filter out the token to revert
        filtered_results = presidio_service.filter_results_by_token(
            original_text,
            existing_results,
            revert_token_request.token,
            current_token_mapping
        )

        # 3. Re-anonymize the text with the filtered results
        sanitized_text, token_mapping, tokens_info = presidio_service.anonymize_text(
            original_text, filtered_results
        )

        # 4. Update the token map service with the new data
        token_map_service.update_token_map_entry_after_manual_tokenization(
            token_map_id=revert_token_request.token_map_id,
            sanitized_text=sanitized_text,
            token_mapping=token_mapping,
            tokens_info=tokens_info,
            tokens_info_raw=tokens_info  # Updated list of dicts
        )

        logger.info(f"Token {revert_token_request.token} reverted in token map {revert_token_request.token_map_id}.")
        return SanitizeResponse(
            sanitized_text=sanitized_text,
            token_map_id=revert_token_request.token_map_id,
            tokens=tokens_info,
            processing_time_ms=0.0  # Placeholder, actual time not measured for revert op
        )

    except Exception as e:
        logger.exception("Failed to revert token.")
        error_response = ErrorResponse(
            code="REVERT_TOKEN_ERROR",
            message="An unexpected error occurred while reverting the token.",
            details={"error": str(e)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
