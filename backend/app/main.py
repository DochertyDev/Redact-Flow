import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings, setup_logging
from app.models.responses import ErrorResponse
from app.routes import detokenize, health, sanitize, tokenmap
from app.services.presidio_service import PresidioService
from app.services.tokenmap_service import TokenMapService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context manager for managing the lifespan of the FastAPI application.
    Initializes Presidio and TokenMap services on startup, and cleans up on shutdown.
    """
    settings = get_settings()
    setup_logging()
    logger = logging.getLogger(__name__)

    logger.info("RedactFlow backend starting up...")
    app.state.start_time = time.time()

    # Initialize PresidioService
    app.state.presidio_service = PresidioService(supported_entities=settings.PRESIDIO_ENTITY_TYPES)
    logger.info("PresidioService initialized.")

    # Warm up the Presidio analyzer to load models into memory
    logger.info("Warming up NLP model...")
    app.state.presidio_service.analyze_text("Warm-up text to initialize models.")
    logger.info("NLP model warm-up complete.")

    # Initialize TokenMapService
    app.state.token_map_service = TokenMapService(ttl_seconds=settings.TOKEN_MAP_TTL_SECONDS)
    logger.info("TokenMapService initialized.")

    yield

    logger.info("RedactFlow backend shutting down.")
    # Perform cleanup here if necessary


app = FastAPI(title="RedactFlow Backend", version="0.1.0", lifespan=lifespan)

settings = get_settings()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(sanitize.router, prefix="/api", tags=["Sanitize"])
app.include_router(detokenize.router, prefix="/api", tags=["Detokenize"])
app.include_router(tokenmap.router, prefix="/api", tags=["TokenMap"])


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    Middleware to add X-Process-Time header to responses.
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch all unhandled exceptions
    and return a structured error response.
    """
    logger = logging.getLogger(__name__)
    logger.exception(f"Unhandled exception for request: {request.url}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred.",
            details={"error": str(exc)},
        ).model_dump()
    )


@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc):
    """
    Custom 404 Not Found exception handler.
    """
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ErrorResponse(
            code="NOT_FOUND",
            message="The requested resource was not found.",
            details={"path": request.url.path},
        ).model_dump()
    )
