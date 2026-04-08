# Bible Vault Agent Graph

An agentic system powered by **Gemini 3.1 Flash Lite** that operates on the Obsidian Bible vault. Six specialized agents collaborate to traverse the knowledge graph, build concepts, ingest commentaries, process reflections, analyze hermeneutics, and heal structural issues.

## Architecture

```
                    ┌─────────────┐
                    │ Orchestrator│
                    │   (router)  │
                    └──────┬──────┘
           ┌───────┬───────┼───────┬──────────┐
           ▼       ▼       ▼       ▼          ▼
      ┌─────────┐ ┌─────┐ ┌──────┐ ┌────────┐ ┌──────┐
      │Traversal│ │Build│ │Commen│ │Reflect │ │Healer│
      │ Agent   │ │Agent│ │tary  │ │Agent   │ │Agent │
      └────┬────┘ └──┬──┘ └──┬───┘ └───┬────┘ └──┬───┘
           │         │       │         │          │
           └─────────┴───────┴─────────┴──────────┘
                          │
                    ┌─────┴──────┐
                    │ Vault Tools│
                    │ (12 tools) │
                    └────────────┘
```

## Agents

| Agent | Role | Ars Contexta Phase |
|-------|------|--------------------|
| **Orchestrator** | Routes requests to specialists | — |
| **Traversal** | Multi-hop graph queries, cross-testament connections | reflect |
| **Concept Builder** | Creates Strong's stubs, concept notes, theme MOCs | reweave |
| **Commentary** | Ingests external sources, creates commentary layers | reduce |
| **Reflection** | Processes personal reflections, connects to graph | reduce |
| **Healer** | Finds and fixes structural issues | verify |
| **Hermeneutics** | Adds grammatico-historical analysis | reweave |

## Tools (Function Calling)

Each agent has access to 12 vault operation tools:

| Tool | Description |
|------|-------------|
| `read_note` | Read a note's frontmatter and body |
| `write_note` | Create a new note |
| `append_to_note` | Add content to an existing note |
| `update_frontmatter` | Update specific frontmatter keys |
| `search_vault` | Full-text search across notes |
| `search_frontmatter` | Query notes by frontmatter fields |
| `get_outgoing_links` | Get all wikilinks from a note |
| `get_backlinks` | Find all notes linking to a target |
| `traverse_graph` | Multi-hop traversal following edge types |
| `lookup_strongs` | Look up a Strong's dictionary entry |
| `find_verses_with_strongs` | Find chapters containing a Strong's number |
| `list_directory` | List files in a vault directory |

## Quick Start

```bash
pip install google-genai pyyaml
export GEMINI_API_KEY=your-key

# Ask a question (uses Traversal agent)
python agent_graph.py "How does Paul's concept of 'new creation' in 2 Corinthians 5:17 connect to Genesis 1?"

# Ingest a commentary
python agent_graph.py --mode=ingest --source=commentaries/raw/my-commentary.md

# Process a personal reflection
python agent_graph.py --mode=reflect --passage="Psalm 23" "The Lord as shepherd connects to John 10..."

# Run vault health check
python agent_graph.py --mode=heal

# Add hermeneutic analysis
python agent_graph.py --mode=hermeneutics --passage="Genesis 1:1-2:3"

# Build missing concept notes
python agent_graph.py --mode=build "Create concept notes for all Strong's numbers in Romans 8"
```

## Pipeline (Ars Contexta Cycle)

The pipeline implements the reduce/reflect/reweave cycle:

```bash
# Full cycle on a new source
python pipeline.py cycle --source=commentaries/raw/source.md --passage="Romans 8"

# Individual stages
python pipeline.py reduce --source=commentaries/raw/article.md
python pipeline.py reflect --passage="John 1:1-18"
python pipeline.py reflect --passage="Psalm 51" --reflection="David's repentance mirrors..."
python pipeline.py reweave --scope="bibles/NASB-IL/Genesis"
python pipeline.py hermeneutics --passage="Isaiah 52:13-53:12"
python pipeline.py heal
```

### Pipeline Stages

```
Source Material
      │
      ▼
  ┌──────┐     Extract structured insights,
  │REDUCE│     create commentary notes,
  └──┬───┘     link to passages
     │
     ▼
 ┌───────┐     Find graph connections,
 │REFLECT│     process reflections,
 └──┬────┘     multi-hop traversal
    │
    ▼
 ┌───────┐     Update existing notes,
 │REWEAVE│     create missing stubs,
 └──┬────┘     enrich frontmatter
    │
    ▼
  ┌────┐       Check integrity,
  │HEAL│       fix broken links,
  └────┘       report health
```

## Vault Extensions

The agent system adds content to these vault directories:

```
vault/
  ops/
    health/          Health check reports
    sessions/        Agent session logs
    queue/           Pending tasks
    observations/    Structural observations
  reflections/       Personal reflection notes
  commentaries/
    raw/             Source material for ingestion
    {author}/        Processed commentary notes
```

## Graph Traversal Examples

### Multi-hop query: "Image of God across testaments"

```
Genesis 1:26 ──cross.refs──→ Colossians 3:10
     │                            │
  key.terms                    key.terms
     │                            │
     ▼                            ▼
   H6754 (tselem) ─related─→ G1504 (eikon)
     │                            │
  concept                      concept
     │                            │
     ▼                            ▼
  Imago Dei ──related.themes──→ Christology
```

### Lexical bridge: Hebrew chesed → Greek charis

```
H2617 (chesed) → concepts/hebrew/H2617 - chesed
     │
  lxx-equivalent
     │
     ▼
G5485 (charis) → concepts/greek/G5485 - charis
     │
  find_verses_with_strongs
     │
     ▼
Ephesians 2:8, Romans 3:24, John 1:14...
```

## Extensibility

### Adding a new commentary

1. Drop the raw text into `commentaries/raw/`
2. Run `python pipeline.py reduce --source=commentaries/raw/new-source.md`
3. The agent creates structured commentary notes and links them to chapters

### Adding hermeneutic layers

1. Run `python pipeline.py hermeneutics --passage="Genesis 1:1-2:3"`
2. The agent adds to frontmatter: `hermeneutic.genre`, `hermeneutic.form`, `hermeneutic.sitz`, etc.
3. These become queryable: `search_frontmatter("hermeneutic.form", "chiasm")`

### Batch processing

```python
from agent_graph import run_agent

# Process all Psalms for chiastic structure
for psalm in range(1, 151):
    run_agent("hermeneutics", f"Analyze Psalm {psalm} for literary structure and chiasm")
```
