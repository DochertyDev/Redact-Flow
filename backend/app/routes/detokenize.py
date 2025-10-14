import logging
import time

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.models.requests import DetokenizeRequest
from app.models.responses import DetokenizeResponse, ErrorResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/detokenize", response_model=DetokenizeResponse, status_code=status.HTTP_200_OK, summary="Detokenize text using a stored token map")
async def detokenize_text_endpoint(request: Request, detokenize_request: DetokenizeRequest):
    """
    Receives text containing tokens and a token_map_id, then replaces the tokens
    with their original PII values from the stored token map.
    """
    start_time = time.time()
    token_map_service = request.app.state.token_map_service

    try:
        token_map = token_map_service.get_token_map(detokenize_request.token_map_id)

        if not token_map:
            error_response = ErrorResponse(
                code="TOKEN_MAP_NOT_FOUND",
                message="Token map not found or expired.",
                details={"token_map_id": str(detokenize_request.token_map_id)},
            ).model_dump()
            return JSONResponse(content=error_response, status_code=status.HTTP_404_NOT_FOUND)

        detokenized_text = detokenize_request.text
        # Replace tokens with original values. Iterate through the token_map to ensure all tokens are replaced.
        # It's important to replace longer tokens first to avoid partial replacements.
        sorted_tokens = sorted(token_map.keys(), key=len, reverse=True)

        for token in sorted_tokens:
            original_value = token_map[token]["original_value"]
            detokenized_text = detokenized_text.replace(token, original_value)

        processing_time_ms = (time.time() - start_time) * 1000
        logger.info(f"Detokenization complete in {processing_time_ms:.2f}ms for token_map_id: {detokenize_request.token_map_id}")

        return DetokenizeResponse(
            detokenized_text=detokenized_text,
            processing_time_ms=processing_time_ms,
        )

    except Exception as e:
        logger.exception("Detokenization failed.")
        error_response = ErrorResponse(
            code="DETOKENIZATION_ERROR",
            message="Failed to detokenize text.",
            details={"error": str(e)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
