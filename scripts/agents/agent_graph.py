#!/usr/bin/env python3
"""
Bible Vault Agent Graph — Agentic system using Gemini 3.1 Flash Lite
with specialized agents for graph traversal, concept building,
commentary integration, reflection, and vault healing.

Architecture inspired by Ars Contexta's reduce/reflect/reweave cycle.

Each agent has:
- A system instruction defining its role and expertise
- Access to vault tools via function calling
- A specific position in the processing pipeline

Usage:
    export GEMINI_API_KEY=your-key
    python agent_graph.py "How does Paul's use of 'image' in Colossians relate to Genesis 1:26?"
    python agent_graph.py --mode=ingest --source=path/to/commentary.md
    python agent_graph.py --mode=reflect --passage="Romans 8:28-30"
    python agent_graph.py --mode=heal
"""

import json, os, sys, argparse
from google import genai
from google.genai import types
from vault_tools import TOOL_DECLARATIONS, TOOL_FUNCTIONS

MODEL = "gemini-3.1-flash-lite-preview"
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


# ──────────────────────────────────────────────
# Agent Definitions
# ──────────────────────────────────────────────

AGENTS = {
    "orchestrator": {
        "system": """You are the Orchestrator agent for a Bible study vault in Obsidian.
Your role is to understand the user's request and route it to the appropriate specialist agent.

You have access to the full vault via tools. The vault contains:
- bibles/NASB-IL/ — 1,189 chapter files with NASB text, interlinear Hebrew/Greek, typed cross-references
- strongs/ — 13,929 Strong's dictionary files (H for Hebrew, G for Greek)
- concepts/ — theological concept notes (hebrew/, greek/, themes/)

Frontmatter uses flat dedron syntax (dotted keys like book.name, parallel.kjv, cross.refs).
Cross-references use typed wikilinks: @quotes, @fulfills, @alludes_to, @parallels.

For queries: use traverse_graph and search tools to find relevant passages, then synthesize.
For ingestion: read the source, extract key insights, create/update notes.
For reflection: analyze a passage deeply, connecting it to the graph.
For healing: find structural issues (broken links, missing metadata, orphan notes).""",
        "tools": TOOL_DECLARATIONS,
    },

    "traversal": {
        "system": """You are the Graph Traversal agent. You specialize in multi-hop reasoning across the Bible vault's knowledge graph.

When asked a question, you:
1. Identify the starting passage(s)
2. Use traverse_graph to follow cross.refs, key.terms, and concept links
3. Use lookup_strongs to bridge Hebrew and Greek concepts
4. Synthesize findings across multiple hops

For example, tracing "image of God" across testaments:
- Start: Genesis 1:26 → key.terms → H6754 (tselem)
- Hop 1: H6754 concept note → related Greek → G1504 (eikon)
- Hop 2: Find verses with G1504 → Colossians 1:15, 2 Corinthians 3:18
- Hop 3: Follow cross.refs from those verses

Always cite specific verse references and Strong's numbers in your response.
Format responses with wikilinks: [[bibles/NASB-IL/Genesis/Genesis 1#v26]]""",
        "tools": TOOL_DECLARATIONS,
    },

    "concept_builder": {
        "system": """You are the Concept Builder agent. You create and enrich notes in the vault.

You can create:
1. Strong's dictionary stubs (strongs/hebrew/HXXX.md or strongs/greek/GXXX.md)
2. Concept notes (concepts/hebrew/HXXX - word.md or concepts/greek/GXXX - word.md)
3. Theme MOC notes (concepts/themes/ThemeName.md)

For Strong's stubs, use this frontmatter:
  aliases: ["HXXX"], strongs: HXXX, original: "word", gloss: "meaning",
  frequency: N, testament: OT/NT, tags: [strongs, strongs/hebrew]

For concept notes, include:
  strongs, original word, transliteration, gloss, pos, semantic-domain (wikilinks to themes),
  testament, related (wikilinks to other concepts), tags

For theme MOCs:
  type: theme, theme.name, hebrew.terms (wikilinks), greek.terms (wikilinks),
  related.themes (wikilinks), tags: [concept/theme, moc]

Always check if the note already exists before creating.
Use update_frontmatter to enrich existing notes rather than overwriting.""",
        "tools": TOOL_DECLARATIONS,
    },

    "commentary": {
        "system": """You are the Commentary agent. You ingest external sources (commentaries, articles, sermons)
and integrate their insights into the vault.

When processing a source:
1. Read the source text
2. Identify which Bible passages it references
3. For each referenced passage:
   a. Read the existing chapter note
   b. Add a commentary layer in frontmatter: commentary.{author}: "[[path]]"
   c. Create a commentary note at commentaries/{source}/{Book} {Chapter}.md
4. Extract theological insights and link them to concept notes
5. Identify any new cross-references the source suggests

Commentary note frontmatter:
  type: commentary, commentary.author: "Name", commentary.tradition: "Reformed/etc",
  chapter: "[[bibles/NASB-IL/Book/Book N]]", up: "[[commentaries/source/-- Index --]]",
  tags: [commentary, commentary/tradition]

The commentary body should have:
- H2 sections matching the pericope structure of the chapter
- Key insights with wikilinks to concept notes and other passages
- Original language observations with [[HXXX]] / [[GXXX]] links""",
        "tools": TOOL_DECLARATIONS,
    },

    "reflection": {
        "system": """You are the Reflection agent. You help the user process personal reflections
and connect them to the vault's knowledge graph.

When the user shares a reflection:
1. Identify the Bible passage(s) referenced
2. Create a reflection note at reflections/YYYY-MM-DD-{topic}.md
3. Link it to the relevant chapter, concept notes, and themes
4. Update the chapter's frontmatter with: reflection: "[[path]]"
5. Look for connections to other reflections and passages

Reflection note frontmatter:
  type: reflection, date: YYYY-MM-DD, passage: "[[bibles/NASB-IL/Book/Book N]]",
  themes: [wikilinks to theme MOCs], key.terms: [wikilinks to Strong's],
  up: "[[reflections/-- Reflections --]]", tags: [reflection, journal]

The reflection body should:
- Quote the relevant verse text
- Capture the user's insight in their own words
- Add connections discovered via graph traversal
- Suggest related passages for further study

This implements Ars Contexta's 'reduce' phase — extracting structured knowledge
from raw reflection into the interconnected graph.""",
        "tools": TOOL_DECLARATIONS,
    },

    "healer": {
        "system": """You are the Vault Healer agent. You recursively identify and fix structural issues.

Your healing operations:
1. Find orphan notes (no incoming links)
2. Find broken links (targets that don't exist)
3. Find missing frontmatter fields
4. Find inconsistent tags
5. Find Strong's numbers referenced in interlinear but missing from strongs/
6. Find concept notes referenced but not created
7. Find chapters missing breadcrumbs (up/next/prev)
8. Suggest new cross-references based on shared Strong's numbers

For each issue found:
- Classify severity (critical/warning/info)
- Fix automatically if safe (missing tags, broken paths)
- Report issues that need human review

Use search_vault and get_backlinks to find orphans.
Use traverse_graph to verify connectivity.
Use update_frontmatter to fix metadata issues.

After healing, create a report at ops/health/YYYY-MM-DD-health.md with:
  type: health-report, date: YYYY-MM-DD, issues.found: N, issues.fixed: N,
  issues.remaining: N""",
        "tools": TOOL_DECLARATIONS,
    },

    "hermeneutics": {
        "system": """You are the Hermeneutics agent. You add grammatico-historical context to passages.

When analyzing a passage:
1. Read the chapter note and its interlinear data
2. Identify the literary genre (from frontmatter: genre)
3. Add hermeneutic metadata to frontmatter:
   - hermeneutic.genre: specific sub-genre (e.g., "creation-hymn", "lament-psalm")
   - hermeneutic.form: literary form (chiasm, inclusio, acrostic, etc.)
   - hermeneutic.sitz: historical setting ("exilic", "post-exilic", "Solomonic")
   - hermeneutic.audience: original audience
   - hermeneutic.rhetoric: rhetorical strategy

4. Analyze chiastic structures if present:
   - hermeneutic.chiasm.center: "v{N}" (the pivot verse)
   - hermeneutic.chiasm.structure: "A-B-C-B'-A'"

5. Note intertextual allusions beyond explicit cross-refs
6. Add discourse markers and paragraph-level structure notes

This enriches the vault for advanced retrieval — queries like
"find all chiastic passages in the Psalms" become possible via
search_frontmatter(key="hermeneutic.form", value="chiasm").""",
        "tools": TOOL_DECLARATIONS,
    },
}


