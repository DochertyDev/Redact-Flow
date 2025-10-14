import logging
import time
import traceback

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.models.requests import SanitizeRequest
from app.models.responses import ErrorResponse, SanitizeResponse, TokenInfo

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/sanitize", response_model=SanitizeResponse, status_code=status.HTTP_200_OK, summary="Sanitize text by detecting and anonymizing PII")
async def sanitize_text_endpoint(request: Request, sanitize_request: SanitizeRequest):
    """
    Receives a text, detects PII using Presidio, and replaces it with unique tokens.
    A token map is created and stored for later detokenization.
    """
    start_time = time.time()
    presidio_service = request.app.state.presidio_service
    token_map_service = request.app.state.token_map_service

    try:
        # 1. Analyze text for PII
        analyzer_results = presidio_service.analyze_text(
            text=sanitize_request.text,
            entities=sanitize_request.presidio_config.get("entities") if sanitize_request.presidio_config else None,
        )
        logger.debug(f"Found {len(analyzer_results)} PII entities.")

        # 2. Anonymize text, get token map, and get token occurrence info
        sanitized_text, raw_token_map, tokens_info = presidio_service.anonymize_text(
            text=sanitize_request.text,
            analyzer_results=analyzer_results,
        )
        logger.debug(f"Text anonymized. Generated {len(raw_token_map)} unique tokens.")

        # 3. Store token map for later detokenization
        token_map_id = token_map_service.create_token_map(raw_token_map, sanitize_request.text, tokens_info)
        logger.info(f"Token map created with ID: {token_map_id}")

        # 4. Return the successful response
        processing_time_ms = (time.time() - start_time) * 1000
        logger.info(f"Sanitization complete in {processing_time_ms:.2f}ms for token_map_id: {token_map_id}")

        return SanitizeResponse(
            sanitized_text=sanitized_text,
            token_map_id=token_map_id,
            tokens=tokens_info,
            processing_time_ms=processing_time_ms,
        )

    except Exception as e:
        logger.exception("Sanitization failed.")
        error_response = ErrorResponse(
            code="SANITIZATION_ERROR",
            message="Failed to sanitize text.",
            details={"error": str(e)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
