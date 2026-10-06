# TEMPLATE

Welcome to the **TEMPLATE** project. This document defines the mission, workspace taxonomy, 4-stage assembly line lifecycle, and collaboration conventions for AI agents and human engineers working together in this repository.

---

## 1. Project Mission & Objectives

Our mission is to engineer **`<SYSTEM_NAME>`** to solve **`<PROBLEM_STATEMENT>`** for **`<TARGET_USERS>`**.

### Key Objectives

This project targets the following measurable outcomes:

* **Objective 1:** `<Define primary functional capability and target metric, e.g., p95 latency ≤ 2.0s>`
* **Objective 2:** `<Define reliability, quality, or accuracy target>`

### Non-Goals

The following items are explicitly out of scope for this repository:

* **Non-Goal 1:** `<Define excluded scope or adjacent system boundaries>`

---

## 2. Workspace Taxonomy: The 4-Pillar Architecture

To ensure speed and rigorous separation of concerns during rapid prototyping and multi-track delivery, all repository assets are organized into four dedicated pillars plus a shared agent continuity layer under `.agents/`:

```
project-root/
├── AGENTS.md                   # Collaboration protocol and operating rules (this document)
├── README.md                   # Human onboarding, environment setup, and quickstart
│
├── .agents/                    # AGENT WORKSPACE, SPECIFICATIONS & CONTINUITY LAYER
│   ├── README.md               # Overview and fast-boot routing instructions
│   ├── specs/                  # PILLAR 1 (Specify): Human-readable TDDs, blueprints, user stories
│   ├── states/                 # Active working context & track roadmaps (shared.md, <track>.md)
│   ├── sessions/               # Append-only chronological session handover logs (<track>/)
│   ├── scratchpad/             # Unstructured ideation, brainstorming, and early spikes (<track>/)
│   └── skills/                 # Project-scoped declarative agent skills (SKILL.md packages)
│
├── contracts/                  # PILLAR 2 (Contract): Strict, machine-readable schemas
│   ├── telemetry.jsons         # JSON Schema for execution logs and OpenTelemetry traces
│   └── ...                     # Domain schemas (skill_schema.jsons, tool_schema.jsons, etc.)
│
├── dev/                        # PILLAR 3 (Implement): Runnable implementation code
│   ├── core/                   # Runtime engine, orchestrator, runner, and telemetry hooks
│   ├── tools/                  # Standardized, reusable tool integrations
│   ├── skills/                 # Declarative domain skill implementations
│   ├── ui/                     # Frontend application and dynamic UI components
│   └── tests/                  # Automated unit and integration test suites
│
└── results/                    # PILLAR 4 (Verify): Empirical proofs, benchmarks, and traces
```

### Pillar Definitions & Roles

| Pillar | Directory | Purpose | Mutability & Lifecycle |
|---|---|---|---|
| **Specify** | `.agents/specs/` | Technical Design Documents (TDDs), architectural blueprints, requirements analysis, and user stories. | Living markdown and YAML documents during design and specification phases. |
| **Contract** | `contracts/` | Strict machine-readable contracts (JSON Schemas, Pydantic specs, API interfaces). Single source of truth. | Version-controlled, frozen contracts that code and external systems depend upon. |
| **Implement** | `dev/` | Production and prototype code: runtime engine, modular tools, declarative skills, UI components, and tests. | Continuously developed against contracts in `contracts/`. |
| **Verify** | `results/` | Empirical outcomes: telemetry traces, evaluation metrics, latency benchmarks, and demonstration payloads. | Output artifacts generated from test runs and evaluations. |

---

## 3. The 4-Stage Prototyping Assembly Line

Every capability, tool, skill, or integration follows a formal 4-stage lifecycle gate:

```mermaid
flowchart LR
    subgraph S1["1. SPECIFY (.agents/specs/)"]
        direction TB
        A1["Problem & Scope"] --> A2["Architectural Trade-offs"] --> A3["TDD & User Stories"]
    end

    subgraph S2["2. CONTRACT (contracts/)"]
        direction TB
        B1["JSON Schemas"] --> B2["Pydantic / Type Models"] --> B3["Interface Invariants"]
    end

    subgraph S3["3. IMPLEMENT (dev/)"]
        direction TB
        C1["Core Runtime"] --> C2["Modular Tools & Skills"] --> C3["UI & Unit Tests"]
    end

    subgraph S4["4. VERIFY (results/)"]
        direction TB
        D1["Telemetry Audit"] --> D2["Integration Benchmarks"] --> D3["Golden Traces"]
    end

    S1 -->|"Gate 1: Specification Approved"| S2
    S2 -->|"Gate 2: Contract Frozen"| S3
    S3 -->|"Gate 3: Code Built & Tested"| S4
```

### Stage-Gate Exit Criteria

1. **Gate 1 (Specify → Contract):**
   - The specification document in `.agents/specs/` states the problem definition, non-goals, and component boundaries.
   - Lead Engineer approves the architectural direction.
2. **Gate 2 (Contract → Implement):**
   - Machine-readable contracts in `contracts/` are formalized and syntactically valid.
   - Cross-track interfaces and telemetry schemas are aligned in [.agents/states/shared.md](./.agents/states/shared.md).
3. **Gate 3 (Implement → Verify):**
   - Code in `dev/` passes linting, formatting, and automated unit tests.
   - Runtime execution wraps I/O with telemetry emission conforming to [contracts/telemetry.jsons](./contracts/telemetry.jsons).
