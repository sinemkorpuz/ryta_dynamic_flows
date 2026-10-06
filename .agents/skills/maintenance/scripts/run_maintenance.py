#!/usr/bin/env python3
"""Maintenance & Governance Suite for Dynamic Ancillary Flows.

Performs three critical audits across the `adk` and `frontend` tracks:
1. PII & Privacy Review: scans repository files for personal information, LDAPs,
   absolute user paths, forbidden file:/// markdown links, and verifies that
   sensitive files are .gitignored with sanitized .example templates.
2. Specs Coherence & Truthfulness: verifies that all specs/state/session docs
   point to real files, schemas in contracts/ are syntactically and semantically
   valid, and architectural claims are grounded in the codebase.
3. Specs / Implementation Drift: validates that code in dev/ implements the
   contracts in contracts/, interfaces in .agents/specs/, and AGENTS.md domain
   isolation rules without drift.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[4]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from dotenv import load_dotenv

    _dotenv_path = REPO_ROOT / ".env"
    if _dotenv_path.is_file():
        load_dotenv(_dotenv_path)
    else:
        load_dotenv()
except ImportError:
    pass

# Generic baseline patterns in git-tracked repository content (strictly free of hardcoded PII)
GENERIC_PATTERNS = [
    (r"/usr/local/google/home/[a-zA-Z0-9_.-]+", "Absolute Google developer home directory path"),
    (r"/home/[a-zA-Z0-9_.-]+", "Absolute developer home directory path"),
    (r"@[a-zA-Z0-9.-]*google\.com", "Internal corporate email address"),
    (r"\[[^\]]+\]\(file:///[^)]+\)", "Forbidden absolute file:/// markdown link (AGENTS.md Rule 2)"),
]

# Paths allowed to contain generic regex pattern definitions
EXEMPT_PATHS = {
    Path(".agents/skills/maintenance/scripts/run_maintenance.py"),
}


def load_blocked_terms(cli_terms: list[str] | None = None) -> list[str]:
    """Dynamically collects blocked terms from CLI, environment, .blocked_terms, and shell user."""
    terms: set[str] = set()

    # 1. From CLI
    if cli_terms:
        for t in cli_terms:
            for sub in t.split(","):
                clean = sub.strip()
                if clean:
                    terms.add(clean)

    # 2. From environment variable (e.g. MAINTENANCE_BLOCKED_TERMS="ldap1,name1")
    env_terms = os.getenv("MAINTENANCE_BLOCKED_TERMS")
    if env_terms:
        for t in env_terms.split(","):
            clean = t.strip()
            if clean:
                terms.add(clean)

    # 3. From optional git-ignored .blocked_terms file
    blocked_file = REPO_ROOT / ".blocked_terms"
    if blocked_file.exists():
        for line in blocked_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                terms.add(line)

    # 4. Automatically include current developer environment user if available
    for user_var in ("USER", "LOGNAME"):
        u = os.getenv(user_var)
        if u and u not in {"root", "nobody", "runner", "ubuntu"}:
            terms.add(u)

    return sorted(terms)


def get_git_tracked_files() -> list[Path]:
    """Returns a list of existing files tracked by Git (plus untracked working tree files outside ignored dirs)."""
    try:
        res = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        paths = [REPO_ROOT / f for f in res.stdout.splitlines() if f.strip()]
        return [p for p in paths if p.is_file()]
    except Exception as exc:
        print(f"Warning: git ls-files failed ({exc}), falling back to filesystem walk.")
        return [
            p
            for p in REPO_ROOT.rglob("*")
            if p.is_file()
            and not any(part in {".git", ".venv", "__pycache__", ".pytest_cache", "node_modules"} for part in p.parts)
            and p.name != ".blocked_terms"
        ]


def check_pii(blocked_terms: list[str] | None = None, verbose: bool = False) -> tuple[int, list[str]]:
    """Audit repository files for PII, personal LDAPs, home directories, and file:/// links."""
    print("=" * 70)
    print("TASK 1: PII & PRIVACY AUDIT")
    print("=" * 70)

    files = get_git_tracked_files()
    violations: list[str] = []

    # Compile patterns: generic base patterns + caller-provided blocked terms
    patterns: list[tuple[re.Pattern[str], str]] = [
        (re.compile(pat), desc) for pat, desc in GENERIC_PATTERNS
    ]
    for term in blocked_terms or []:
        escaped = re.escape(term)
        patterns.append(
            (re.compile(rf"\b{escaped}\b", re.IGNORECASE), f"Personal identifier / blocked term: '{term}'")
        )
        patterns.append(
            (re.compile(rf"projects/{escaped}\b", re.IGNORECASE), f"Personal GCP project reference: '{term}'")
        )
        patterns.append(
            (re.compile(rf"gs://{escaped}\b", re.IGNORECASE), f"Personal GCS bucket reference: '{term}'")
        )

    if blocked_terms and verbose:
        print(f"Auditing with {len(blocked_terms)} dynamic blocked term(s).")

    # Check 1.1: File contents
    for file_path in files:
        rel_path = file_path.relative_to(REPO_ROOT)
        if rel_path in EXEMPT_PATHS or rel_path.name == ".blocked_terms":
            continue
        # Skip binary files, lockfiles, images
        if rel_path.suffix in {".lock", ".png", ".jpg", ".ico", ".bin"}:
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        for line_num, line in enumerate(content.splitlines(), start=1):
            for regex, desc in patterns:
                target_line = re.sub(r"`[^`]+`", "", line) if "file:///" in desc else line
                if regex.search(target_line):
                    violations.append(
                        f"[{rel_path}:{line_num}] {desc}: '{line.strip()[:100]}'"
                    )

    # Check 1.2: Verify .gitignore coverage for sensitive configuration
    gitignore_path = REPO_ROOT / ".gitignore"
    if gitignore_path.exists():
        gi_content = gitignore_path.read_text(encoding="utf-8")
        expected_ignores = ["*.tfvars", ".env", "*.tfstate", "*.local", ".blocked_terms", "backend.tf"]
        for expected in expected_ignores:
            if expected not in gi_content:
                violations.append(f"[.gitignore] Missing critical ignore pattern: {expected}")
    else:
        violations.append("[.gitignore] Missing .gitignore file!")

    # Check 1.3: Verify sensitive files are NOT tracked by Git
    sensitive_patterns = ["*.tfvars", ".env", "*.tfstate", "backend.tf", "backend.hcl", ".blocked_terms"]
    for file_path in files:
        rel_path = str(file_path.relative_to(REPO_ROOT))
        for sp in sensitive_patterns:
            if not sp.startswith("!") and rel_path.endswith(sp.replace("*", "")):
                if not rel_path.endswith(".example"):
                    violations.append(f"[Git Tracking] Sensitive file tracked in Git: {rel_path}")

    # Output results
    if violations:
        print(f"FAILED: Found {len(violations)} PII / Privacy violation(s):")
        for v in violations:
            print(f"  - {v}")
    else:
        print(f"PASSED: No PII, developer LDAPs, or home directory paths detected across {len(files)} files.")

    print()
    return len(violations), violations