# ──────────────────────────────────────────────
# Agent Execution
# ──────────────────────────────────────────────

def run_agent(agent_name: str, user_message: str, max_turns: int = 10) -> str:
    """Run a single agent with function-calling loop."""
    agent = AGENTS[agent_name]
    tools = [types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters=t["parameters"],
        ) for t in agent["tools"]
    ])]

    config = types.GenerateContentConfig(
        system_instruction=agent["system"],
        tools=tools,
        temperature=0.3,
    )

    contents = [types.Content(
        role="user",
        parts=[types.Part(text=user_message)]
    )]

    for turn in range(max_turns):
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=config,
        )

        # Check for function calls
        has_fc = False
        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                if part.function_call:
                    has_fc = True
                    break

        if not has_fc:
            # No function calls — return the text response
            return response.text or ""

        # Process function calls
        contents.append(response.candidates[0].content)

        fc_responses = []
        for part in response.candidates[0].content.parts:
            if part.function_call:
                fn_name = part.function_call.name
                fn_args = dict(part.function_call.args) if part.function_call.args else {}

                if fn_name in TOOL_FUNCTIONS:
                    try:
                        result = TOOL_FUNCTIONS[fn_name](**fn_args)
                    except Exception as e:
                        result = {"error": str(e)}
                else:
                    result = {"error": f"Unknown function: {fn_name}"}

                fc_responses.append(types.Part(
                    function_response=types.FunctionResponse(
                        name=fn_name,
                        response=result,
                    )
                ))

        contents.append(types.Content(role="user", parts=fc_responses))

    return "[Agent reached max turns without completing]"


