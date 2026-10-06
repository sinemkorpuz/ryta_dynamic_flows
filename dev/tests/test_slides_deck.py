"""Automated verification suite for the Cloudstyle 2.0 Slidev presentation (FE-004).

Verifies modular structure, Cloudstyle 2.0 layout invariants (including the
#FBBC05 yellow break-slide #202124 dark-text contrast rule), dual-mode interactive
Vue components, 14-slide BBP tripartite speaker notes, Stitch Consistency Contract
fixtures, and PII/link hygiene.
"""

from __future__ import annotations

from pathlib import Path
import re

REPO_ROOT = Path(__file__).resolve().parents[2]
SLIDES_DIR = REPO_ROOT / "dev" / "slides"
PAGES_DIR = SLIDES_DIR / "pages"
LAYOUTS_DIR = SLIDES_DIR / "layouts"
COMPONENTS_DIR = SLIDES_DIR / "components"


def test_slidev_project_structure_and_partials() -> None:
    """Verify master slides.md entrypoint and all 4 modular Act partials exist."""
    assert (SLIDES_DIR / "package.json").is_file()
    assert (SLIDES_DIR / "slides.md").is_file()
    assert (SLIDES_DIR / "styles" / "cloudstyle.css").is_file()
    assert (SLIDES_DIR / "styles" / "index.ts").is_file()

    master_text = (SLIDES_DIR / "slides.md").read_text(encoding="utf-8")
    expected_partials = [
        "01-executive-context.md",
        "02-customer-journey-demo.md",
        "03-hybrid-adk-architecture.md",
        "04-observability-coevolution.md",
    ]
    for partial in expected_partials:
        assert f"./pages/{partial}" in master_text
        assert (PAGES_DIR / partial).is_file(), f"Missing slide partial: {partial}"


def test_cloudstyle_layouts_and_yellow_contrast_rule() -> None:
    """Verify all 7 Cloudstyle 2.0 layouts and the #FBBC05 yellow dark-text rule."""
    expected_layouts = [
        "cloud-cover.vue",
        "cloud-toc.vue",
        "cloud-break.vue",
        "cloud-sidebar-table.vue",
        "cloud-four-cards.vue",
        "cloud-twotone.vue",
        "cloud-split.vue",
    ]
    for layout_name in expected_layouts:
        assert (LAYOUTS_DIR / layout_name).is_file(), f"Missing layout: {layout_name}"

    break_vue = (LAYOUTS_DIR / "cloud-break.vue").read_text(encoding="utf-8")
    # Cloudstyle 2.0 Critical Contrast Rule: Yellow (#FBBC05) must use #202124 dark text
    assert "#FBBC05" in break_vue
    assert "props.color === 'yellow'" in break_vue
    assert "#202124" in break_vue


def test_fourteen_slides_have_tripartite_speaker_notes() -> None:
    """Verify all 14 slides include PURPOSE, VERBAL SCRIPT, and TRANSITION notes."""
    slide_files = [
        SLIDES_DIR / "slides.md",
        PAGES_DIR / "01-executive-context.md",
        PAGES_DIR / "02-customer-journey-demo.md",
        PAGES_DIR / "03-hybrid-adk-architecture.md",
        PAGES_DIR / "04-observability-coevolution.md",
    ]
    combined = "\n".join(f.read_text(encoding="utf-8") for f in slide_files)

    purpose_count = len(re.findall(r"^PURPOSE:", combined, flags=re.MULTILINE))
    script_count = len(re.findall(r"^VERBAL SCRIPT:", combined, flags=re.MULTILINE))
    transition_count = len(re.findall(r"^TRANSITION:", combined, flags=re.MULTILINE))

    assert purpose_count == 14, f"Expected 14 PURPOSE notes, found {purpose_count}"
    assert script_count == 14, f"Expected 14 VERBAL SCRIPT notes, found {script_count}"
    assert transition_count == 14, f"Expected 14 TRANSITION notes, found {transition_count}"


def test_dual_mode_components_and_stitch_consistency_contract() -> None:
    """Verify interactive Vue components enforce the Stitch Consistency Contract."""
    simulator_text = (COMPONENTS_DIR / "HelpHubSimulator.vue").read_text(encoding="utf-8")
    explorer_text = (COMPONENTS_DIR / "LiveScoringExplorer.vue").read_text(encoding="utf-8")
    ops_text = (COMPONENTS_DIR / "OpsFeedbackWidget.vue").read_text(encoding="utf-8")
    all_deck_text = "\n".join(
        [
            simulator_text,
            explorer_text,
            ops_text,
            *(f.read_text(encoding="utf-8") for f in PAGES_DIR.glob("*.md")),
        ]
    )

    canonical_tokens = [
        "FR1234",
        "DUB → FAO",
        "X8Y9QL",
        "Marta Byrne",
        "Declan B",
        "Fia B",
        "Oisín B",
        "€76.00",
        "12A–12D",
        "€24.00",
        "€39.99",
        "139.99",
        "Visa ending 4412",
        "2 STEPS TO YOUR BOARDING PASSES",
        "1 STEP",
        "No thanks, continue →",
        "24.1%",
        "1.8",
        "71s",
    ]
    for token in canonical_tokens:
        assert token in all_deck_text, f"Missing canonical Stitch token: {token}"

    # Verify Dual-Mode API + Fallback endpoints
    assert "http://localhost:8000/api/v1/checkin/sessions" in explorer_text
    assert "http://localhost:8000/api/v1/analytics/summary" in ops_text


def test_no_file_urls_or_blocked_terms_in_slides_and_specs() -> None:
    """Ensure zero file:/// links or .blocked_terms leak into slides, specs, or skills."""
    blocked_file = REPO_ROOT / ".blocked_terms"
    blocked_terms: list[str] = []
    if blocked_file.is_file():
        for line in blocked_file.read_text(encoding="utf-8").splitlines():
            cleaned = line.strip()
            if cleaned and not cleaned.startswith("#"):
                blocked_terms.append(cleaned.lower())

    files_to_audit = [
        REPO_ROOT / ".agents" / "specs" / "slides-architecture.md",
        REPO_ROOT / ".agents" / "skills" / "slidev-deck" / "SKILL.md",
        *SLIDES_DIR.rglob("*.md"),
        *SLIDES_DIR.rglob("*.vue"),
        *SLIDES_DIR.rglob("*.css"),
    ]
    for path in files_to_audit:
        if "node_modules" in path.parts or "dist" in path.parts:
            continue
        content = path.read_text(encoding="utf-8")
        assert "file:///" not in content, f"Forbidden file:/// link in {path}"
        lower_content = content.lower()
        for term in blocked_terms:
            pattern = rf"\b{re.escape(term)}\b"
            assert not re.search(pattern, lower_content), f"Blocked term '{term}' found in {path}"