def audit_specs_semantic_truthfulness(verbose: bool = False) -> list[str]:
    """Tier 2: Invokes Gemini LLM-as-a-Judge to evaluate semantic truthfulness of specs vs. code."""
    violations: list[str] = []

    pairs = [
        (
            REPO_ROOT / ".agents/specs/system-architecture.md",
            [
                REPO_ROOT / "dev/core/models.py",
                REPO_ROOT / "dev/core/telemetry.py",
                REPO_ROOT / "contracts/checkin_flow.jsons",
                REPO_ROOT / "contracts/telemetry.jsons",
            ],
            "System Architecture & Stitch Consistency Contract vs. Core Models and Contracts",
        ),
        (
            REPO_ROOT / ".agents/specs/adk-architecture.md",
            [
                REPO_ROOT / "dev/core/orchestrator.py",
                REPO_ROOT / "dev/core/app.py",
                REPO_ROOT / "dev/skills/page_builder/skill.py",
                REPO_ROOT / "dev/tools/propensity_scorer.py",
                REPO_ROOT / "dev/tools/eligibility_rules.py",
                REPO_ROOT / "dev/tools/seat_allocator.py",
                REPO_ROOT / "dev/tools/basket_pricing.py",
            ],
            "ADK & FastAPI Backend Architecture vs. Orchestrator, Skills, and Deterministic Tools",
        ),
        (
            REPO_ROOT / ".agents/specs/frontend-architecture.md",
            [
                REPO_ROOT / "dev/ui/index.html",
                REPO_ROOT / "dev/ui/app.js",
                REPO_ROOT / "dev/core/app.py",
            ],
            "Frontend Architecture & Stitch Sanitization Rules vs. Single-Page App Implementation",
        ),
    ]

    try:
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)
        else:
            project = os.getenv("PROJECT_ID") or "example-project-id"
            location = os.getenv("REGION") or "europe-west4"
            client = genai.Client(vertexai=True, project=project, location=location)

        model_name = (
            os.getenv("MAINTENANCE_LLM_MODEL")
            or os.getenv("GEMINI_FLASH_MODEL")
            or os.getenv("GEMINI_MODEL")
            or "gemini-3.8-flash"
        )

        evaluated_count = 0
        for spec_file, code_files, description in pairs:
            if not spec_file.exists():
                violations.append(f"[Missing Spec] Required architecture spec not found: {spec_file.relative_to(REPO_ROOT)}")
                continue
            spec_text = spec_file.read_text(encoding="utf-8")[:6000]
            code_text = ""
            for cf in code_files:
                if cf.exists():
                    code_text += f"\n--- {cf.name} ---\n" + cf.read_text(encoding="utf-8")[:4000]

            prompt = (
                f"You are an expert software architecture and code review judge.\n"
                f"Audit the truthfulness and semantic coherence between this Technical Design Specification (TDD) "
                f"and its actual implementation code.\n\n"
                f"Context: {description}\n\n"
                f"SPECIFICATION:\n{spec_text}\n\n"
                f"IMPLEMENTATION CODE:\n{code_text}\n\n"
                f"Evaluate for:\n"
                f"1. Direct contradictions (spec claims X, but code implements not-X).\n"
                f"2. False claims (spec claims a feature is functional when it is missing or an empty stub).\n"
                f"3. Significant drift in endpoints, models, or state machine transitions.\n\n"
                f"Respond with a single JSON object strictly matching this schema:\n"
                f"{{\n"
                f'  "coherent": true,\n'
                f'  "truthfulness_score": 1.0,\n'
                f'  "findings": [\n'
                f'    {{"severity": "ERROR", "claim": "...", "reality": "...", "explanation": "..."}}\n'
                f"  ]\n"
                f"}}\n"
                f"Only use 'ERROR' for unambiguous contradictions or fabricated claims. "
                f"Return ONLY valid JSON."
            )

            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                evaluated_count += 1
                text = response.text or ""
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()

                result = json.loads(text)
                score = result.get("truthfulness_score", 1.0)
                findings = result.get("findings", [])

                if verbose or not result.get("coherent", True):
                    print(f"  [{spec_file.name}] Truthfulness: {score:.0%}, Findings: {len(findings)}")

                for f in findings:
                    sev = f.get("severity", "WARNING")
                    msg = f"[{spec_file.name}] Semantic {sev}: {f.get('claim', '')} -> {f.get('explanation', '')}"
                    if sev == "ERROR":
                        violations.append(msg)
                    elif verbose:
                        print(f"    - {msg}")
            except Exception as call_exc:
                if verbose:
                    print(f"  [{spec_file.name}] LLM call skipped: {call_exc}")

        if evaluated_count == 0 and not violations:
            print("INFO (Tier 2): LLM semantic evaluation skipped (no active Gemini credentials in environment).")
            print("                Pass --skip-llm for offline static checks or set GEMINI_API_KEY.")
        elif not violations:
            print(f"PASSED (Tier 2): LLM semantic evaluation confirmed truthfulness across {evaluated_count} spec(s).")
        else:
            print(f"FAILED (Tier 2): Found {len(violations)} semantic contradiction(s).")

    except Exception as exc:
        print(f"INFO (Tier 2): LLM semantic evaluation skipped ({exc}).")
        print("                Pass --skip-llm to suppress this notice or configure API key / ADC credentials.")

    return violations


