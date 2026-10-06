# Shared Agent Memory, Specifications & Continuity Layer

This directory serves as the **persisted, shared working memory** and specification hub for engineers and AI agents collaborating across the repository. It enables context preservation, zero-loss session handovers, and conflict-free multi-engineer/multi-agent concurrency.

---

## 1. Directory Structure

```
.agents/
├── README.md                 # This routing guide
│
├── specs/                    # PILLAR 1: Technical Design Documents (TDDs) & user stories
│   └── COMPONENT-user_stories.yaml
│
├── states/                   # ACTIVE WORKING CONTEXT (Fast Boot)
│   ├── COMPONENT.md          # Generic component state template
│   ├── frontend.md           # Frontend Track: Active milestone, in-flight work, blockers
│   ├── adk.md                # ADK Track: Active milestone, agent orchestration, blockers
│   └── shared.md             # Shared Integration: Frozen contracts, cross-track deps
│
├── sessions/                 # SESSION HANDOVER LOGS (Append-only, conflict-free)
│   ├── frontend/             # Frontend track session logs (YYYY-MM-DD_<topic>.md)
│   └── adk/                  # ADK track session logs (YYYY-MM-DD_<topic>.md)
│
├── scratchpad/               # EARLY IDEATION & SPIKES (Unapproved drafts)
│   ├── frontend/             # Frontend UI/UX spikes and drafts
│   └── adk/                  # ADK prompt iterations and architecture spikes
│
└── skills/                   # PROJECT-SCOPED AGENT SKILLS
```

---

## 2. Fast-Boot Routing Protocol for Agents

When an AI agent or engineer starts or concludes a task, follow these steps:

1. **Identify the Track (Session Boot):**
   * **Frontend Track** (Stitch → Vite TypeScript, UI components, client state) → Read [`./states/frontend.md`](./states/frontend.md) and [`./states/shared.md`](./states/shared.md).
   * **ADK Track** (Agent Development Kit runtime, tools, skills, FastAPI endpoints) → Read [`./states/adk.md`](./states/adk.md) and [`./states/shared.md`](./states/shared.md).
   * **New Component Track** → Copy [`./states/COMPONENT.md`](./states/COMPONENT.md) to `./states/<track>.md` and register shared interfaces in [`./states/shared.md`](./states/shared.md).

2. **Session Concluding / Handover Protocol:**
   * Append a date-stamped handover log in [`./sessions/frontend/`](./sessions/frontend/) or [`./sessions/adk/`](./sessions/adk/) named `YYYY-MM-DD_<topic>.md`.
   * Update the corresponding state file in [`./states/`](./states/) when milestone or gate status changes.
   * If any shared contracts, dependencies, or interfaces changed, update [`./states/shared.md`](./states/shared.md).
