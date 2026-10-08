---
name: assistant_copy
version: "1.0.0"
description: >-
  Synthesizes first-person lavender assistant panel copy and executes interactive
  Screen E Help Hub trip queries via a two-stage Vertex AI ADK pipeline:
  Stage 1 gemini-3.5-flash-lite safety & travel-assistance guardrail forwarding to
  Stage 2 gemini-3.8-flash tool-calling agent with zero double execution.
---

# Assistant Copy & Help Hub Trip Assistant Skill

Generates and validates first-person copy rendered inside the `#F2F1FE` (`surface/ai`) assistant insight panels across Offer Page 1, Offer Page 2, Seat Map, Zero-Offer, and the Screen E Help Hub searchbar (`#help-hub-input`).

## Defense-in-Depth Safeguards

1. **Stage 1 Travel-Assistance & Safety Guardrail (`gemini-3.5-flash-lite`):** Screens `<passenger_query>` for prompt injection, cross-PNR probing, HTML/script tags, and verifies that the question relates to travel or check-in assistance for Booking `X8Y9QL` (`Flight FR1234`, `DUB → FAO`). Blocked queries short-circuit with `guardrail_status = "BLOCK"` and zero downstream model or tool invocations.
2. **Stage 2 Single-Pass ADK Agent (`gemini-3.8-flash`):** Executes once with hardened `static_instruction`, `GenerateContentConfig` (`temperature=0.1`, `SafetySettings`), and `before_tool_callback` intent gates (`has_basket_mutation_intent`, `has_simulation_intent`) plus per-turn tool deduplication.
3. **Output Validation (`validate_assistant_copy`):** Enforces length limits (`64` / `160` chars), blocks AI/bot self-references, blocks urgency/scarcity and countdown timers (`09:42`) while permitting valid 24h flight schedule times (`05:55`, `06:05`, `06:35`), and validates responses against [`contracts/assist_query.jsons`](../../../contracts/assist_query.jsons).
