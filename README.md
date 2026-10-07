# Multi-User Agentic Development Template

A contract-first repository template for multi-engineer, multi-agent software development using the **4-Pillar Architecture** (`Specify` → `Contract` → `Implement` → `Verify`) and a conflict-free shared agent continuity layer (`.agents/`).

See [`AGENTS.md`](./AGENTS.md) for the complete collaboration protocol, stage-gate exit criteria, and agent operating rules, and [`.agents/README.md`](./.agents/README.md) for the fast-boot session routing guide.

---

## Quickstart

1. **Configure Local Environment & Neutral Naming Guardrails:**

   ```bash
   cp .env.example .env
   cp .blocked_terms.example .blocked_terms
   ```

   Add your local LDAP, customer names, or private project IDs to `.blocked_terms` (git-ignored) so pre-commit hooks block accidental commits of sensitive terms.

2. **Install Python Dependencies (`uv`):**

   ```bash
   uv sync --all-extras
   ```

3. **Enable Pre-Commit Hooks:**

   ```bash
   uv run pre-commit install
   ```

---

## Developer Guide & Key Commands

### 1. Start the ADK Backend & Help Hub Frontend (`:8000`)

The FastAPI gateway ([`dev/core/app.py`](./dev/core/app.py)) orchestrates the Google ADK runtime ([`dev/core/orchestrator.py`](./dev/core/orchestrator.py)), deterministic domain tools ([`dev/tools/`](./dev/tools/)), and declarative skills ([`dev/skills/`](./dev/skills/)), and directly serves the mobile Single-Page Application ([`dev/ui/`](./dev/ui/)).

```bash
uv run uvicorn dev.core.app:app --host 0.0.0.0 --port 8000 --reload
```

Once running, the following endpoints are available:
* **Frontend SPA (App 2026 Help Hub & Screen 10 Analytics Studio):** `http://localhost:8000/` (static assets mounted at `/ui`)
* **ADK & Check-in REST API:** `http://localhost:8000/api/v1/*` (health check at `http://localhost:8000/api/v1/health`)
* **Interactive OpenAPI / Swagger UI:** `http://localhost:8000/docs`

> **Live ADK vs. Deterministic Fallback:** If `GOOGLE_API_KEY` (or `GOOGLE_GENAI_USE_VERTEXAI=true`) is configured in `.env`, [`ADKOrchestrator`](./dev/core/orchestrator.py) executes live Gemini copy synthesis and Help Hub Q&A with a 220ms circuit-breaker timeout; otherwise, it automatically uses deterministic fallback templates.

### 2. Start the Slidev Presentation Service (`:3030`)

The interactive customer demo deck in [`dev/slides/`](./dev/slides/) is built with Slidev (Vite + Vue 3). Its embedded components connect live to the FastAPI + ADK backend on `:8000` when running, and automatically fall back to local deterministic scoring and golden telemetry traces ([`results/telemetry_traces.jsonl`](./results/telemetry_traces.jsonl)) when offline.

```bash
# Install presentation dependencies (first-time setup)
npm --prefix dev/slides install

# Start the interactive Slidev dev server at http://localhost:3030
npm --prefix dev/slides run dev

# Build static SPA bundle or export slides
npm --prefix dev/slides run build
npm --prefix dev/slides run export
```

### 3. Testing, Verification & Governance Audits

```bash
# Run the full automated test suite (contracts, scoring, seat map, E2E API, Slidev deck)
uv run pytest

# Run repository maintenance & governance audits (PII scan, spec coherence, contract/code drift)
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --all --skip-llm

# Re-export canonical OpenAPI contract (contracts/openapi.json) after modifying FastAPI routes
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --export-openapi
```

### Quick Reference Summary

| Service / Task | Command | Local URL / Output |
|---|---|---|
| **ADK Backend + Frontend SPA** | `uv run uvicorn dev.core.app:app --host 0.0.0.0 --port 8000 --reload` | `http://localhost:8000/` & `/docs` |
| **Slidev Demo Presentation** | `npm --prefix dev/slides run dev` | `http://localhost:3030/` |
| **Unit, Contract & E2E Tests** | `uv run pytest` | Validates [`dev/tests/`](./dev/tests/) & [`results/`](./results/) |
| **Governance & Drift Audit** | `uv run python .agents/skills/maintenance/scripts/run_maintenance.py --all --skip-llm` | Audits PII, links, & [`contracts/`](./contracts/) |

---

## Repository Pillars

| Pillar | Path | Description |
|---|---|---|
| **1. Specify** | [`.agents/specs/`](./.agents/specs/) | Human-readable Technical Design Documents (TDDs), blueprints, and user stories. |
| **2. Contract** | [`contracts/`](./contracts/) | Frozen, machine-readable JSON Schemas (including [`telemetry.jsons`](./contracts/telemetry.jsons)) and API contracts. |
| **3. Implement** | [`dev/`](./dev/) | Runnable application code (`core/`, `tools/`, `skills/`, `ui/`, `tests/`). |
| **4. Verify** | [`results/`](./results/) | Empirical evaluation outputs, golden telemetry traces, and latency benchmarks. |
| **Continuity** | [`.agents/`](./.agents/) | Track state files (`states/`), append-only session handover logs (`sessions/`), spikes (`scratchpad/`), and local skills (`skills/`). |
