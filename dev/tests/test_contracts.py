"""Contract validation tests for all JSON Schemas in contracts/."""

from __future__ import annotations

import jsonschema

from dev.core.models import CONTRACTS_DIR, load_contract_schema

EXPECTED_CONTRACTS = (
    "telemetry.jsons",
    "checkin_flow.jsons",
    "seat_map.jsons",
    "basket_checkout.jsons",
    "analytics_summary.jsons",
)


def test_all_contracts_exist_and_are_valid_draft202012() -> None:
    """Verify every contract schema exists and conforms to JSON Schema Draft 2020-12."""
    for filename in EXPECTED_CONTRACTS:
        path = CONTRACTS_DIR / filename
        assert path.exists(), f"Missing contract file: {filename}"
        schema = load_contract_schema(filename)
        jsonschema.Draft202012Validator.check_schema(schema)
        assert schema.get("$schema") == "https://json-schema.org/draft/2020-12/schema"
