---
name: ancillary_ranking
version: "1.0.0"
description: >-
  Scores all 8 candidate ancillaries by passenger purchase likelihood and applies
  hard business eligibility and suppression rules before page assembly.
---

# Ancillary Ranking Skill

Orchestrates `dev.tools.propensity_scorer` and `dev.tools.eligibility_rules` to rank and filter ancillary offers within the check-in window.
