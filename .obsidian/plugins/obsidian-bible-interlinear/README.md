# Bible Interlinear

Interlinear Bible study with Hebrew/Greek Strong's numbers, cross-references, and inline reference detection for Obsidian.

Bible Interlinear consolidates three previously separate workflows into a single plugin:

- **ling-gloss** -- linguistic interlinear glossing (`gloss`/`ngloss` code blocks)
- **local-bible-ref** -- inline Bible reference detection and linking
- **My Bible** -- verse text rendering from a local cache

The result is a unified system for reading Scripture in its original languages, navigating cross-references, and embedding verse text -- all wired into the Obsidian graph through wikilinks, frontmatter, and Strong's dictionary notes.

---

## Table of Contents

- [Installation](#installation)
- [Features](#features)
  - [Interlinear Code Block](#interlinear-code-block)
  - [Quick Verse Insertion](#quick-verse-insertion)
  - [Gloss Backward Compatibility](#gloss-backward-compatibility)
  - [Inline Reference Detection](#inline-reference-detection)
  - [Editor Suggest](#editor-suggest)
  - [Strong's Number Linking](#strongs-number-linking)
  - [Cross-Reference Display](#cross-reference-display)
- [Settings](#settings)
- [Vault Structure](#vault-structure)
- [Frontmatter Schema](#frontmatter-schema)
- [Integration with Other Plugins](#integration-with-other-plugins)
- [Extending the Vault](#extending-the-vault)
- [Mobile Support](#mobile-support)
- [API Reference](#api-reference)
- [Development](#development)
- [Credits](#credits)

---

## Installation

### BRAT (Recommended for beta testing)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the Obsidian community plugin browser.
2. Open BRAT settings and select **Add Beta plugin**.
3. Enter the repository URL for obsidian-bible-interlinear.
4. Enable the plugin in Settings > Community plugins.

### Manual Install

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Create the folder `.obsidian/plugins/obsidian-bible-interlinear/` in your vault.
3. Copy the downloaded files into that folder.
4. Restart Obsidian and enable **Bible Interlinear** in Settings > Community plugins.

### Building from Source

```bash
cd /path/to/vault/.obsidian/plugins/obsidian-bible-interlinear
npm install
npm run build
```

This produces `main.js` via esbuild. For development with auto-rebuild on save:

```bash
npm run dev
```

---

## Features

### Interlinear Code Block

The `bible-interlinear` code block renders verse text alongside its Hebrew or Greek original, with word-by-word alignment, Strong's number links, transliteration, and English glosses.

**Syntax:**

````markdown
```bible-interlinear
ref: Gen 1:1-5
translation: NASB
original: WLCa
mode: study
```
````

**Parameters:**

| Parameter     | Required | Default                          | Description                                                      |
|---------------|----------|----------------------------------|------------------------------------------------------------------|
| `ref`         | Yes      | --                               | Verse reference. Accepts full names, abbreviations, and ranges.  |
| `translation` | No       | Plugin setting (`NASB`)          | English translation to display. Must match a cached version.     |
| `original`    | No       | Auto-detected (WLCa for OT, TISCH for NT) | Original-language version.                          |
| `mode`        | No       | Plugin setting (`study`)         | `reading` shows original + gloss only. `study` shows all layers. |

**Reference formats:**

```
Gen 1:1          Single verse
Gen 1:1-5        Verse range
Genesis 1        Entire chapter
Ps 23            Entire chapter (abbreviations work)
1 Cor 13:4-8     Numbered book with range
```

The interlinear display renders each verse as:

1. English translation text with superscript verse number
2. A flexbox row of word columns (RTL for Hebrew), each containing:
   - The original-language word
   - A clickable Strong's number linking to the dictionary note
   - Transliteration in Latin characters
   - English gloss
3. A collapsible cross-reference section (if cross-references exist for that verse)

Function words (Hebrew direct object marker, Greek articles, common particles) are rendered in a muted style and skip the Strong's/gloss layers.

### Quick Verse Insertion

The `bible` code block inserts rendered verse text without interlinear annotation.

````markdown
```bible
ref: John 3:16
translation: NASB
```
````

A bare reference on the first line also works:

````markdown
```bible
John 3:16
```
````

This renders the verse text as inline HTML with superscript verse numbers. The block also supports legacy My Bible numeric format (`43 3:16` for John chapter 3 verse 16).

### Gloss Backward Compatibility

The `gloss` and `ngloss` code blocks reproduce the ling-gloss plugin format for linguistic interlinear glossing. This ensures existing notes using ling-gloss syntax continue to render correctly.

**Syntax:**

````markdown
```gloss
\ex (1)
\gla בְּרֵאשִׁית בָּרָא אֱלֹהִים
\glb reshith bara Elohim
\glc beginning created God
\ft In the beginning God created
\src Genesis 1:1
```
````

**Commands:**

| Command | Description                                        |
|---------|----------------------------------------------------|
| `\ex`   | Example number, displayed in parentheses           |
| `\gla`  | First gloss line (original text, typically italic)  |
| `\glb`  | Second gloss line (morpheme/transliteration)        |
| `\glc`  | Third gloss line (English gloss)                    |
| `\ft`   | Free translation                                   |
| `\src`  | Source citation                                    |

Each `\gl*` line is split on whitespace, and words are aligned vertically in columns. Continuation lines (without a command prefix) are appended to the current level.

### Inline Reference Detection

A MarkdownPostProcessor scans rendered text for Bible references and converts them to clickable internal links. When you write `Gen 1:1` or `John 3:16` anywhere in your notes, the plugin wraps the reference in an `<a>` element pointing to the corresponding chapter file in `bibles/NASB-IL/`.

**What it detects:**

- Full book names: `Genesis 1:1`, `Revelation 22:21`
- Standard abbreviations: `Gen 1:1`, `Rev 22:21`
- Numbered books: `1 Cor 13:4`, `2 Kings 5:14`
- Verse ranges: `Ps 23:1-6`
- Chapter-only references: `Isaiah 53`

**What it skips:**

- Text inside `<code>`, `<pre>`, or `<a>` elements
- Text inside frontmatter blocks
- Existing wikilinks

This feature is controlled by the **Detect references in text** setting and can be toggled off.

### Editor Suggest

Type `-- ` (two dashes and a space) at the start of a line followed by a Bible reference to trigger the autocomplete suggest popup.

```
-- Gen 1:1-5
```

Selecting the suggestion replaces the trigger line with a formatted callout block:

```markdown
> [!quote]+ [[bibles/NASB-IL/Genesis/Genesis 1|Genesis 1:1-5]]
> <sup>1</sup> In the beginning God created the heavens and the earth.
> <sup>2</sup> The earth was formless and void...
> ...
```

The callout includes:
- A wikilink in the title pointing to the chapter file
- Verse text with superscript numbers from the configured translation
- The `+` suffix makes the callout expanded by default

### Strong's Number Linking

Every word in the interlinear display that has a Strong's number generates a clickable link. These links resolve to concept notes in the vault.

For Hebrew words, the link path follows the pattern:

```
concepts/hebrew/H{number} - {transliteration}
```

For Greek words:

```
concepts/greek/G{number} - {transliteration}
```

For example, clicking `H430` in the interlinear display for Genesis 1:1 opens `concepts/hebrew/H430 - Elohim.md`. These concept notes contain etymological data, semantic domain links, LXX equivalents, and links to related terms.

The plugin includes a built-in lexicon of approximately 80 core Hebrew entries and 60 core Greek entries for transliteration and gloss data. The full Strong's dictionary (8,582 Hebrew + 5,347 Greek = 13,929 files) lives in the `strongs/` directory as standalone dictionary notes.

### Cross-Reference Display

For each verse rendered by the `bible-interlinear` block, the plugin looks up cross-references from a TSV dataset and renders them as a collapsible `<details>` element below the verse.

Each cross-reference includes:
- A clickable wikilink to the target chapter file in `bibles/NASB-IL/`
- A relationship type badge (`@quotes`, `@fulfills`, `@alludes_to`, `@parallels`)
- A community vote count indicating the strength of the connection

**Relationship classification logic:**

| Source      | Target      | Type          |
|-------------|-------------|---------------|
| OT verse    | NT verse    | `@fulfills`   |
| NT verse    | OT verse    | `@quotes`     |
| Same book   | Same book   | `@parallels`  |
| Adjacent books (within 2) | Adjacent books | `@parallels` |
| All other   | All other   | `@alludes_to` |

Cross-references are sorted by vote count (descending) and limited by the **Max cross-refs per verse** setting.

---

## Settings

Open Settings > Community plugins > Bible Interlinear to configure:

| Setting                          | Type     | Default        | Description                                                                                       |
|----------------------------------|----------|----------------|---------------------------------------------------------------------------------------------------|
| **Default translation**          | Text     | `NASB`         | Translation used for verse text. Must match a cached version name (NASB, KJV, WEBP, etc.).        |
| **Show original language**       | Toggle   | On             | Display Hebrew/Greek interlinear text alongside the English translation.                          |
| **Interlinear mode**             | Dropdown | `study`        | `reading` shows original word and gloss only. `study` shows all annotation layers (Strong's number, transliteration, gloss). |
| **Cross-reference vote threshold** | Slider | `10`           | Minimum community votes (1-100) for a cross-reference to appear. Higher values show only the most agreed-upon connections. |
| **Max cross-refs per verse**     | Slider   | `5`            | Maximum number of cross-references displayed per verse (1-20).                                    |
| **Bible files path**             | Text     | `bibles/NASB-IL` | Vault path to the interlinear Bible chapter files.                                              |
| **Concepts path**                | Text     | `concepts`     | Vault path to theological concept notes.                                                          |
| **Detect references in text**    | Toggle   | On             | Auto-detect Bible references (Gen 1:1, John 3:16) in rendered notes and make them clickable.      |

---

## Vault Structure

The plugin expects the following directory layout in your vault:

```
vault/
  bibles/
    cross_references.tsv          # 344,800 cross-reference pairs (OpenBible.info)
    NASB-IL/                      # Primary interlinear Bible
      -- Bible --.md              # Vault root index
      Genesis/
        -- Genesis --.md          # Book index with chapter links
        Genesis 1.md              # Chapter file (frontmatter + verse text)
        Genesis 2.md
        ...
      Exodus/
        ...
      ...all 66 books.../
    KJV/                          # Parallel translations
      01: Genesis/
        Genesis ch: 1.md
        ...
    WEBP/                         # Additional cached translations
    WLCa/                         # Hebrew source text (BHS/Westminster Leningrad Codex)
      01 בראשית/
        בראשית 1.md
        ...
    TISCH/                        # Greek source text (Tischendorf)
  strongs/
    hebrew/                       # 8,582 Strong's Hebrew dictionary entries
      H1.md
      H2.md
      ...H8674.md
    greek/                        # 5,347 Strong's Greek dictionary entries
      G1.md
      G2.md
      ...G5624.md
  concepts/
    hebrew/                       # 59 curated Hebrew word-concept notes
      H120 - adam.md
      H430 - Elohim.md
      H1254 - bara.md
      H1285 - berith.md
      H2617 - chesed.md
      ...
    greek/                        # 44 curated Greek word-concept notes
      G26 - agape.md
      G2316 - theos.md
      G3056 - logos.md
      G5485 - charis.md
      ...
    themes/                       # 20 theological theme notes
      Christology.md
      Covenant.md
      Creation.md
      Ecclesiology.md
      Eschatology.md
      Redemption.md
      Soteriology.md
      Theology Proper.md
      ...
```

### My Bible Cache

Verse text is read from the My Bible plugin's `.chapters/` cache at:

```
.obsidian/plugins/gslogimaker-my-bible/.chapters/
```

Cache files are named `{VERSION} {book_num} {chapter}.txt` with one verse per line. For example, `NASB 1 1.txt` contains Genesis chapter 1 in NASB, and `WLCa 1 1.txt` contains the same chapter in Hebrew with `<S>NNNN</S>` Strong's tags.

Supported versions:
- **NASB** -- English text
- **KJV** -- English text
- **WEBP** -- English text
- **WLCa** -- Hebrew with Strong's tags (`<S>430</S>` after each word)
- **TISCH** -- Greek with Strong's tags

### Strong's Dictionary Files

Each file in `strongs/hebrew/` and `strongs/greek/` contains frontmatter with:

```yaml
---
aliases:
  - "H1"
strongs: H1
original: "אָבִ֑יו"
gloss: "father"
frequency: 1212
testament: OT
tags:
  - strongs
  - strongs/hebrew
---
```

The `aliases` field allows wikilinks like `[[H1]]` or `[[H430]]` to resolve directly to the dictionary entry. This is what makes Strong's numbers in interlinear tables clickable throughout the vault.

### Concept Notes

Concept notes in `concepts/hebrew/` and `concepts/greek/` are curated analytical entries that go beyond the raw dictionary. Each note includes:

```yaml
---
strongs: H430
hebrew: אֱלֹהִים
transliteration: Elohim
pronunciation: el-o-HEEM
root: אלה (alah)
gloss: God, gods, divine beings
pos: noun, masculine plural
semantic-domain:
  - "[[concepts/themes/Theology Proper]]"
  - "[[concepts/themes/Divine Names]]"
testament: OT
occurrences: 2602
lxx-equivalent: "[[concepts/greek/G2316 - theos]]"
related:
  - "[[concepts/hebrew/H410 - El]]"
  - "[[concepts/hebrew/H433 - Eloah]]"
  - "[[concepts/hebrew/H3068 - YHWH]]"
  - "[[concepts/hebrew/H136 - Adonai]]"
tags:
  - concept
  - concept/hebrew
---
```

These notes serve as the semantic bridge between the raw lexicon and your theological research. The `semantic-domain` field links upward to theme notes; the `related` field connects to cognate terms; `lxx-equivalent` links Hebrew terms to their Greek counterparts in the Septuagint tradition.

---

## Frontmatter Schema

### Chapter Files (`bibles/NASB-IL/{Book}/{Book} {N}.md`)

| Key                  | Type              | Description                                                           |
|----------------------|-------------------|-----------------------------------------------------------------------|
| `type`               | `"chapter"`       | Note type discriminator.                                              |
| `book`               | Wikilink          | Link to the parent book index note.                                   |
| `book.name`          | String            | Book name (e.g., `"Genesis"`).                                        |
| `book.number`        | Number            | Canonical book number (1-66).                                         |
| `chapter`            | Number            | Chapter number within the book.                                       |
| `chapter.total`      | Number            | Total chapters in this book.                                          |
| `testament`          | `"OT"` or `"NT"` | Testament.                                                            |
| `section`            | String            | Section classification (Torah, Prophets, Writings, Gospels, Epistles, etc.). |
| `genre`              | String            | Literary genre (narrative, poetry, prophecy, epistle, apocalyptic, etc.). |
| `original.language`  | String            | `"Hebrew"` or `"Greek"`.                                             |
| `verses.total`       | Number            | Number of verses in this chapter.                                     |
| `up`                 | Wikilink          | Parent note (book index). Used by the Breadcrumbs plugin.             |
| `next`               | Wikilink          | Next chapter. Used by Breadcrumbs for sequential navigation.          |
| `prev`               | Wikilink          | Previous chapter. Used by Breadcrumbs for sequential navigation.      |
| `parallel.kjv`       | Wikilink          | Parallel chapter in the KJV translation.                              |
| `parallel.hebrew`    | Wikilink          | Parallel chapter in the Hebrew source (WLCa).                        |
| `parallel.greek`     | Wikilink          | Parallel chapter in the Greek source (TISCH). NT only.               |
| `cross.refs`         | Array of Wikilinks | Typed cross-references using `@type` suffixes.                       |
| `tags`               | Array of Strings  | Hierarchical tags (e.g., `bible/ot`, `bible/torah`, `genre/narrative`). |

### Book Index Files (`bibles/NASB-IL/{Book}/-- {Book} --.md`)

| Key              | Type       | Description                      |
|------------------|------------|----------------------------------|
| `type`           | `"book"`   | Note type discriminator.         |
| `book.name`      | String     | Book name.                       |
| `book.number`    | Number     | Canonical book number.           |
| `testament`      | String     | `"OT"` or `"NT"`.               |
| `section`        | String     | Section classification.          |
| `genre`          | String     | Predominant genre.               |
| `chapters.total` | Number     | Total chapter count.             |
| `original.name`  | String     | Book name in original language.  |
| `up`             | Wikilink   | Parent note (Bible root index).  |
| `tags`           | Array      | Classification tags.             |

### Cross-Reference Wikilink Format

The `cross.refs` array uses typed wikilinks with the pattern:

```yaml
cross.refs:
  - "[[bibles/NASB-IL/John/John 1#v1|John 1:1 @fulfills]]"
  - "[[bibles/NASB-IL/Isaiah/Isaiah 45#v18|Isaiah 45:18 @alludes_to]]"
  - "[[bibles/NASB-IL/Psalms/Psalms 104#v30|Psalms 104:30 @alludes_to]]"
  - "[[bibles/NASB-IL/Genesis/Genesis 1#v18|Genesis 1:18 @parallels]]"
```

The `#v{N}` fragment targets the verse heading. The `@type` suffix after the display text is consumed by the Wikilink Types plugin to render typed edges in the graph.

Relationship types:

| Type          | Meaning                                                                |
|---------------|------------------------------------------------------------------------|
| `@quotes`     | The target passage directly quotes the source (NT quoting OT).         |
| `@fulfills`   | The target passage fulfills or completes the source (prophecy to event).|
| `@alludes_to` | The target passage echoes or alludes to the source thematically.       |
| `@parallels`  | The two passages describe the same event or share parallel structure.  |

---

## Integration with Other Plugins

### Breadcrumbs

The `up`, `next`, and `prev` frontmatter fields create a hierarchical navigation structure consumed by the Breadcrumbs plugin:

- `up` links each chapter to its book index, and each book index to the Bible root (`-- Bible --.md`).
- `next` / `prev` link chapters sequentially, allowing keyboard navigation through the entire Bible.

This produces a three-level hierarchy: Bible > Book > Chapter.

### Wikilink Types

The `@type` suffixes in `cross.refs` wikilinks are parsed by the Wikilink Types plugin (or similar typed-link plugins) to render edges with relationship semantics in the graph view:

- `@quotes` edges appear as one style/color
- `@fulfills` edges appear as another
- `@alludes_to` and `@parallels` each get distinct treatments

This makes the Obsidian graph a visual map of intertextual relationships across Scripture.

### Datacore / Bases

The structured frontmatter enables powerful queries. Examples using Datacore:

```tsx
// All Torah chapters
dc.pages('"bibles/NASB-IL"')
  .where(p => p.section === "Torah" && p.type === "chapter")
```

Using Obsidian Bases, create a `.base` file:

```
filter: type = "chapter" AND testament = "OT" AND genre = "poetry"
fields: book.name, chapter, verses.total
sort: book.number asc, chapter asc
```

Using Dataview:

```dataview
TABLE book.name, chapter, verses.total
FROM "bibles/NASB-IL"
WHERE type = "chapter" AND section = "Torah"
SORT book.number ASC, chapter ASC
```

### Smart Connections

The vault's dense wikilink structure and rich frontmatter make it an excellent target for Smart Connections semantic search. Ask questions like "passages about covenant faithfulness" and Smart Connections will surface relevant chapter files, concept notes, and theme notes through both link-based and embedding-based similarity.

### Semantic Graph Healer

With 13,929 Strong's files, 103 concept notes, 1,189 chapter files, and 344,800 cross-references, link rot and orphaned notes are a real risk. Semantic Graph Healer can:

- Detect orphaned Strong's entries that have no inbound links from chapter files
- Identify broken wikilinks in `cross.refs` arrays when chapter files are renamed
- Suggest new edges between concept notes that share semantic domains

---

## Extending the Vault

### Adding Commentary Layers

Create a `commentary/` directory alongside `bibles/` with notes that link back to chapter files:

```markdown
---
type: commentary
source: "Matthew Henry"
chapter: "[[bibles/NASB-IL/Genesis/Genesis 1]]"
tags:
  - commentary
  - commentary/reformed
---

# Matthew Henry on Genesis 1

The creation narrative establishes...
```

### Adding Reflections

Personal reflection notes can reference chapter files and concept notes:

```markdown
---
type: reflection
date: 2026-04-08
passages:
  - "[[bibles/NASB-IL/Genesis/Genesis 1]]"
  - "[[bibles/NASB-IL/John/John 1]]"
concepts:
  - "[[concepts/hebrew/H1254 - bara]]"
  - "[[concepts/greek/G3056 - logos]]"
tags:
  - reflection
  - reflection/creation
---
```

### Adding Hermeneutic Metadata

Extend chapter frontmatter with custom fields for your study methodology:

```yaml
chiasm.center: 14      # Chiastic center verse
pericope.divisions:
  - "1-2: Creation"
  - "3-5: Light"
literary.devices:
  - merism
  - inclusio
  - repetition
```

Because the frontmatter is YAML, any additional fields you add are immediately queryable by Dataview, Datacore, and Bases without modifying the plugin.

---

## Mobile Support

Bible Interlinear is confirmed compatible with Obsidian Mobile (iOS and Android). The `manifest.json` sets `"isDesktopOnly": false`.

Note that the My Bible cache reader uses Node.js `fs` for file access, which is the standard Obsidian desktop path. On mobile, the plugin falls back to Obsidian's vault adapter. Ensure the My Bible cache files exist in your synced vault for mobile access.

---

## API Reference

### `src/main.ts` -- BibleInterlinearPlugin

The main plugin class. Registers all code block processors, the post-processor, the editor suggest, and three commands.

| Method / Property              | Description                                                             |
|--------------------------------|-------------------------------------------------------------------------|
| `settings`                     | Current `BibleInterlinearSettings` object.                              |
| `cache`                        | `BibleCache` instance for reading verse text.                           |
| `crossrefs`                    | `CrossRefIndex` instance for cross-reference lookups.                   |
| `processInterlinearBlock()`    | Handles `bible-interlinear` code blocks.                                |
| `processVerseBlock()`          | Handles `bible` code blocks.                                            |
| `processGlossBlock()`          | Handles `gloss` and `ngloss` code blocks.                               |
| `parseBlockConfig(source)`     | Parses `key: value` lines from a code block into a `Record<string, string>`. |
| `parseReference(ref)`          | Parses a reference string into `{ book, chapter, startVerse, endVerse }`. |

**Commands:**

| Command ID            | Name                      | Action                              |
|-----------------------|---------------------------|-------------------------------------|
| `switch-translation`  | Switch Bible translation  | Opens a notice directing to settings. |
| `clear-cache`         | Clear verse cache         | Clears the in-memory file cache.    |
| `reload-crossrefs`    | Reload cross-references   | Reloads `cross_references.tsv`.     |

### `src/settings.ts` -- BibleInterlinearSettings

Defines the `BibleInterlinearSettings` interface and `BibleInterlinearSettingTab` class. See [Settings](#settings) for field descriptions.

### `src/data/cache.ts` -- BibleCache

Reads My Bible's `.chapters/` cache files. One verse per line, keyed by `{VERSION} {bookNum} {chapter}.txt`.

| Method                                  | Return Type               | Description                                      |
|-----------------------------------------|---------------------------|--------------------------------------------------|
| `getChapter(version, bookNum, chapter)` | `Promise<string[] | null>` | All verse lines for a chapter. Primary API.      |
| `getVerse(version, bookNum, chapter, verse)` | `Promise<string | null>` | Single verse text.                           |
| `getVerses(version, bookNum, chapter, start?, end?)` | `Promise<VerseText[]>` | Verse range with verse numbers.          |
| `getVerseCount(version, bookNum, chapter)` | `Promise<number>`      | Total verses in a chapter.                       |
| `hasChapter(version, bookNum, chapter)` | `Promise<boolean>`        | Check if a chapter exists in the cache.          |
| `clearCache()`                          | `void`                    | Clear the in-memory file cache.                  |

### `src/data/crossrefs.ts` -- CrossRefIndex

Loads and indexes `bibles/cross_references.tsv`. Filters by vote threshold and sorts by vote count descending.

| Method                                            | Return Type         | Description                                    |
|---------------------------------------------------|---------------------|------------------------------------------------|
| `load(app?, voteThreshold?)`                      | `Promise<void>`     | Parse the TSV and build the index.             |
| `getForVerse(bookId, chapter, verse, maxRefs)`    | `CrossRef[]`        | Cross-references for a verse (by book ID).     |
| `getRefsForVerse(bookXrefKey, chapter, verse, maxRefs)` | `CrossReference[]` | Cross-references for a verse (by TSV key). |
| `isLoaded()`                                      | `boolean`           | Whether the index has been loaded.             |
| `static formatRef(ref)`                           | `string`            | Human-readable string (e.g., `"Psalm 96:5"`). |
| `static formatRefLink(ref, biblePath)`            | `string`            | Vault wikilink path.                           |

### `src/data/strongs.ts` -- Strong's Lexicon

Parses `<S>NNNN</S>` tagged text and provides lexicon lookups.

| Function / Type                     | Description                                                    |
|-------------------------------------|----------------------------------------------------------------|
| `parseStrongsText(text, isNT)`      | Extracts `WordStrongs[]` from tagged Hebrew/Greek text.        |
| `getStrongsEntry(num, isNT)`        | Returns `StrongsEntry` (original, transliteration, gloss).     |
| `getConceptPath(num, isNT)`         | Returns vault path to the concept note for a Strong's number.  |
| `isSkippable(strongs, isNT)`        | Whether a Strong's number is a function word to de-emphasize.  |
| `WordStrongs`                       | Interface: `{ word, strongs, prefix, entry? }`.                |
| `StrongsEntry`                      | Interface: `{ original, transliteration, gloss }`.             |

### `src/data/books.ts` -- Book Registry

All 66 canonical books with IDs, names, chapter counts, original-language names, and extensive alias lists.

| Function                  | Return Type              | Description                                           |
|---------------------------|--------------------------|-------------------------------------------------------|
| `findBook(nameOrAlias)`   | `BookInfo | undefined`   | Case-insensitive lookup by any name or abbreviation.  |
| `findBookById(id)`        | `BookInfo | undefined`   | Lookup by canonical number (1-66).                    |
| `findBookByXrefKey(key)`  | `BookInfo | undefined`   | Lookup by TSV cross-reference key (e.g., `"Gen"`).    |
| `getOriginalVersion(id)`  | `string`                 | Returns `"WLCa"` for OT or `"TISCH"` for NT.         |
| `getCrossRefBookKey(book)`| `string`                 | Returns the TSV key for a book (e.g., `"Gen"`, `"Matt"`). |
| `buildBookPattern()`      | `string`                 | Regex alternation of all book names/aliases.           |
| `BOOKS`                   | `BookInfo[]`             | The full 66-book array.                               |

### `src/render/interlinear.ts` -- InterlinearRenderer

Builds the flexbox-based interlinear display with RTL support and Strong's links.

| Method                                          | Description                                         |
|-------------------------------------------------|-----------------------------------------------------|
| `renderVerse(target, verseNum, english, wordData, options, component)` | Render one verse with interlinear. |
| `renderPericope(target, title, verses, options, component)` | Render a titled group of verses.          |

### `src/render/crossrefs.ts` -- CrossRefRenderer

Renders cross-references as collapsible `<details>` elements with typed relationship badges.

| Method                                            | Description                                          |
|---------------------------------------------------|------------------------------------------------------|
| `renderCrossRefs(target, refs, sourceBook, component)` | Render a list of cross-references for a verse.  |

### `src/editor/reference-detect.ts` -- detectReferences

The `detectReferences(el, ctx)` function is a MarkdownPostProcessor that walks text nodes in the rendered DOM, matches Bible references via regex, and replaces them with clickable `<a>` elements. Skips nodes inside links, code, and pre-formatted blocks.

### `src/editor/suggest.ts` -- Editor Suggest Utilities

| Function                                          | Description                                          |
|---------------------------------------------------|------------------------------------------------------|
| `parseTriggerLine(line)`                          | Parse a `-- ref` trigger line into book/chapter/verse. |
| `formatPassageCallout(bookName, chapter, verses, start?, end?)` | Format verses into a callout markdown block. |

---

## Development

### Project Structure

```
obsidian-bible-interlinear/
  manifest.json           # Obsidian plugin manifest
  package.json            # npm configuration with build/dev scripts
  tsconfig.json           # TypeScript configuration (ES2018 target)
  main.js                 # Built output (esbuild bundle)
  src/
    main.ts               # Plugin entry point, code block processors, commands
    settings.ts           # Settings interface and settings tab
    data/
      books.ts            # 66-book registry with aliases
      cache.ts            # My Bible cache file reader
      crossrefs.ts        # Cross-reference TSV loader and index
      strongs.ts          # Strong's lexicon parser and embedded dictionary
    render/
      interlinear.ts      # Flexbox interlinear verse renderer
      crossrefs.ts        # Collapsible cross-reference renderer
    editor/
      reference-detect.ts # MarkdownPostProcessor for inline reference detection
      suggest.ts          # EditorSuggest trigger parser and callout formatter
```

### Build

```bash
npm install
npm run build     # Single build
npm run dev       # Watch mode with auto-rebuild
```

The build uses esbuild with `obsidian`, `@codemirror/view`, and `@codemirror/state` marked as external (provided by the Obsidian runtime).

### TypeScript Configuration

- Target: ES2018
- Module: ESNext with Node module resolution
- Strict mode enabled
- No source maps (production bundle)

---

## Credits

### Data Sources

- **Cross-references**: [OpenBible.info](https://www.openbible.info/labs/cross-references/) cross-reference dataset, licensed CC-BY. Contains 344,800 verse pairs with community vote counts.
- **Verse text**: Cached via the [My Bible](https://github.com/gslogimaker/obsidian-my-bible) plugin from the [bolls.life](https://bolls.life/) API.
- **Hebrew source text**: Westminster Leningrad Codex, augmented edition (WLCa) with Strong's number tags.
- **Greek source text**: Tischendorf 8th edition (TISCH) with Strong's number tags.
- **Strong's dictionary**: James Strong, *A Concise Dictionary of the Words in the Greek Testament and The Hebrew Bible* (1890), public domain. Digital edition with frequency data.

### Acknowledgments

This plugin was built for a personal Obsidian vault focused on interlinear Bible study. It draws architectural inspiration from:

- [ling-gloss](https://github.com/digitalnomad-obsidian/ling-gloss) -- the original interlinear gloss renderer for Obsidian
- [obsidian-my-bible](https://github.com/gslogimaker/obsidian-my-bible) -- verse text caching and rendering
- [obsidian-local-bible-ref](https://github.com/) -- inline Bible reference detection patterns