4. **Gate 4 (Verify → Deliver):**
   - End-to-end execution generates valid trace logs and benchmark artifacts in `results/` meeting target thresholds.

---

## 4. Human-Agent Pairing Model

We operate as a high-velocity pair programming team:

* **Lead Engineer (Human / Principal Architect):**
  - Defines project goals, priorities, and domain nuances.
  - Reviews and signs off on architectural gates.
  - Aligns with domain stakeholders and partner engineering teams.

* **Agentic Co-Engineer (Jetski / Staff AI Partner):**
  - Synthesizes existing codebase patterns and requirements into structured proposals.
  - Drafts TDDs in `.agents/specs/` and formal contracts in `contracts/`.
  - Implements clean, decoupled modules and automated tests in `dev/`.
  - Validates all executions against telemetry and evaluation contracts.

---

## 5. Agent Operating Rules

1. **Contract-First Development:** Never implement code in `dev/` without an agreed specification in `.agents/specs/` and formal schemas in `contracts/`.
2. **Observability Compliance:** Every agent execution, tool call, and state transition must emit logs conforming to [contracts/telemetry.jsons](./contracts/telemetry.jsons).
3. **Decoupled Architecture:** No hardcoded business logic or domain-specific rules inside `dev/core/`. Domain logic belongs strictly in declarative packages inside `dev/skills/`.
4. **Hyperlink Files & PII Prevention:**
   - **In Committed Repository Files (`.md`):** Always use workspace-relative markdown links (e.g., `[telemetry.jsons](./contracts/telemetry.jsons)`). **Never** write `file:///...` URLs into committed files, as absolute paths break across developer machines and leak local usernames/LDAPs.
   - **In Chat Responses:** Always use clickable `file:///...` markdown links (with line ranges where applicable) when referencing files, code symbols, or documentation in chat for fast IDE navigation.
5. **Continuous Roadmap Alignment:** Keep track roadmaps in [.agents/states/COMPONENT.md](./.agents/states/COMPONENT.md) and backlogs in [.agents/specs/COMPONENT-user_stories.yaml](./.agents/specs/COMPONENT-user_stories.yaml) synchronized as milestones and gates are achieved.
6. **Neutral Naming:** Never name customers, competitor products, brands, or individual people/LDAPs in repository content. Use role-based wording (e.g., `"the client"`, `"the domain team"`, `"customer-specific"`, `"frontend track"` / `"adk track"`), `example.com` for sample emails, and `example-*` for sample project IDs. Configure `.blocked_terms` locally to enforce automated pre-commit checks.
7. **Session Continuity & Shared Memory:** At session boot, agents MUST read the relevant track state in [.agents/states/COMPONENT.md](./.agents/states/COMPONENT.md) and cross-track integration state in [.agents/states/shared.md](./.agents/states/shared.md).
   At the close of a session or completion of a significant task, append a date-stamped session handover note under `.agents/sessions/<track>/YYYY-MM-DD_<topic>.md` and update the corresponding state file in `.agents/states/` when milestone or gate status changes. Raw brainstorms and spike notes belong in `.agents/scratchpad/`.
8. **Human Consent for Specifications & Operating Rules:** Any additions, modifications, or deletions to documents in `.agents/specs/` or to [AGENTS.md](./AGENTS.md) itself require explicit human consent from the Lead Engineer. Agents may propose changes (via chat diffs, interactive questions, or drafts in `.agents/scratchpad/`), but must never directly write to or edit these files without prior approval.
9. **Catalog Skills for Reviews & Quality Control:** For non-trivial specification changes, architecture designs, and code reviews, agents MUST discover and activate specialized review skills from the Google internal catalog (via `skill_search` and reading their `SKILL.md` instructions):
   - **Specification Reviews:** Use `design-doc-reviewer` (structured probe and gap analysis), `design-doc-readability` (6-phase engineering rigor: scoping, viewtypes, trade-offs, contract design, failure modeling), and `technical-writing` (clarity, conciseness, terminology precision).
   - **Code & Security Reviews:** Use `code-taste` (abstraction depth, structural elegance, edge-case elimination, cognitive simplicity), `review-loop` / `review` (multi-expert code review and ranked findings `P0`–`P3`), and `securitysupercharge` / `pii-review` (vulnerability scanning and data privacy audits).

---

## 6. Multi-User & Multi-Agent Concurrency Protocol

When multiple engineers and AI agents work concurrently across tracks (e.g., `frontend` and `adk`), follow these boundaries to prevent merge conflicts and broken integrations:

1. **Contract Handshake (`contracts/`):** The `contracts/` directory is the sole integration boundary between tracks. No track may alter shared payload structures without updating the schema in `contracts/` and recording the version update in [.agents/states/shared.md](./.agents/states/shared.md).
2. **Conflict-Free Session Logging:** Feature branches must write session handover notes as new, date-stamped files in `.agents/sessions/<track>/YYYY-MM-DD_<topic>.md` rather than appending to shared files. Keep `.agents/states/<track>.md` concise and tabular to minimize merge contention.
3. **Subagent Worktree Isolation:** When spawning parallel subagents for implementation tasks, isolate each subagent in a branched or shared worktree (`Workspace: "branch"` or `"share"`) and restrict its file writes to its assigned track and module directory.
