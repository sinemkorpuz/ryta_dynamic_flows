---
name: maintenance
description: >-
  Executes repository governance, security, and quality maintenance audits:
  (1) PII & privacy reviews (scans for Googler LDAPs, personal home paths, forbidden file:/// markdown links, and ensures sensitive configs are .gitignored with .example templates);
  (2) Specs coherence and truthfulness checks (validates JSON schemas in contracts/, markdown cross-references in .agents/, and semantic truthfulness to the codebase);
  (3) Specs / implementation drift detection (verifies that dev/ code adheres strictly to .agents/specs/, contracts/, and AGENTS.md domain-isolation rules).
---

# Repository Maintenance & Governance Skill

This skill provides automated checks and standard procedures to maintain repository hygiene, security, privacy, and architectural consistency across the **`adk`** and **`frontend`** tracks defined in [`AGENTS.md`](../../../AGENTS.md).

---

## 1. The Three Maintenance Tasks

### Task 1: PII & Privacy Review
Audits code, configs, and documentation for Personally Identifiable Information (PII), employee LDAPs, and developer-specific environment paths:
* **No Hardcoded Developer LDAPs or Personal IDs:** Repository files must use role-based descriptions ("Lead Architect", "ADK Track Engineer", "Frontend Track Engineer") or generic placeholders (`example.com`, `example-project-id`).
* **No Absolute Home Directory Paths or `file:///` Markdown Links:** Avoid embedding developer home directory paths or `[label](file:///...)` links in committed markdown files or code; use repository-relative paths (`./...`, `../...`).
* **Strict `.gitignore` Policy:** Sensitive environment files (`.env`, `*.tfvars`, `*.tfstate`, `*.local`, `.blocked_terms`, `backend.tf`) must be listed in `.gitignore`.
* **Sanitized `.example` Templates:** Any configuration requiring user-specific or sensitive inputs must provide a sanitized `.example` file (e.g. `.blocked_terms.example`, `.env.example`, `terraform.tfvars.example`) completely free of personal data.

### Task 2: Specs Coherence & Truthfulness
Audits specifications in [`../../specs/`](../../specs/), state files in [`../../states/`](../../states/), session handovers in [`../../sessions/`](../../sessions/), and schemas in [`../../../contracts/`](../../../contracts/) across two tiers:
* **Tier 1 (Static Coherence):** Validates that all JSON schemas in `contracts/` parse cleanly with `$schema` / `openapi`, and asserts that 100% of Markdown cross-references in `.agents/specs/`, `.agents/states/`, `.agents/sessions/`, `.agents/skills/`, and `AGENTS.md` resolve to real files on disk.
* **Tier 2 (Semantic Truthfulness & Grounding — Default):** Invokes Gemini (`gemini-3.8-flash` via `google.genai`) as an LLM judge to compare specifications (`system-architecture.md`, `adk-architecture.md`, `frontend-architecture.md`) against actual implementation code (`dev/core/`, `dev/skills/`, `dev/tools/`, `dev/ui/`). Flags direct contradictions, fabricated capabilities, and unimplemented claims. To run only static checks (e.g. for offline CI), pass `--skip-llm`.

### Task 3: Specs / Implementation Drift Detection
Verifies that code in [`../../../dev/`](../../../dev/) has not drifted from designs in [`.agents/specs/`](../../specs/) or schemas in [`../../../contracts/`](../../../contracts/):
* **API Route Conformance:** Endpoints declared for the Dynamic Check-in Flows gateway (`/api/v1/health`, `/api/v1/checkin/personas`, `/api/v1/checkin/sessions`, `/api/v1/checkin/sessions/{session_id}`, `/api/v1/checkin/sessions/{session_id}/seat-map`, `/api/v1/checkin/sessions/{session_id}/seats`, `/api/v1/checkin/sessions/{session_id}/actions`, `/api/v1/checkin/sessions/{session_id}/checkout`, `/api/v1/analytics/summary`) must be registered in [`dev/core/app.py`](../../../dev/core/app.py).
* **Canonical OpenAPI Contract Drift:** Verifies that [`contracts/openapi.json`](../../../contracts/openapi.json) matches runtime `app.openapi()`. Re-export with `--export-openapi` when modifying routes.
* **Domain-Agnostic `dev/core/` Guardrail (`AGENTS.md` Rule 3):** Verifies that `dev/core/*.py` remains strictly domain-agnostic (no imports from `dev.tools.*` and no hardcoded persona fixtures).
* **Backlog Conformance:** Stories in [`.agents/specs/*-user_stories.yaml`](../../specs/adk-user_stories.yaml) must include valid `track`, `stories`, `gate`, `status`, and resolvable `spec_ref` and `contract_ref` paths.

---

## 2. Automated Maintenance CLI

A helper script is provided in [`scripts/run_maintenance.py`](scripts/run_maintenance.py) to automate all three tasks. The script does not contain any hardcoded PII; blocked terms (such as specific LDAPs or developer names) are loaded dynamically via CLI, environment variable, or the git-ignored local `.blocked_terms` file:

```bash
# Run all maintenance audits (includes Tier 2 LLM truthfulness by default)
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --all --blocked-terms <ldap1> <name2>

# Run offline without invoking LLM service
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --all --skip-llm

# Export/freeze the OpenAPI 3.1 contract after modifying FastAPI routes
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --export-openapi

# Or set blocked terms via environment variable:
export MAINTENANCE_BLOCKED_TERMS="ldap1,name2"
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --all

# Or use the git-ignored local .blocked_terms file:
cp .blocked_terms.example .blocked_terms
# edit .blocked_terms with sensitive terms to audit

# Run specific checks
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --check pii
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --check coherence --skip-llm
uv run python .agents/skills/maintenance/scripts/run_maintenance.py --check drift
```

---

## 3. Remediation Runbook

* **When PII / LDAP is detected in a config or source file:**
  1. Replace personal identifiers with generic placeholders (`example-project-id`) or role titles.
  2. Add sensitive local file patterns to `.gitignore` and provide a `<file>.example` template.
  3. Untrack any sensitive file from git if previously added: `git rm --cached <file>`.
* **When broken links are detected in specs or state logs:**
  1. Update the link to point to the correct workspace-relative path.
  2. Ensure all file paths use forward slashes and never use `file:///` URIs in committed `.md` files.
* **When implementation drift is detected:**
  1. Determine whether the contract (`contracts/*.jsons` / `contracts/openapi.json`) or the code (`dev/`) needs updating.
  2. If the contract needs updating, obtain bilateral `adk` / `frontend` alignment before altering `contracts/` and update `.agents/states/shared.md`.