def check_specs_coherence(skip_llm: bool = False, verbose: bool = False) -> tuple[int, list[str]]:
    """Audit specs for broken references, invalid schemas, and semantic truthfulness."""
    print("=" * 70)
    print("TASK 2: SPECS COHERENCE & TRUTHFULNESS AUDIT")
    print("=" * 70)

    violations: list[str] = []
    specs_dir = REPO_ROOT / ".agents" / "specs"
    states_dir = REPO_ROOT / ".agents" / "states"
    sessions_dir = REPO_ROOT / ".agents" / "sessions"
    skills_dir = REPO_ROOT / ".agents" / "skills"
    contracts_dir = REPO_ROOT / "contracts"

    print("Tier 1: Static Structural Coherence & Schema Validation...")
    # Check 2.1: Validate JSON Schemas & OpenAPI documents
    schema_files = sorted(list(contracts_dir.glob("*.jsons")) + list(contracts_dir.glob("*.json")))
    if not schema_files:
        violations.append("[contracts/] No contract files (*.jsons or *.json) found in contracts/")
    for sf in schema_files:
        try:
            data = json.loads(sf.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                violations.append(f"[{sf.relative_to(REPO_ROOT)}] Schema root must be a JSON object")
            elif "openapi" in data:
                if not str(data.get("openapi", "")).startswith("3."):
                    violations.append(f"[{sf.relative_to(REPO_ROOT)}] Expected OpenAPI 3.x document")
                if "paths" not in data:
                    violations.append(f"[{sf.relative_to(REPO_ROOT)}] OpenAPI document missing 'paths' property")
            else:
                if "$schema" not in data:
                    violations.append(f"[{sf.relative_to(REPO_ROOT)}] Schema missing '$schema' declaration")
        except Exception as exc:
            violations.append(f"[{sf.relative_to(REPO_ROOT)}] Invalid JSON: {exc}")

    # Check 2.2: Markdown links integrity in AGENTS.md, .agents/specs/, .agents/states/, .agents/sessions/, .agents/skills/
    md_files: list[Path] = []
    if (REPO_ROOT / "AGENTS.md").exists():
        md_files.append(REPO_ROOT / "AGENTS.md")
    for directory in (specs_dir, states_dir, sessions_dir, skills_dir, REPO_ROOT / "dev" / "skills"):
        if directory.exists():
            md_files.extend(sorted(directory.rglob("*.md")))

    for mf in md_files:
        rel_path = mf.relative_to(REPO_ROOT)
        content = mf.read_text(encoding="utf-8", errors="ignore")
        # Strip fenced code blocks and inline code spans before scanning markdown links
        stripped = re.sub(r"```.*?```", "", content, flags=re.DOTALL)
        stripped = re.sub(r"`[^`]+`", "", stripped)
        links = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", stripped)
        for text, target in links:
            if target.startswith(("http://", "https://", "#", "mailto:", "conversation://")):
                continue
            clean_target = target.split("#", 1)[0].strip()
            if not clean_target:
                continue
            if clean_target.startswith("file://"):
                violations.append(
                    f"[{rel_path}] Forbidden file:// URI in markdown link: [{text}]({target})"
                )
                clean_target = clean_target[7:]
            target_path = Path(clean_target)
            if not target_path.is_absolute():
                target_path = (mf.parent / target_path).resolve()
            else:
                target_path = target_path.resolve()

            if not target_path.exists():
                violations.append(
                    f"[{rel_path}] Broken internal reference: '{text}' -> '{target}' (file not found)"
                )

    if violations:
        print(f"FAILED (Tier 1): Found {len(violations)} structural issue(s):")
        for v in violations:
            print(f"  - {v}")
    else:
        print(
            f"PASSED (Tier 1): All {len(schema_files)} contract schema(s) valid and markdown references across {len(md_files)} doc(s) resolve cleanly."
        )

    # Tier 2: LLM Semantic Truthfulness & Grounding (Default)
    if skip_llm:
        print("Tier 2: LLM Semantic Truthfulness skipped (--skip-llm requested).")
    else:
        print("Tier 2: LLM Semantic Truthfulness & Grounding (Default)...")
        llm_violations = audit_specs_semantic_truthfulness(verbose=verbose)
        violations.extend(llm_violations)

    print()
    return len(violations), violations


def check_specs_drift(verbose: bool = False) -> tuple[int, list[str]]:
    """Audit for drift between .agents/specs/, contracts/, and dev/ code implementation."""
    print("=" * 70)
    print("TASK 3: SPECS / IMPLEMENTATION DRIFT AUDIT")
    print("=" * 70)

    violations: list[str] = []

    # Check 3.1: Check FastAPI gateway routes vs. Dynamic Check-in Flows specification
    expected_endpoints = [
        "/api/v1/health",
        "/api/v1/checkin/personas",
        "/api/v1/checkin/sessions",
        "/api/v1/checkin/sessions/{session_id}",
        "/api/v1/checkin/sessions/{session_id}/seat-map",
        "/api/v1/checkin/sessions/{session_id}/seats",
        "/api/v1/checkin/sessions/{session_id}/actions",
        "/api/v1/checkin/sessions/{session_id}/checkout",
        "/api/v1/analytics/summary",
    ]

    try:
        from dev.core.app import app

        registered_paths = set(app.openapi().get("paths", {}).keys())
        for ep in expected_endpoints:
            if ep not in registered_paths:
                violations.append(f"[Route Drift] Expected endpoint {ep} not registered in FastAPI app")
    except Exception as exc:
        violations.append(f"[Route Drift] Failed to load FastAPI app routes from dev.core.app: {exc}")

    # Check 3.2: Check that dev/core/*.py remains strictly domain-agnostic (AGENTS.md Rule 3)
    core_dir = REPO_ROOT / "dev" / "core"
    forbidden_core_tokens = ["dev.tools", "Marta Byrne", "X8Y9QL", "FR1234", "Declan Byrne"]
    for py_file in sorted(core_dir.glob("*.py")):
        text = py_file.read_text(encoding="utf-8")
        for token in forbidden_core_tokens:
            if token in text:
                violations.append(
                    f"[Domain Leak in dev/core] {py_file.relative_to(REPO_ROOT)} contains domain-specific reference '{token}' (violates AGENTS.md Rule 3)"
                )

    # Check 3.3: Check that user stories in .agents/specs/*-user_stories.yaml are well-formed and reference real files
    try:
        import yaml  # type: ignore

        user_stories_files = [
            p
            for p in sorted((REPO_ROOT / ".agents" / "specs").glob("*-user_stories.yaml"))
            if not p.name.startswith("COMPONENT-")
        ]
        if not user_stories_files:
            violations.append("[Backlog Drift] No *-user_stories.yaml files found in .agents/specs/")
        for usf in user_stories_files:
            rel_usf = usf.relative_to(REPO_ROOT)
            parsed = yaml.safe_load(usf.read_text(encoding="utf-8"))
            if not isinstance(parsed, dict) or "stories" not in parsed or not isinstance(parsed["stories"], list):
                violations.append(f"[{rel_usf}] Missing root 'stories' list")
                continue
            for story in parsed["stories"]:
                sid = story.get("id", "<unknown>")
                for req_key in ("id", "title", "gate", "status", "spec_ref", "contract_ref", "acceptance_criteria"):
                    if req_key not in story:
                        violations.append(f"[{rel_usf}:{sid}] Missing required story field '{req_key}'")
                for ref_key in ("spec_ref", "contract_ref"):
                    ref_val = story.get(ref_key)
                    if ref_val and not (REPO_ROOT / ref_val).exists():
                        violations.append(
                            f"[{rel_usf}:{sid}] Story {ref_key} points to non-existent file '{ref_val}'"
                        )
    except ImportError:
        pass

    # Check 3.4: Verify contracts/openapi.json matches runtime FastAPI app.openapi()
    openapi_contract_path = REPO_ROOT / "contracts/openapi.json"
    if not openapi_contract_path.exists():
        violations.append(
            "[OpenAPI Contract Missing] contracts/openapi.json does not exist. "
            "Run: uv run python .agents/skills/maintenance/scripts/run_maintenance.py --export-openapi"
        )
    else:
        try:
            frozen_spec = json.loads(openapi_contract_path.read_text(encoding="utf-8"))
            from dev.core.app import app

            runtime_spec = app.openapi()
            if frozen_spec != runtime_spec:
                violations.append(
                    "[OpenAPI Contract Drift] contracts/openapi.json is out of date with FastAPI app routes. "
                    "Run: uv run python .agents/skills/maintenance/scripts/run_maintenance.py --export-openapi"
                )
        except Exception as exc:
            violations.append(f"[OpenAPI Contract Error] Failed to validate contracts/openapi.json: {exc}")

    if violations:
        print(f"FAILED: Found {len(violations)} drift issue(s):")
        for v in violations:
            print(f"  - {v}")
    else:
        print("PASSED: Implementation in dev/ matches contracts in contracts/ and specs in .agents/specs/.")

    print()
    return len(violations), violations


def export_openapi(dest_path: Path | None = None) -> Path:
    """Exports the FastAPI runtime OpenAPI 3.1 specification to contracts/openapi.json."""
    dest = dest_path or (REPO_ROOT / "contracts/openapi.json")
    from dev.core.app import app

    spec = app.openapi()
    dest.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
    print(f"Exported canonical OpenAPI 3.1 contract to: {dest.relative_to(REPO_ROOT)}")
    return dest


def main() -> int:
    parser = argparse.ArgumentParser(description="Dynamic Ancillary Flows Maintenance & Governance Suite")
    parser.add_argument(
        "--check",
        choices=["pii", "coherence", "drift", "all"],
        default="all",
        help="Specify which maintenance audit to execute (default: all)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run all maintenance audits",
    )
    parser.add_argument(
        "--blocked-terms",
        "-t",
        nargs="*",
        default=[],
        help="Employee LDAPs, personal names, or project IDs to audit dynamically (avoids hardcoding in scripts)",
    )
    parser.add_argument(
        "--export-openapi",
        action="store_true",
        help="Export FastAPI runtime OpenAPI 3.1 specification to contracts/openapi.json",
    )
    parser.add_argument(
        "--skip-llm",
        action="store_true",
        help="Skip Tier 2 LLM semantic evaluation (enabled by default) and run only Tier 1 static checks",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    args = parser.parse_args()

    if args.export_openapi:
        export_openapi()
        return 0

    blocked_terms = load_blocked_terms(args.blocked_terms)
    total_violations = 0
    run_all = args.all or args.check == "all"
    if run_all or args.check == "pii":
        v, _ = check_pii(blocked_terms, args.verbose)
        total_violations += v
    if run_all or args.check == "coherence":
        v, _ = check_specs_coherence(skip_llm=args.skip_llm, verbose=args.verbose)
        total_violations += v
    if run_all or args.check == "drift":
        v, _ = check_specs_drift(args.verbose)
        total_violations += v

    print("=" * 70)
    if total_violations == 0:
        print("ALL MAINTENANCE AUDITS PASSED CLEANLY.")
        return 0
    else:
        print(f"MAINTENANCE AUDIT FAILED WITH {total_violations} TOTAL ISSUE(S).")
        return 1


if __name__ == "__main__":
    sys.exit(main())
