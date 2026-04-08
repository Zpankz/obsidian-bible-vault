"""
Vault operation tools — function-calling tool definitions for Gemini agents.
Each tool reads/writes the Obsidian vault file system and parses frontmatter.
"""

import re, yaml, os
from pathlib import Path
from typing import Optional

VAULT = Path(os.environ.get("VAULT_PATH", "/Users/mikhail/obsidian/book"))


# ── File Operations ──

def read_note(path: str) -> dict:
    """Read a vault note and return its frontmatter and body separately."""
    full = VAULT / path if not path.endswith(".md") else VAULT / path
    if not full.suffix:
        full = full.with_suffix(".md")
    if not full.exists():
        return {"error": f"Note not found: {path}"}
    content = full.read_text(encoding="utf-8", errors="replace")
    fm, body = parse_frontmatter(content)
    return {"path": str(full.relative_to(VAULT)), "frontmatter": fm, "body": body[:2000]}


def write_note(path: str, frontmatter: dict, body: str) -> dict:
    """Write a note with YAML frontmatter and markdown body."""
    full = VAULT / path
    if not full.suffix:
        full = full.with_suffix(".md")
    full.parent.mkdir(parents=True, exist_ok=True)
    fm_str = yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False).rstrip()
    content = f"---\n{fm_str}\n---\n\n{body}"
    full.write_text(content, encoding="utf-8")
    return {"written": str(full.relative_to(VAULT)), "size": len(content)}


def append_to_note(path: str, content: str) -> dict:
    """Append content to an existing note."""
    full = VAULT / path
    if not full.suffix:
        full = full.with_suffix(".md")
    if not full.exists():
        return {"error": f"Note not found: {path}"}
    existing = full.read_text(encoding="utf-8")
    full.write_text(existing.rstrip() + "\n\n" + content, encoding="utf-8")
    return {"appended_to": str(full.relative_to(VAULT)), "added_bytes": len(content)}


def update_frontmatter(path: str, updates: dict) -> dict:
    """Update specific frontmatter keys without rewriting the body."""
    full = VAULT / path
    if not full.suffix:
        full = full.with_suffix(".md")
    if not full.exists():
        return {"error": f"Note not found: {path}"}
    content = full.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(content)
    fm.update(updates)
    fm_str = yaml.dump(fm, allow_unicode=True, default_flow_style=False).rstrip()
    full.write_text(f"---\n{fm_str}\n---\n\n{body}", encoding="utf-8")
    return {"updated": str(full.relative_to(VAULT)), "keys": list(updates.keys())}


# ── Search Operations ──

def search_vault(query: str, scope: str = "bibles/NASB-IL") -> dict:
    """Search vault notes by content or frontmatter. Returns matching paths."""
    results = []
    search_dir = VAULT / scope
    if not search_dir.exists():
        return {"error": f"Scope not found: {scope}", "results": []}
    for f in search_dir.rglob("*.md"):
        content = f.read_text(encoding="utf-8", errors="replace")
        if query.lower() in content.lower():
            results.append(str(f.relative_to(VAULT)))
            if len(results) >= 20:
                break
    return {"query": query, "scope": scope, "count": len(results), "results": results}


def search_frontmatter(key: str, value: str, scope: str = "bibles/NASB-IL") -> dict:
    """Search for notes where a frontmatter key matches a value."""
    results = []
    search_dir = VAULT / scope
    if not search_dir.exists():
        return {"error": f"Scope not found: {scope}", "results": []}
    for f in search_dir.rglob("*.md"):
        content = f.read_text(encoding="utf-8", errors="replace")
        fm, _ = parse_frontmatter(content)
        if key in fm and str(value).lower() in str(fm[key]).lower():
            results.append(str(f.relative_to(VAULT)))
            if len(results) >= 20:
                break
    return {"key": key, "value": value, "count": len(results), "results": results}


# ── Graph Operations ──

def get_outgoing_links(path: str) -> dict:
    """Get all wikilinks from a note (outgoing edges in the graph)."""
    full = VAULT / path
    if not full.suffix:
        full = full.with_suffix(".md")
    if not full.exists():
        return {"error": f"Note not found: {path}"}
    content = full.read_text(encoding="utf-8", errors="replace")
    links = re.findall(r'\[\[([^|\]\n]+?)(?:\|[^\]\n]*)?\]\]', content)
    unique = list(dict.fromkeys(links))  # dedupe preserving order
    return {"source": path, "links": unique[:50], "total": len(links)}


def get_backlinks(path: str, scope: str = "bibles/NASB-IL") -> dict:
    """Find all notes that link TO the given path (incoming edges)."""
    target_stem = Path(path).stem
    results = []
    search_dir = VAULT / scope
    for f in search_dir.rglob("*.md"):
        content = f.read_text(encoding="utf-8", errors="replace")
        if f"[[{path}" in content or f"[[{target_stem}" in content or f"[[{target_stem}|" in content:
            results.append(str(f.relative_to(VAULT)))
            if len(results) >= 30:
                break
    return {"target": path, "backlinks": results, "count": len(results)}


