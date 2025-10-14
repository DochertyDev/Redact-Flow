import logging
import time

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.models.responses import ErrorResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health", summary="Check service health and status")
async def health_check(request: Request):
    """
    Returns the current health and status of the RedactFlow backend service.
    Includes information about the Presidio analyzer and token map service.
    """
    try:
        start_time = time.time()
        presidio_service = request.app.state.presidio_service
        token_map_service = request.app.state.token_map_service

        # Basic check for Presidio service (e.g., if it's initialized)
        presidio_status = "OK" if presidio_service.analyzer else "ERROR"
        presidio_message = "Presidio Analyzer initialized." if presidio_service.analyzer else "Presidio Analyzer not initialized."

        # Basic check for TokenMap service
        token_map_status = "OK" if token_map_service else "ERROR"
        token_map_message = "TokenMapService initialized." if token_map_service else "TokenMapService not initialized."

        response_content = {
            "status": "healthy",
            "version": request.app.version,
            "uptime": f"{time.time() - request.app.state.start_time:.2f} seconds",
            "presidio_analyzer": {
                "status": presidio_status,
                "message": presidio_message,
                "supported_entities": presidio_service.supported_entities,
            },
            "token_map_service": {
                "status": token_map_status,
                "message": token_map_message,
                "active_token_maps": len(token_map_service.token_maps),
            },
            "processing_time_ms": (time.time() - start_time) * 1000,
        }
        return JSONResponse(content=response_content, status_code=status.HTTP_200_OK)

    except Exception as e:
        logger.exception("Health check failed.")
        error_response = ErrorResponse(
            code="HEALTH_CHECK_ERROR",
            message="Failed to perform health check.",
            details={"error": str(e)},
        ).model_dump()
        return JSONResponse(content=error_response, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
