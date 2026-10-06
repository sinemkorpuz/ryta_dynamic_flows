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

## Repository Pillars

| Pillar | Path | Description |
|---|---|---|
| **1. Specify** | [`.agents/specs/`](./.agents/specs/) | Human-readable Technical Design Documents (TDDs), blueprints, and user stories. |
| **2. Contract** | [`contracts/`](./contracts/) | Frozen, machine-readable JSON Schemas (including [`telemetry.jsons`](./contracts/telemetry.jsons)) and API contracts. |
| **3. Implement** | [`dev/`](./dev/) | Runnable application code (`core/`, `tools/`, `skills/`, `ui/`, `tests/`). |
| **4. Verify** | [`results/`](./results/) | Empirical evaluation outputs, golden telemetry traces, and latency benchmarks. |
| **Continuity** | [`.agents/`](./.agents/) | Track state files (`states/`), append-only session handover logs (`sessions/`), spikes (`scratchpad/`), and local skills (`skills/`). |
