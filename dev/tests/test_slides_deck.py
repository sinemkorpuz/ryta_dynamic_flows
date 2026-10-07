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


def test_eighteen_slides_prioritized_flow_architecture_early_and_fallbacks() -> None:
    """Verify all 18 slides include tripartite speaker notes, early architecture flow, Thank You slide, and 3 fallback slides."""
    slide_files = [
        SLIDES_DIR / "slides.md",
        PAGES_DIR / "01-executive-context.md",
        PAGES_DIR / "03-hybrid-adk-architecture.md",
        PAGES_DIR / "02-customer-journey-demo.md",
        PAGES_DIR / "04-observability-coevolution.md",
    ]
    combined = "\n".join(f.read_text(encoding="utf-8") for f in slide_files)

    purpose_count = len(re.findall(r"^PURPOSE:", combined, flags=re.MULTILINE))
    script_count = len(re.findall(r"^VERBAL SCRIPT:", combined, flags=re.MULTILINE))
    transition_count = len(re.findall(r"^TRANSITION:", combined, flags=re.MULTILINE))

    assert purpose_count == 18, f"Expected 18 PURPOSE notes, found {purpose_count}"
    assert script_count == 18, f"Expected 18 VERBAL SCRIPT notes, found {script_count}"
    assert transition_count == 18, f"Expected 18 TRANSITION notes, found {transition_count}"

    # Verify zero unformatted raw backticks appear outside speaker-note HTML comments
    for slide_file in slide_files:
        without_comments = re.sub(r"<!--[\s\S]*?-->", "", slide_file.read_text(encoding="utf-8"))
        assert "`" not in without_comments, f"Raw backtick found in {slide_file.name}; use <code>...</code>"

    # Verify architecture partial is imported BEFORE customer journey demo in slides.md
    master_text = (SLIDES_DIR / "slides.md").read_text(encoding="utf-8")
    assert master_text.index("03-hybrid-adk-architecture.md") < master_text.index("02-customer-journey-demo.md")

    # Verify 2-part Contents slides and Stitch/Antigravity vector logos in 01-executive-context.md
    exec_text = (PAGES_DIR / "01-executive-context.md").read_text(encoding="utf-8")
    assert 'title: "Contents (1 / 2)"' in exec_text
    assert 'title: "Contents (2 / 2)"' in exec_text
    assert "logo-chip-stitch" in exec_text
    assert "logo-chip-ag" in exec_text
    assert "toc-badge-end" in exec_text
    assert "toc-badge-fallback" in exec_text

    # Verify System Overview and ADK Workflow architecture diagram components exist and are embedded early
    assert (COMPONENTS_DIR / "SystemOverviewDiagram.vue").is_file()
    assert (COMPONENTS_DIR / "AdkWorkflowDiagram.vue").is_file()
    arch_text = (PAGES_DIR / "03-hybrid-adk-architecture.md").read_text(encoding="utf-8")
    assert "<SystemOverviewDiagram />" in arch_text
    assert "<AdkWorkflowDiagram />" in arch_text

    # Verify Thank You slide precedes the 3 Fallback slides in 04-observability-coevolution.md
    obs_text = (PAGES_DIR / "04-observability-coevolution.md").read_text(encoding="utf-8")
    thank_you_idx = obs_text.index('sectionNo: "Thank You"')
    fb1_idx = obs_text.index("FALLBACK SLIDE 01")
    fb2_idx = obs_text.index("FALLBACK SLIDE 02")
    fb3_idx = obs_text.index("FALLBACK SLIDE 03")
    assert thank_you_idx < fb1_idx < fb2_idx < fb3_idx

    # Verify cover layout and architecture diagrams use HTML flexbox/grid cards instead of overlapping SVG <text>
    cover_vue = (LAYOUTS_DIR / "cloud-cover.vue").read_text(encoding="utf-8")
    sys_diag_vue = (COMPONENTS_DIR / "SystemOverviewDiagram.vue").read_text(encoding="utf-8")
    adk_diag_vue = (COMPONENTS_DIR / "AdkWorkflowDiagram.vue").read_text(encoding="utf-8")
    assert "arch-telemetry-card" in cover_vue
    assert "<text " not in cover_vue
    assert "<text " not in sys_diag_vue
    assert "<text " not in adk_diag_vue


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
        "Google Stitch",
        "Antigravity",
        "Google ADK",
    ]
    for token in canonical_tokens:
        assert token in all_deck_text, f"Missing canonical Stitch token: {token}"

    # Verify sanitized Stitch wireframes are bundled for the end-to-end walkthrough
    stitch_public_dir = SLIDES_DIR / "public" / "stitch"
    for screen_letter in ("A", "B", "C", "D", "E", "F", "G"):
        screen_path = stitch_public_dir / f"Screen-{screen_letter}.html"
        assert screen_path.is_file(), f"Missing Stitch wireframe: {screen_path}"

    # Verify Dual-Mode API + Fallback endpoints (including Screen E question -> ADK /assist)
    assert "http://localhost:8000/api/v1/checkin/sessions" in explorer_text
    assert "http://localhost:8000/api/v1/analytics/summary" in ops_text
    assert "submitHelpQuery" in simulator_text
    assert "/assist" in simulator_text

    screen_e_html = (stitch_public_dir / "Screen-E.html").read_text(encoding="utf-8")
    assert "stitch-help-form" in screen_e_html
    assert "stitch-help-input" in screen_e_html
    assert "/assist" in screen_e_html


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
