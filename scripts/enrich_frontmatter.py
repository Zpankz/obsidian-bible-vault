#!/usr/bin/env python3
"""
Enrich vault frontmatter with breadcrumbs navigation fields,
wikilink-types compatible cross-ref keys, and smart-connections metadata.
"""

import re
from pathlib import Path

BASE = Path("/Users/mikhail/obsidian/book")
NASB_IL = BASE / "bibles/NASB-IL"

BOOKS = [
    (1, "Genesis", 50, "Torah"), (2, "Exodus", 40, "Torah"),
    (3, "Leviticus", 27, "Torah"), (4, "Numbers", 36, "Torah"),
    (5, "Deuteronomy", 34, "Torah"), (6, "Joshua", 24, "Historical"),
    (7, "Judges", 21, "Historical"), (8, "Ruth", 4, "Historical"),
    (9, "1 Samuel", 31, "Historical"), (10, "2 Samuel", 24, "Historical"),
    (11, "1 Kings", 22, "Historical"), (12, "2 Kings", 25, "Historical"),
    (13, "1 Chronicles", 29, "Historical"), (14, "2 Chronicles", 36, "Historical"),
    (15, "Ezra", 10, "Historical"), (16, "Nehemiah", 13, "Historical"),
    (17, "Esther", 10, "Historical"), (18, "Job", 42, "Wisdom"),
    (19, "Psalms", 150, "Wisdom"), (20, "Proverbs", 31, "Wisdom"),
    (21, "Ecclesiastes", 12, "Wisdom"), (22, "Song of Solomon", 8, "Wisdom"),
    (23, "Isaiah", 66, "Major Prophets"), (24, "Jeremiah", 52, "Major Prophets"),
    (25, "Lamentations", 5, "Major Prophets"), (26, "Ezekiel", 48, "Major Prophets"),
    (27, "Daniel", 12, "Major Prophets"), (28, "Hosea", 14, "Minor Prophets"),
    (29, "Joel", 3, "Minor Prophets"), (30, "Amos", 9, "Minor Prophets"),
    (31, "Obadiah", 1, "Minor Prophets"), (32, "Jonah", 4, "Minor Prophets"),
    (33, "Micah", 7, "Minor Prophets"), (34, "Nahum", 3, "Minor Prophets"),
    (35, "Habakkuk", 3, "Minor Prophets"), (36, "Zephaniah", 3, "Minor Prophets"),
    (37, "Haggai", 2, "Minor Prophets"), (38, "Zechariah", 14, "Minor Prophets"),
    (39, "Malachi", 4, "Minor Prophets"), (40, "Matthew", 28, "Gospels"),
    (41, "Mark", 16, "Gospels"), (42, "Luke", 24, "Gospels"),
    (43, "John", 21, "Gospels"), (44, "Acts", 28, "Acts"),
    (45, "Romans", 16, "Pauline"), (46, "1 Corinthians", 16, "Pauline"),
    (47, "2 Corinthians", 13, "Pauline"), (48, "Galatians", 6, "Pauline"),
    (49, "Ephesians", 6, "Pauline"), (50, "Philippians", 4, "Pauline"),
    (51, "Colossians", 4, "Pauline"), (52, "1 Thessalonians", 5, "Pauline"),
    (53, "2 Thessalonians", 3, "Pauline"), (54, "1 Timothy", 6, "Pauline"),
    (55, "2 Timothy", 4, "Pauline"), (56, "Titus", 3, "Pauline"),
    (57, "Philemon", 1, "Pauline"), (58, "Hebrews", 13, "General"),
    (59, "James", 5, "General"), (60, "1 Peter", 5, "General"),
    (61, "2 Peter", 3, "General"), (62, "1 John", 5, "General"),
    (63, "2 John", 1, "General"), (64, "3 John", 1, "General"),
    (65, "Jude", 1, "General"), (66, "Revelation", 22, "Apocalyptic"),
]

NUM_TO_BOOK = {b[0]: b for b in BOOKS}


def add_breadcrumbs_to_chapter(filepath: Path, book_num: int, book_name: str,
                                chapter: int, total_chapters: int) -> bool:
    """Add breadcrumbs up/next/prev fields to chapter frontmatter."""
    content = filepath.read_text(encoding="utf-8")
    if "bc-up:" in content or "up:" in content:
        return False  # Already has breadcrumbs

    # Split frontmatter
    parts = content.split("---", 2)
    if len(parts) < 3:
        return False

    fm = parts[1]

    # Build breadcrumbs fields
    bc_fields = []

    # up: points to book index
    bc_fields.append(f'up: "[[bibles/NASB-IL/{book_name}/-- {book_name} --]]"')

    # next/prev chapters
    if chapter > 1:
        bc_fields.append(f'prev: "[[bibles/NASB-IL/{book_name}/{book_name} {chapter - 1}]]"')
    elif book_num > 1:
        prev_book = NUM_TO_BOOK[book_num - 1]
        prev_name = prev_book[1]
        prev_last = prev_book[2]
        bc_fields.append(f'prev: "[[bibles/NASB-IL/{prev_name}/{prev_name} {prev_last}]]"')

    if chapter < total_chapters:
        bc_fields.append(f'next: "[[bibles/NASB-IL/{book_name}/{book_name} {chapter + 1}]]"')
    elif book_num < 66:
        next_book = NUM_TO_BOOK[book_num + 1]
        next_name = next_book[1]
        bc_fields.append(f'next: "[[bibles/NASB-IL/{next_name}/{next_name} 1]]"')

    # Insert after the last existing frontmatter line
    fm_lines = fm.rstrip("\n").split("\n")
    fm_lines.extend(bc_fields)

    new_content = "---" + "\n".join(fm_lines) + "\n---" + parts[2]
    filepath.write_text(new_content, encoding="utf-8")
    return True


