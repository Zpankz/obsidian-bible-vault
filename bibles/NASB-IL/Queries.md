---
type: queries
---

# NASB-IL Datacore Queries

Example queries for exploring the interlinear Bible vault using Datacore.

## All chapters mentioning Elohim

```datacore
TABLE book.name, chapter, verses.total
FROM "bibles/NASB-IL"
WHERE type = "chapter" AND contains(key.terms, "[[concepts/hebrew/H430 - Elohim]]")
SORT book.number, chapter
```

## Torah chapters by pericope count

```datacore
TABLE book.name, chapter, pericopes.count, verses.total
FROM "bibles/NASB-IL"
WHERE type = "chapter" AND section = "Torah"
SORT pericopes.count DESC
```

## All Gospel chapters

```datacore
TABLE book.name, chapter, verses.total
FROM "bibles/NASB-IL"
WHERE type = "chapter" AND section = "Gospels"
SORT book.number, chapter
```

## Chapters with most cross-references

```datacore
TABLE book.name, chapter, length(file.outlinks) as xrefs
FROM "bibles/NASB-IL"
WHERE type = "chapter"
SORT xrefs DESC
LIMIT 20
```

## Books by section

```datacore
TABLE book.name, chapters.total, genre, testament
FROM "bibles/NASB-IL"
WHERE type = "book"
SORT book.number
```

## Find all chapters referencing a concept

Replace `H2617` with any Strong's number:

```datacore
TABLE book.name, chapter
FROM "bibles/NASB-IL"
WHERE type = "chapter" AND contains(key.terms, "chesed")
SORT book.number, chapter
```

## Poetry vs Narrative chapters

```datacore
TABLE genre, count(rows) as chapters
FROM "bibles/NASB-IL"
WHERE type = "chapter"
GROUP BY genre
SORT chapters DESC
```
