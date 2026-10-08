# Session Handover: Screen E Help Hub 2-Stage Vertex AI LLM Safeguards (`2026-10-08`)

**Author:** Agentic Co-Engineer  
**Tracks:** `adk`, `frontend`  
**Status:** Gate 4 Verified

---

## 1. Summary of Changes

1. **Vertex AI & Environment Configuration ([`.env.example`](../../../.env.example)):**
   - Enabled Vertex AI mode (`GOOGLE_GENAI_USE_VERTEXAI="TRUE"`, `GOOGLE_CLOUD_LOCATION="global"`) with automatic ADC project resolution via `google.auth.default()`.
   - Configured the 2-stage model pair: `GEMINI_FLASH_LITE_MODEL="gemini-3.5-flash-lite"` (Stage 1 travel-assistance & safety classifier) and `GEMINI_FLASH_MODEL="gemini-3.8-flash"` (Stage 2 ADK tool-calling agent). Removed all fallback references to deprecated `gemini-2.5-flash`.

2. **Orchestrator-First Routing & 2-Stage Guardrail ([`dev/core/orchestrator.py`](../../../dev/core/orchestrator.py), [`dev/skills/assistant_copy/skill.py`](../../../dev/skills/assistant_copy/skill.py)):**
   - **Searchbar vs. Quick-Ask Chips (`entry_point: "searchbar" | "quick_chip"`):**
     - Curated questions clicked below the searchbar (`entry_point="quick_chip"`) pass `require_guardrail_check=False` in `ADKOrchestrator.run_with_fallback()`, bypassing Stage 1 security guardrail vetting (`guardrail_model="bypassed_quick_chip"`, `0` calls to `gemini-3.5-flash-lite`) and routing directly to `gemini-3.8-flash` + ADK tools.
     - Free-text questions entered in the searchbar (`entry_point="searchbar"`) pass `require_guardrail_check=True`, where `ADKOrchestrator` first calls `gemini-3.5-flash-lite` (`screen_user_query` + `classify_with_flash_lite`) before routing to `gemini-3.8-flash` or rejecting.
   - **Rejection Feedback (`guardrail_status="BLOCK"`, `rejection_reason`):** When a searchbar question is rejected (off-topic, prompt injection, or cross-PNR probe), the orchestrator does not route to `gemini-3.8-flash` (`0` Stage 2 calls, `0` tool calls) and returns explicit user-facing rejection feedback (`"Not routed · ..."` + `rejection_reason`).
   - **Stage 2 (`gemini-3.8-flash`):** Added `static_instruction`, `<passenger_query>` XML sandboxing, `GenerateContentConfig` with `SafetySettings`, `before_tool_callback` (blocking unsolicited `modify_basket_item` or `update_simulation_signals` tool calls on informational queries), and single-pass execution with zero double execution.
   - **Refined Countdown Regex:** Scoped `forbidden_countdown_timer` to urgency/hold contexts (`held|hold|expires?|remaining|left|timer|countdown` + `MM:SS` or `09:42`) so valid 24h flight schedule times (`05:55`, `06:05`, `06:35`) pass validation.

3. **Full Roundtrip Visualization & Actionable Mobile Response Cards ([`dev/ui/app.js`](../../../dev/ui/app.js), [`results/mocks/frontend/Screen-E.html`](../../../results/mocks/frontend/Screen-E.html), [`dev/slides/components/HelpHubSimulator.vue`](../../../dev/slides/components/HelpHubSimulator.vue)):**
   - Preserved the exact Screen E searchbar DOM path (`/html/body/div[2]/div/div[2]/div[2]/div/div[1]/div[2]/div[1]/div/input` → `#help-hub-input`) and isolated `state.searchBarQuery` so clicking a quick-ask chip below the searchbar never overwrites the searchbar input.
   - Added `escapeHtml()`, `maxlength="280"`, disabled states during in-flight requests, and `if (state.helpHubLoading) return;` in `submitHelpHubQuery()` to prevent duplicate submissions.
   - Added `_build_suggested_actions()` in [`dev/skills/assistant_copy/skill.py`](../../../dev/skills/assistant_copy/skill.py) and `suggested_actions` in [`contracts/assist_query.jsons`](../../../contracts/assist_query.jsons) so every `/assist` response includes grounded mobile deep-links (`navigate_screen`, `add_basket_item`, `confirm_seats`, `ask_query`).
   - Upgraded `renderScreenE()` and `bindScreenE()` in [`dev/ui/app.js`](../../../dev/ui/app.js) with:
     - `#help-hub-shimmer-card`: 2-stage loading shimmer (`Stage 1: gemini-3.5-flash-lite Guardrail` → `Stage 2: gemini-3.8-flash ADK Agent`).
     - `#help-hub-response-card`: `surface/ai` (`#F2F1FE`) response card on `PASS` and amber shield card (`bg-pill-review-bg/95`) on `BLOCK` with recovery query chips.
     - `#help-hub-basket-pill`: Live basket summary strip with `Review & Pay →` jump button when the basket has items.
     - `.assist-action-chip`: Interactive deep-link CTA chips wired to navigate screens, mutate the basket (`POST /actions`), confirm Row 12 seats (`POST /seats`), or fire follow-up queries (`POST /assist`).
     - Simulation indicator badge (`⚡ Sim: 0 Children · 1n`) on the Screen E Passenger Roster header when `children_count === 0`.

4. **Contract & Verification ([`contracts/assist_query.jsons`](../../../contracts/assist_query.jsons), [`dev/tests/test_api_e2e.py`](../../../dev/tests/test_api_e2e.py), [`dev/tests/test_contracts.py`](../../../dev/tests/test_contracts.py)):**
   - Formalized [`contracts/assist_query.jsons`](../../../contracts/assist_query.jsons) and registered it in [`../../states/shared.md`](../../states/shared.md).
   - Ensured `_mutate_signals` in [`dev/skills/page_builder/skill.py`](../../../dev/skills/page_builder/skill.py) passes `use_orchestrator=False` so live simulation queries inside `/assist` execute strictly 1 Stage 1 call and 1 Stage 2 call.
   - Re-exported [`contracts/openapi.json`](../../../contracts/openapi.json) and verified all 13 pytest suites and all 3 maintenance audits pass.

