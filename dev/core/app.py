"""FastAPI HTTP gateway delegating execution to registered declarative skills."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from dev.core.orchestrator import DEFAULT_FLASH_MODEL, DEFAULT_PRO_MODEL
from dev.skills.page_builder.skill import CheckinFlowService

UI_DIR = Path(__file__).resolve().parents[1] / "ui"


class CreateSessionRequest(BaseModel):
    """Request body for initializing a dynamic flow session."""

    persona_id: str = Field(default="marta_byrne")
    signal_overrides: dict[str, Any] | None = Field(default=None)


class ConfirmSeatsRequest(BaseModel):
    """Request body for confirming selected seat designators."""

    seat_designators: list[str] | None = Field(default=None)


class OfferActionRequest(BaseModel):
    """Request body for recording offer card and navigation interactions."""

    action: str = Field(
        ...,
        pattern="^(add|update_quantity|decline_page|remove_item|navigate_back|continue)$",
    )
    current_screen: str = Field(default="offer_page_1")
    product_id: str | None = Field(default=None)
    quantity: int | None = Field(default=None, ge=0)


class CheckoutRequest(BaseModel):
    """Request body for confirming one-tap checkout."""

    payment_method_token: str = Field(default="visa_4412")


class AssistQueryRequest(BaseModel):
    """Request body for Help Hub natural-language trip assistance."""

    query: str = Field(..., min_length=1, max_length=280)


def create_app(service: CheckinFlowService | None = None) -> FastAPI:
    """Create and configure the FastAPI application instance."""
    flow_service = service or CheckinFlowService()
    app = FastAPI(
        title="Dynamic Ancillary Flows API",
        version="1.0.0",
        description="Contract-first ADK & FastAPI backend for dynamic check-in flows.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/v1/health")
    def get_health() -> dict[str, Any]:
        return {
            "status": "ok",
            "schema_version": "1.0.0",
            "models": {
                "flash": DEFAULT_FLASH_MODEL,
                "pro": DEFAULT_PRO_MODEL,
            },
        }

    @app.get("/api/v1/checkin/personas")
    def list_personas() -> dict[str, Any]:
        return {
            "schema_version": "1.0.0",
            "personas": flow_service.list_personas(),
        }

    @app.post("/api/v1/checkin/sessions")
    def create_session(req: CreateSessionRequest) -> dict[str, Any]:
        return flow_service.create_session(
            persona_id=req.persona_id,
            signal_overrides=req.signal_overrides,
        )

    @app.get("/api/v1/checkin/sessions/{session_id}")
    def get_session(session_id: str) -> dict[str, Any]:
        try:
            return flow_service.get_session(session_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/api/v1/checkin/sessions/{session_id}/assist")
    def assist_session(session_id: str, req: AssistQueryRequest) -> dict[str, Any]:
        try:
            return flow_service.assist_session(session_id=session_id, query=req.query)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.get("/api/v1/checkin/sessions/{session_id}/seat-map")
    def get_seat_map(session_id: str) -> dict[str, Any]:
        try:
            return flow_service.get_seat_map(session_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/api/v1/checkin/sessions/{session_id}/seats")
    def confirm_seats(session_id: str, req: ConfirmSeatsRequest) -> dict[str, Any]:
        try:
            return flow_service.confirm_seats(
                session_id=session_id,
                seat_designators=req.seat_designators,
            )
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/v1/checkin/sessions/{session_id}/actions")
    def apply_action(session_id: str, req: OfferActionRequest) -> dict[str, Any]:
        try:
            return flow_service.apply_action(
                session_id=session_id,
                action=req.action,
                current_screen=req.current_screen,
                product_id=req.product_id,
                quantity=req.quantity,
            )
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/api/v1/checkin/sessions/{session_id}/checkout")
    def checkout(session_id: str, req: CheckoutRequest) -> dict[str, Any]:
        _ = req.payment_method_token
        try:
            return flow_service.checkout(session_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.get("/api/v1/analytics/summary")
    def get_analytics_summary() -> dict[str, Any]:
        return flow_service.get_analytics_summary()

    if UI_DIR.exists():
        app.mount("/ui", StaticFiles(directory=str(UI_DIR)), name="ui")

        @app.get("/", include_in_schema=False)
        def serve_ui_root() -> FileResponse:
            return FileResponse(UI_DIR / "index.html")

    return app


app = create_app()
