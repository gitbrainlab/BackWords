from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .data_loader import DataLoader
from .mock_engine import MockEngine
from .models import (
    ExplainSourceRequest,
    ExplainSourceResponse,
    HealthResponse,
    InterpretationRequest,
    InterpretationResult,
)
from .settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application state
# ---------------------------------------------------------------------------

_loader: DataLoader | None = None
_engine: MockEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    global _loader, _engine
    logger.info("Startup: loading seed data from %s", settings.DATA_DIR)
    _loader = DataLoader(settings.DATA_DIR)
    _engine = MockEngine(_loader, model_version=settings.MODEL_VERSION)
    logger.info("Startup complete: %d seeds loaded", _loader.seed_count)
    yield
    logger.info("Shutdown: cleaning up")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="BackWords Proxy",
    description="Mock proxy server for the BackWords word-history app. Serves seeded JSON interpretations.",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow all origins for local development.
# TODO: restrict to app bundle ID / known origins before production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, summary="Health check")
async def health() -> HealthResponse:
    """Returns server status and the number of loaded seed entries."""
    seed_count = _loader.seed_count if _loader else 0
    return HealthResponse(
        status="ok",
        version=settings.MODEL_VERSION,
        seedCount=seed_count,
    )


@app.post(
    "/interpret",
    response_model=InterpretationResult,
    summary="Interpret a word, phrase, or passage",
)
async def interpret(request: InterpretationRequest) -> InterpretationResult:
    """
    Returns a full InterpretationResult for the given query.

    - **query**: word, phrase, or passage text
    - **mode**: word | phrase | paragraph
    - **selectedDate**: optional ISO8601 date to anchor the response to a historical period

    TODO: real provider — the MockEngine can be swapped for a LiveEngine that
    calls an LLM API and returns the same InterpretationResult structure.
    """
    if _engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialised")
    try:
        return _engine.interpret(request)
    except Exception as exc:
        logger.exception("Error interpreting '%s'", request.query)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post(
    "/explain-source",
    response_model=ExplainSourceResponse,
    summary="Explain why a source supports an interpretation",
)
async def explain_source(request: ExplainSourceRequest) -> ExplainSourceResponse:
    """
    Returns a prose explanation of why a specific source supports a specific snapshot interpretation.

    TODO: real provider — replace MockEngine.explain_source with an LLM call
    that receives the source excerpt + snapshot definition and generates an explanation.
    """
    if _engine is None:
        raise HTTPException(status_code=503, detail="Engine not initialised")
    try:
        return _engine.explain_source(request)
    except Exception as exc:
        logger.exception("Error explaining source '%s'", request.sourceId)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