def traverse_graph(start: str, edge_type: str = "cross.refs", depth: int = 2) -> dict:
    """Multi-hop graph traversal from a starting note, following a specific edge type."""
    visited = set()
    frontier = [start]
    hops = []

    for d in range(depth):
        next_frontier = []
        for node in frontier:
            if node in visited:
                continue
            visited.add(node)
            full = VAULT / node
            if not full.suffix:
                full = full.with_suffix(".md")
            if not full.exists():
                continue
            content = full.read_text(encoding="utf-8", errors="replace")
            fm, _ = parse_frontmatter(content)

            # Extract links from the specified edge type
            edge_val = fm.get(edge_type, [])
            if isinstance(edge_val, str):
                edge_val = [edge_val]
            if isinstance(edge_val, list):
                for link in edge_val:
                    targets = re.findall(r'\[\[([^|\]\n]+?)(?:\|[^\]\n]*)?\]\]', str(link))
                    for t in targets:
                        clean = t.split("#")[0]
                        if clean not in visited:
                            next_frontier.append(clean)
                            hops.append({"from": node, "to": clean, "depth": d + 1, "via": edge_type})

        frontier = next_frontier
        if not frontier:
            break

    return {"start": start, "edge_type": edge_type, "depth": depth,
            "visited": list(visited), "hops": hops, "nodes_reached": len(visited)}


# ── Strong's Operations ──

def lookup_strongs(strongs_id: str) -> dict:
    """Look up a Strong's dictionary entry."""
    prefix = strongs_id[0]  # H or G
    subdir = "hebrew" if prefix == "H" else "greek"
    path = VAULT / "strongs" / subdir / f"{strongs_id}.md"
    if not path.exists():
        return {"error": f"Strong's entry not found: {strongs_id}"}
    content = path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(content)
    return {"id": strongs_id, "frontmatter": fm, "body": body[:500]}


def find_verses_with_strongs(strongs_id: str, limit: int = 10) -> dict:
    """Find verses that contain a specific Strong's number in their interlinear."""
    results = []
    for f in (VAULT / "bibles/NASB-IL").rglob("*.md"):
        if f.name.startswith("--"):
            continue
        content = f.read_text(encoding="utf-8", errors="replace")
        if f"[[{strongs_id}]]" in content:
            results.append(str(f.relative_to(VAULT)))
            if len(results) >= limit:
                break
    return {"strongs": strongs_id, "verses": results, "count": len(results)}


# ── Helpers ──

def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Split markdown into frontmatter dict and body string."""
    if not content.startswith("---"):
        return {}, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        fm = {}
    return fm, parts[2].strip()


def list_directory(path: str) -> dict:
    """List files in a vault directory."""
    full = VAULT / path
    if not full.exists():
        return {"error": f"Directory not found: {path}"}
    files = [str(f.relative_to(VAULT)) for f in full.iterdir() if f.is_file() and f.suffix == ".md"]
    dirs = [str(d.relative_to(VAULT)) for d in full.iterdir() if d.is_dir()]
    return {"path": path, "files": files[:50], "directories": dirs, "file_count": len(files)}


# ── Tool Registry for Gemini Function Calling ──

TOOL_FUNCTIONS = {
    "read_note": read_note,
    "write_note": write_note,
    "append_to_note": append_to_note,
    "update_frontmatter": update_frontmatter,
    "search_vault": search_vault,
    "search_frontmatter": search_frontmatter,
    "get_outgoing_links": get_outgoing_links,
    "get_backlinks": get_backlinks,
    "traverse_graph": traverse_graph,
    "lookup_strongs": lookup_strongs,
    "find_verses_with_strongs": find_verses_with_strongs,
    "list_directory": list_directory,
}

TOOL_DECLARATIONS = [
    {"name": "read_note", "description": "Read a vault note, returning frontmatter and body", "parameters": {"type": "object", "properties": {"path": {"type": "string", "description": "Vault-relative path to the note"}}, "required": ["path"]}},
    {"name": "write_note", "description": "Write a new note with frontmatter and body", "parameters": {"type": "object", "properties": {"path": {"type": "string"}, "frontmatter": {"type": "object"}, "body": {"type": "string"}}, "required": ["path", "frontmatter", "body"]}},
    {"name": "append_to_note", "description": "Append content to an existing note", "parameters": {"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]}},
    {"name": "update_frontmatter", "description": "Update specific frontmatter keys on an existing note", "parameters": {"type": "object", "properties": {"path": {"type": "string"}, "updates": {"type": "object"}}, "required": ["path", "updates"]}},
    {"name": "search_vault", "description": "Full-text search across vault notes", "parameters": {"type": "object", "properties": {"query": {"type": "string"}, "scope": {"type": "string", "description": "Directory to search in (default: bibles/NASB-IL)"}}, "required": ["query"]}},
    {"name": "search_frontmatter", "description": "Search notes by frontmatter key-value match", "parameters": {"type": "object", "properties": {"key": {"type": "string"}, "value": {"type": "string"}, "scope": {"type": "string"}}, "required": ["key", "value"]}},
    {"name": "get_outgoing_links", "description": "Get all wikilinks from a note", "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "get_backlinks", "description": "Find all notes that link to a given path", "parameters": {"type": "object", "properties": {"path": {"type": "string"}, "scope": {"type": "string"}}, "required": ["path"]}},
    {"name": "traverse_graph", "description": "Multi-hop graph traversal following a frontmatter edge type", "parameters": {"type": "object", "properties": {"start": {"type": "string"}, "edge_type": {"type": "string", "description": "Frontmatter key to follow (e.g. cross.refs, key.terms)"}, "depth": {"type": "integer", "description": "Max hops (default 2)"}}, "required": ["start"]}},
    {"name": "lookup_strongs", "description": "Look up a Strong's dictionary entry by ID (H7225, G3056)", "parameters": {"type": "object", "properties": {"strongs_id": {"type": "string"}}, "required": ["strongs_id"]}},
    {"name": "find_verses_with_strongs", "description": "Find Bible chapters containing a Strong's number", "parameters": {"type": "object", "properties": {"strongs_id": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["strongs_id"]}},
    {"name": "list_directory", "description": "List files and subdirectories in a vault path", "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
]
