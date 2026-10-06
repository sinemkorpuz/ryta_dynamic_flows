"""Domain-agnostic contract loader, schema validator, and execution context models."""

from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
from typing import Any
import uuid

import jsonschema
from pydantic import BaseModel, Field

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTRACTS_DIR = REPO_ROOT / "contracts"
RESULTS_DIR = REPO_ROOT / "results"


class ExecutionContext(BaseModel):
    """Multi-tenant and session routing context required by contracts/telemetry.jsons."""

    tenant_id: str = Field(default="ryanair-checkin", min_length=1)
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(default="pax-marta-byrne")
    project_id: str = Field(default="example-project-id")
    trace_hex: str = Field(default_factory=lambda: uuid.uuid4().hex)

    @property
    def gcp_trace_path(self) -> str:
        """Return GCP trace correlation string matching ^projects/[^/]+/traces/[a-f0-9]{32}$."""
        return f"projects/{self.project_id}/traces/{self.trace_hex}"


@lru_cache(maxsize=16)
def load_contract_schema(schema_filename: str) -> dict[str, Any]:
    """Load and cache a JSON Schema file from contracts/."""
    schema_path = CONTRACTS_DIR / schema_filename
    if not schema_path.exists():
        raise FileNotFoundError(f"Contract schema not found: {schema_path}")
    return json.loads(schema_path.read_text(encoding="utf-8"))


def validate_against_contract(payload: dict[str, Any], schema_filename: str) -> None:
    """Validate a dictionary payload against a frozen JSON Schema in contracts/."""
    schema = load_contract_schema(schema_filename)
    jsonschema.validate(instance=payload, schema=schema)
