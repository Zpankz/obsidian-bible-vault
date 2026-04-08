#!/usr/bin/env python3
"""
Bible Study Pipeline — Ars Contexta-inspired reduce/reflect/reweave cycle.

Pipeline stages:
  1. REDUCE  — Ingest source material, extract structured insights
  2. REFLECT — Find connections across the vault graph
  3. REWEAVE — Update existing notes with new connections
  4. VERIFY  — Check structural integrity
  5. HEAL    — Fix any issues found

Usage:
    # Full pipeline on a commentary
    python pipeline.py reduce --source commentaries/raw/matthew-henry-genesis.md

    # Reflect on a passage
    python pipeline.py reflect --passage "Genesis 1:26-28"

    # Personal reflection
    python pipeline.py reflect --passage "Psalm 23" --reflection "This psalm speaks to me about..."

    # Reweave (update connections across the vault)
    python pipeline.py reweave --scope "bibles/NASB-IL/Genesis"

    # Full health check
    python pipeline.py heal

    # Run the complete cycle
    python pipeline.py cycle --source commentary.md
"""

import argparse, os, sys, json
from datetime import date
from pathlib import Path
from agent_graph import run_agent, AGENTS

VAULT = Path(os.environ.get("VAULT_PATH", "/Users/mikhail/obsidian/book"))


def ensure_ops_structure():
    """Create the Ars Contexta-inspired ops directory."""
    dirs = [
        VAULT / "ops",
        VAULT / "ops/health",
        VAULT / "ops/sessions",
        VAULT / "ops/queue",
        VAULT / "ops/observations",
        VAULT / "reflections",
        VAULT / "commentaries",
        VAULT / "commentaries/raw",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)


def stage_reduce(source: str) -> str:
    """REDUCE: Ingest source material, extract structured insights."""
    print(f"[REDUCE] Processing: {source}")
    result = run_agent("commentary", f"""
Ingest and process this source material into the vault:
Source: {source}

Steps:
1. Read the source file
2. Identify all Bible passages referenced
3. For each passage, create or update commentary notes
4. Extract key theological concepts and link to concept notes
5. Identify new cross-references the source suggests
6. Update chapter frontmatter with commentary links
""")
    # Log session
    log_session("reduce", source, result)
    return result


def stage_reflect(passage: str, reflection: str = None) -> str:
    """REFLECT: Find connections and process reflections."""
    print(f"[REFLECT] Analyzing: {passage}")
    if reflection:
        result = run_agent("reflection", f"""
Process this personal reflection on {passage}:

"{reflection}"

Steps:
1. Read the passage from the vault
2. Create a reflection note at reflections/{date.today()}-{passage.replace(' ', '-').lower()}.md
3. Traverse the graph from this passage to find related concepts and passages
4. Link the reflection to themes, concepts, and related passages
5. Update the chapter frontmatter with a reflection link
""")
    else:
        result = run_agent("traversal", f"""
Deeply analyze {passage} by traversing the vault graph:

1. Read the passage and its interlinear data
2. Follow cross-references (2 hops deep)
3. Look up key Strong's numbers and find where they appear elsewhere
4. Identify thematic connections via concept notes
5. Synthesize findings into a connected analysis
""")
    log_session("reflect", passage, result)
    return result


def stage_reweave(scope: str = "bibles/NASB-IL") -> str:
    """REWEAVE: Update existing notes with newly discovered connections."""
    print(f"[REWEAVE] Scope: {scope}")
    result = run_agent("concept_builder", f"""
Review and enrich notes in {scope}:

1. List the directory to see what notes exist
2. For each note, check if frontmatter is complete
3. Look for missing concept links (Strong's numbers in interlinear without concept notes)
4. Create missing concept notes or Strong's stubs
5. Update frontmatter with any new connections found
6. Ensure all notes have proper tags for smart-connections

Focus on the 5 notes that would benefit most from enrichment.
""")
    log_session("reweave", scope, result)
    return result


def stage_hermeneutics(passage: str) -> str:
    """Analyze grammatico-historical context."""
    print(f"[HERMENEUTICS] Analyzing: {passage}")
    result = run_agent("hermeneutics", f"""
Add grammatico-historical analysis to {passage}:

1. Read the chapter note
2. Determine the literary genre and sub-genre
3. Identify the historical setting (Sitz im Leben)
4. Analyze the literary structure (chiasm, inclusio, etc.)
5. Note rhetorical devices and discourse markers
6. Update frontmatter with hermeneutic.* fields
7. If chiastic structure found, add hermeneutic.chiasm.* fields
""")
    log_session("hermeneutics", passage, result)
    return result


def stage_verify_and_heal() -> str:
    """VERIFY + HEAL: Check integrity and fix issues."""
    print("[HEAL] Running vault health check...")
    result = run_agent("healer", """
Perform a comprehensive health check:

1. Check for orphan notes (no backlinks) in concepts/ and strongs/
2. Check for missing frontmatter fields in bibles/NASB-IL/
3. Check tag consistency
4. Report issues found and fixes applied
5. Create a health report at ops/health/{today}-health.md
""")
    log_session("heal", "full-vault", result)
    return result


def run_cycle(source: str = None, passage: str = None) -> str:
    """Run the full reduce → reflect → reweave → heal cycle."""
    results = []

    if source:
        results.append(("REDUCE", stage_reduce(source)))

    if passage:
        results.append(("REFLECT", stage_reflect(passage)))

    results.append(("REWEAVE", stage_reweave()))
    results.append(("HEAL", stage_verify_and_heal()))

    summary = "\n\n".join(f"## {name}\n{text}" for name, text in results)
    return summary


def log_session(stage: str, target: str, result: str):
    """Log a pipeline session to ops/sessions/."""
    today = date.today().isoformat()
    session_dir = VAULT / "ops/sessions"
    session_dir.mkdir(parents=True, exist_ok=True)

    existing = list(session_dir.glob(f"{today}-*.md"))
    idx = len(existing) + 1

    session_file = session_dir / f"{today}-{idx:03d}-{stage}.md"
    content = f"""---
type: session
date: {today}
stage: {stage}
target: "{target}"
---

# {stage.upper()}: {target}

{result[:3000]}
"""
    session_file.write_text(content, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Bible Study Pipeline")
    parser.add_argument("stage", choices=["reduce", "reflect", "reweave", "heal", "hermeneutics", "cycle"],
                        help="Pipeline stage to run")
    parser.add_argument("--source", help="Source file path")
    parser.add_argument("--passage", help="Bible passage reference")
    parser.add_argument("--reflection", help="Personal reflection text")
    parser.add_argument("--scope", default="bibles/NASB-IL", help="Vault scope for reweave")
    args = parser.parse_args()

    if not os.environ.get("GEMINI_API_KEY"):
        print("Set GEMINI_API_KEY environment variable")
        sys.exit(1)

    ensure_ops_structure()

    if args.stage == "reduce":
        if not args.source:
            print("--source required for reduce stage")
            sys.exit(1)
        print(stage_reduce(args.source))

    elif args.stage == "reflect":
        if not args.passage:
            print("--passage required for reflect stage")
            sys.exit(1)
        print(stage_reflect(args.passage, args.reflection))

    elif args.stage == "reweave":
        print(stage_reweave(args.scope))

    elif args.stage == "hermeneutics":
        if not args.passage:
            print("--passage required for hermeneutics stage")
            sys.exit(1)
        print(stage_hermeneutics(args.passage))

    elif args.stage == "heal":
        print(stage_verify_and_heal())

    elif args.stage == "cycle":
        print(run_cycle(args.source, args.passage))


if __name__ == "__main__":
    main()