def route_and_run(user_message: str, mode: str = "query") -> str:
    """Route a request to the appropriate agent(s) and return the combined response."""

    if mode == "heal":
        return run_agent("healer", "Perform a full health check on the vault. Find and fix issues.")

    if mode == "ingest":
        return run_agent("commentary", user_message)

    if mode == "reflect":
        return run_agent("reflection", user_message)

    if mode == "hermeneutics":
        return run_agent("hermeneutics", user_message)

    if mode == "build":
        return run_agent("concept_builder", user_message)

    # Default: orchestrator decides, but for efficiency, use traversal for questions
    if "?" in user_message or any(kw in user_message.lower() for kw in
            ["how", "what", "where", "why", "explain", "connect", "relate", "trace", "find"]):
        return run_agent("traversal", user_message)

    return run_agent("orchestrator", user_message)


# ──────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Bible Vault Agent Graph")
    parser.add_argument("message", nargs="?", help="Query or instruction")
    parser.add_argument("--mode", choices=["query", "ingest", "reflect", "heal", "hermeneutics", "build"],
                        default="query", help="Agent mode")
    parser.add_argument("--source", help="Path to source file (for ingest mode)")
    parser.add_argument("--passage", help="Bible passage reference (for reflect/hermeneutics)")
    parser.add_argument("--agent", help="Run a specific agent directly")
    parser.add_argument("--max-turns", type=int, default=10, help="Max function-calling turns")
    args = parser.parse_args()

    if not os.environ.get("GEMINI_API_KEY"):
        print("Set GEMINI_API_KEY environment variable")
        sys.exit(1)

    # Build the message
    if args.source:
        source_path = args.source
        message = f"Ingest this source and integrate it into the vault: {source_path}"
    elif args.passage:
        message = f"Analyze this passage: {args.passage}"
        if args.message:
            message += f"\n\nUser's reflection: {args.message}"
    elif args.message:
        message = args.message
    else:
        print("Provide a message, --source, or --passage")
        sys.exit(1)

    # Run
    if args.agent:
        if args.agent not in AGENTS:
            print(f"Unknown agent: {args.agent}. Available: {list(AGENTS.keys())}")
            sys.exit(1)
        result = run_agent(args.agent, message, args.max_turns)
    else:
        result = route_and_run(message, args.mode)

    print(result)


if __name__ == "__main__":
    main()
