---
name: page_builder
version: "1.0.0"
description: >-
  Assembles 0 to 2 dynamic offer pages from ranked and filtered ancillaries,
  enforcing the Step-Numbering Invariant, Zero-Preselection Rule,Drawer Demotion
  mechanic, and session state transitions across all 7 mobile screens and Screen 10.
---

# Dynamic Page Builder Skill

Orchestrates the full check-in session lifecycle, packing primary cards (`score >= 0.50`) onto Offer Pages 1 and 2, collapsing lower-confidence items (`0.10 <= score < 0.50`) into the `"More extras (1)"` drawer, and routing zero-eligible sessions directly to the `"1 STEP"` Zero-Offer state.
