"""Standardized telemetry emitter validating every record against contracts/telemetry.jsons."""

from __future__ import annotations

import json
from pathlib import Path
import tempfile
from typing import Any
import uuid

from dev.core.models import RESULTS_DIR, ExecutionContext, validate_against_contract

DEFAULT_TRACE_LOG_PATH = RESULTS_DIR / "telemetry_traces.jsonl"
FALLBACK_TRACE_LOG_PATH = Path(tempfile.gettempdir()) / "ryta_telemetry_traces.jsonl"


class TelemetryEmitter:
    """Emits schema-validated execution logs conforming to contracts/telemetry.jsons."""

    def __init__(self, log_path: Path | None = None) -> None:
        target = log_path or DEFAULT_TRACE_LOG_PATH
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open("a", encoding="utf-8"):
                pass
            self.log_path = target
        except OSError:
            FALLBACK_TRACE_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
            self.log_path = FALLBACK_TRACE_LOG_PATH

    def emit(
        self,
        *,
        context: ExecutionContext,
        operation_name: str,
        message: str,
        severity: str = "INFO",
        status: str = "SUCCESS",
        skill_id: str | None = None,
        skill_version: str = "1.0.0",
        tool_id: str | None = None,
        tool_version: str = "1.0.0",
        model_name: str | None = None,
        agent_id: str | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        guardrail_status: str = "PASS",
        security_events: list[str] | None = None,
        inputs: dict[str, Any] | None = None,
        outputs: dict[str, Any] | None = None,
        error_details: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Construct, validate against contracts/telemetry.jsons, and persist a telemetry event."""
        span_id = uuid.uuid4().hex[:16]
        record: dict[str, Any] = {
            "schema_version": "1.0.0",
            "severity": severity,
            "message": message,
            "logging.googleapis.com/trace": context.gcp_trace_path,
            "logging.googleapis.com/spanId": span_id,
            "context": {
                "tenant_id": context.tenant_id,
                "session_id": context.session_id,
                "user_id": context.user_id,
            },
            "gen_ai.system": "google_adk",
            "gen_ai.operation.name": operation_name,
            "security": {
                "guardrail_status": guardrail_status,
                "events": security_events or [],
            },
            "payload": {
                "status": status,
                "inputs": inputs or {},
                "outputs": outputs or {},
            },
        }
        if error_details is not None:
            record["payload"]["error_details"] = error_details
        if skill_id is not None:
            record["skill"] = {"id": skill_id, "version": skill_version}
        if tool_id is not None:
            record["tool"] = {"id": tool_id, "version": tool_version}
        if model_name is not None:
            record["gen_ai.request.model"] = model_name
        if agent_id is not None:
            record["gen_ai.agent.id"] = agent_id
        if input_tokens is not None:
            record["gen_ai.usage.input_tokens"] = input_tokens
        if output_tokens is not None:
            record["gen_ai.usage.output_tokens"] = output_tokens

        validate_against_contract(record, "telemetry.jsons")
        line = json.dumps(record, ensure_ascii=True) + "\n"
        try:
            with self.log_path.open("a", encoding="utf-8") as handle:
                handle.write(line)
        except OSError:
            self.log_path = FALLBACK_TRACE_LOG_PATH
            with self.log_path.open("a", encoding="utf-8") as handle:
                handle.write(line)
        return record


default_telemetry = TelemetryEmitter()