def add_breadcrumbs_to_book_index(filepath: Path, book_name: str, section: str) -> bool:
    """Add breadcrumbs up field to book index (points to Bible index)."""
    content = filepath.read_text(encoding="utf-8")
    if "up:" in content:
        return False

    parts = content.split("---", 2)
    if len(parts) < 3:
        return False

    fm = parts[1]
    fm_lines = fm.rstrip("\n").split("\n")
    fm_lines.append(f'up: "[[bibles/NASB-IL/-- Bible --]]"')

    # Add down links to first and last chapters
    fm_lines.append(f'down: "[[bibles/NASB-IL/{book_name}/{book_name} 1]]"')

    new_content = "---" + "\n".join(fm_lines) + "\n---" + parts[2]
    filepath.write_text(new_content, encoding="utf-8")
    return True


def add_breadcrumbs_to_bible_index(filepath: Path) -> bool:
    """Add breadcrumbs down links to Bible index."""
    content = filepath.read_text(encoding="utf-8")
    if "down:" in content:
        return False

    parts = content.split("---", 2)
    if len(parts) < 3:
        return False

    fm = parts[1]
    fm_lines = fm.rstrip("\n").split("\n")

    # Add down links to all books
    down_links = []
    for b in BOOKS:
        down_links.append(f'  - "[[bibles/NASB-IL/{b[1]}/-- {b[1]} --]]"')

    fm_lines.append("down:")
    fm_lines.extend(down_links)

    new_content = "---" + "\n".join(fm_lines) + "\n---" + parts[2]
    filepath.write_text(new_content, encoding="utf-8")
    return True


def add_smart_connections_tags(filepath: Path) -> bool:
    """Add tags for smart-connections semantic grouping."""
    content = filepath.read_text(encoding="utf-8")
    if "tags:" in content:
        return False

    parts = content.split("---", 2)
    if len(parts) < 3:
        return False

    fm = parts[1]

    # Extract genre and section from existing frontmatter
    genre_m = re.search(r'genre:\s*"?(\w+)"?', fm)
    section_m = re.search(r'section:\s*"?([^"\n]+)"?', fm)
    testament_m = re.search(r'testament:\s*(\w+)', fm)

    tags = []
    if testament_m:
        tags.append(f"bible/{testament_m.group(1).lower()}")
    if section_m:
        tags.append(f"bible/{section_m.group(1).strip().lower().replace(' ', '-')}")
    if genre_m:
        tags.append(f"genre/{genre_m.group(1).strip().lower()}")

    if not tags:
        return False

    fm_lines = fm.rstrip("\n").split("\n")
    fm_lines.append("tags:")
    for t in tags:
        fm_lines.append(f'  - "{t}"')

    new_content = "---" + "\n".join(fm_lines) + "\n---" + parts[2]
    filepath.write_text(new_content, encoding="utf-8")
    return True


def main():
    updated = 0

    # Enrich Bible index
    bible_idx = NASB_IL / "-- Bible --.md"
    if bible_idx.exists():
        if add_breadcrumbs_to_bible_index(bible_idx):
            updated += 1
            print("Updated Bible index with breadcrumbs")

    # Enrich book indexes
    for book_num, name, total_chapters, section in BOOKS:
        book_idx = NASB_IL / name / f"-- {name} --.md"
        if book_idx.exists():
            if add_breadcrumbs_to_book_index(book_idx, name, section):
                updated += 1

    print(f"Updated {updated} book indexes")
    updated_chapters = 0

    # Enrich chapter files
    for book_num, name, total_chapters, section in BOOKS:
        for chapter in range(1, total_chapters + 1):
            ch_path = NASB_IL / name / f"{name} {chapter}.md"
            if ch_path.exists():
                changed = False
                if add_breadcrumbs_to_chapter(ch_path, book_num, name, chapter, total_chapters):
                    changed = True
                if add_smart_connections_tags(ch_path):
                    changed = True
                if changed:
                    updated_chapters += 1

    print(f"Updated {updated_chapters} chapter files with breadcrumbs + tags")

    # Enrich concept notes with tags
    concept_updated = 0
    for concept_dir in ["hebrew", "greek"]:
        for f in (BASE / "concepts" / concept_dir).glob("*.md"):
            content = f.read_text()
            if "tags:" not in content:
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    fm = parts[1]
                    fm_lines = fm.rstrip("\n").split("\n")
                    fm_lines.append("tags:")
                    fm_lines.append(f'  - "concept/{concept_dir}"')
                    fm_lines.append(f'  - "strongs"')
                    new_content = "---" + "\n".join(fm_lines) + "\n---" + parts[2]
                    f.write_text(new_content)
                    concept_updated += 1

    for f in (BASE / "concepts/themes").glob("*.md"):
        content = f.read_text()
        if "tags:" not in content:
            parts = content.split("---", 2)
            if len(parts) >= 3:
                fm = parts[1]
                fm_lines = fm.rstrip("\n").split("\n")
                fm_lines.append("tags:")
                fm_lines.append(f'  - "concept/theme"')
                fm_lines.append(f'  - "moc"')
                new_content = "---" + "\n".join(fm_lines) + "\n---" + parts[2]
                f.write_text(new_content)
                concept_updated += 1

    print(f"Updated {concept_updated} concept notes with tags")
    print(f"\nTotal files updated: {updated + updated_chapters + concept_updated}")


if __name__ == "__main__":
    main()
