#!/usr/bin/env python3
"""
Full vault rebuild — fixes all broken links, creates Strong's dictionary,
cleans note bodies, and restructures frontmatter.

Changes from v2:
1. Strong's dictionary: 13,929 files at strongs/hebrew/ and strongs/greek/
   with aliases so [[H7225]] resolves without pipe escaping
2. Interlinear tables use [[H7225]] instead of [[concepts/.../H7225 - reshith\|H7225]]
3. Remove inline navigation (breadcrumbs handles up/next/prev)
4. Cleaner frontmatter with extensibility hooks
5. Cross-refs as typed wikilinks in frontmatter, not footnotes
"""

import re, os, shutil
from pathlib import Path
from collections import defaultdict

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────

VAULT = Path("/Users/mikhail/obsidian/book")
CHAPTERS_DIR = VAULT / ".obsidian/plugins/gslogimaker-my-bible/.chapters"
XREF_FILE = VAULT / "bibles/cross_references.tsv"
OUTPUT_DIR = VAULT / "bibles/NASB-IL"
STRONGS_DIR = VAULT / "strongs"
CONCEPTS_DIR = VAULT / "concepts"
KJV_DIR = VAULT / "bibles/KJV"

MIN_XREF_VOTES = 10
MAX_XREFS_PER_VERSE = 5

# ──────────────────────────────────────────────
# Books
# ──────────────────────────────────────────────

BOOKS = [
    (1,"Genesis","בראשית",None,"Gen",50,"narrative","Torah"),
    (2,"Exodus","שמות",None,"Exod",40,"narrative","Torah"),
    (3,"Leviticus","ויקרא",None,"Lev",27,"law","Torah"),
    (4,"Numbers","במדבר",None,"Num",36,"narrative","Torah"),
    (5,"Deuteronomy","דברים",None,"Deut",34,"law","Torah"),
    (6,"Joshua","יהושע",None,"Josh",24,"narrative","Historical"),
    (7,"Judges","שופטים",None,"Judg",21,"narrative","Historical"),
    (8,"Ruth","רות",None,"Ruth",4,"narrative","Historical"),
    (9,"1 Samuel","שמואל א",None,"1Sam",31,"narrative","Historical"),
    (10,"2 Samuel","שמואל ב",None,"2Sam",24,"narrative","Historical"),
    (11,"1 Kings","מלכים א",None,"1Kgs",22,"narrative","Historical"),
    (12,"2 Kings","מלכים ב",None,"2Kgs",25,"narrative","Historical"),
    (13,"1 Chronicles","דברי הימים א",None,"1Chr",29,"narrative","Historical"),
    (14,"2 Chronicles","דברי הימים ב",None,"2Chr",36,"narrative","Historical"),
    (15,"Ezra","עזרא",None,"Ezra",10,"narrative","Historical"),
    (16,"Nehemiah","נחמיה",None,"Neh",13,"narrative","Historical"),
    (17,"Esther","אסתר",None,"Esth",10,"narrative","Historical"),
    (18,"Job","איוב",None,"Job",42,"wisdom","Wisdom"),
    (19,"Psalms","תהלים",None,"Ps",150,"poetry","Wisdom"),
    (20,"Proverbs","משלי",None,"Prov",31,"wisdom","Wisdom"),
    (21,"Ecclesiastes","קהלת",None,"Eccl",12,"wisdom","Wisdom"),
    (22,"Song of Solomon","שיר השירים",None,"Song",8,"poetry","Wisdom"),
    (23,"Isaiah","ישעיהו",None,"Isa",66,"prophecy","Major Prophets"),
    (24,"Jeremiah","ירמיהו",None,"Jer",52,"prophecy","Major Prophets"),
    (25,"Lamentations","איכה",None,"Lam",5,"poetry","Major Prophets"),
    (26,"Ezekiel","יחזקאל",None,"Ezek",48,"prophecy","Major Prophets"),
    (27,"Daniel","דניאל",None,"Dan",12,"apocalyptic","Major Prophets"),
    (28,"Hosea","הושע",None,"Hos",14,"prophecy","Minor Prophets"),
    (29,"Joel","יואל",None,"Joel",3,"prophecy","Minor Prophets"),
    (30,"Amos","עמוס",None,"Amos",9,"prophecy","Minor Prophets"),
    (31,"Obadiah","עבדיה",None,"Obad",1,"prophecy","Minor Prophets"),
    (32,"Jonah","יונה",None,"Jonah",4,"narrative","Minor Prophets"),
    (33,"Micah","מיכה",None,"Mic",7,"prophecy","Minor Prophets"),
    (34,"Nahum","נחום",None,"Nah",3,"prophecy","Minor Prophets"),
    (35,"Habakkuk","חבקוק",None,"Hab",3,"prophecy","Minor Prophets"),
    (36,"Zephaniah","צפניה",None,"Zeph",3,"prophecy","Minor Prophets"),
    (37,"Haggai","חגי",None,"Hag",2,"prophecy","Minor Prophets"),
    (38,"Zechariah","זכריה",None,"Zech",14,"prophecy","Minor Prophets"),
    (39,"Malachi","מלאכי",None,"Mal",4,"prophecy","Minor Prophets"),
    (40,"Matthew",None,"ΚΑΤΑ ΜΑΤΘΑΙΟΝ","Matt",28,"gospel","Gospels"),
    (41,"Mark",None,"ΚΑΤΑ ΜΑΡΚΟΝ","Mark",16,"gospel","Gospels"),
    (42,"Luke",None,"ΚΑΤΑ ΛΟΥΚΑΝ","Luke",24,"gospel","Gospels"),
    (43,"John",None,"ΚΑΤΑ ΙΩΑΝΝΗΝ","John",21,"gospel","Gospels"),
    (44,"Acts",None,"ΠΡΑΞΕΙΣ","Acts",28,"narrative","Acts"),
    (45,"Romans",None,"ΠΡΟΣ ΡΩΜΑΙΟΥΣ","Rom",16,"epistle","Pauline"),
    (46,"1 Corinthians",None,"ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Α΄","1Cor",16,"epistle","Pauline"),
    (47,"2 Corinthians",None,"ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Β΄","2Cor",13,"epistle","Pauline"),
    (48,"Galatians",None,"ΠΡΟΣ ΓΑΛΑΤΑΣ","Gal",6,"epistle","Pauline"),
    (49,"Ephesians",None,"ΠΡΟΣ ΕΦΕΣΙΟΥΣ","Eph",6,"epistle","Pauline"),
    (50,"Philippians",None,"ΠΡΟΣ ΦΙΛΙΠΠΗΣΙΟΥΣ","Phil",4,"epistle","Pauline"),
    (51,"Colossians",None,"ΠΡΟΣ ΚΟΛΟΣΣΑΕΙΣ","Col",4,"epistle","Pauline"),
    (52,"1 Thessalonians",None,"ΘΕΣΣΑΛΟΝΙΚΕΙΣ Α΄","1Thess",5,"epistle","Pauline"),
    (53,"2 Thessalonians",None,"ΘΕΣΣΑΛΟΝΙΚΕΙΣ Β΄","2Thess",3,"epistle","Pauline"),
    (54,"1 Timothy",None,"ΠΡΟΣ ΤΙΜΟΘΕΟΝ Α΄","1Tim",6,"epistle","Pauline"),
    (55,"2 Timothy",None,"ΠΡΟΣ ΤΙΜΟΘΕΟΝ Β΄","2Tim",4,"epistle","Pauline"),
    (56,"Titus",None,"ΠΡΟΣ ΤΙΤΟΝ","Titus",3,"epistle","Pauline"),
    (57,"Philemon",None,"ΠΡΟΣ ΦΙΛΗΜΟΝΑ","Phlm",1,"epistle","Pauline"),
    (58,"Hebrews",None,"ΠΡΟΣ ΕΒΡΑΙΟΥΣ","Heb",13,"epistle","General"),
    (59,"James",None,"ΙΑΚΩΒΟΥ","Jas",5,"epistle","General"),
    (60,"1 Peter",None,"ΠΕΤΡΟΥ Α΄","1Pet",5,"epistle","General"),
    (61,"2 Peter",None,"ΠΕΤΡΟΥ Β΄","2Pet",3,"epistle","General"),
    (62,"1 John",None,"ΙΩΑΝΝΟΥ Α΄","1John",5,"epistle","General"),
    (63,"2 John",None,"ΙΩΑΝΝΟΥ Β΄","2John",1,"epistle","General"),
    (64,"3 John",None,"ΙΩΑΝΝΟΥ Γ΄","3John",1,"epistle","General"),
    (65,"Jude",None,"ΙΟΥΔΑ","Jude",1,"epistle","General"),
    (66,"Revelation",None,"ΑΠΟΚΑΛΥΨΙΣ ΙΩΑΝΝΟΥ","Rev",22,"apocalyptic","Apocalyptic"),
]

NUM_TO_BOOK = {b[0]: b for b in BOOKS}
ABBREV_TO_NUM = {b[4]: b[0] for b in BOOKS}
KJV_FOLDER = {b[0]: f"{b[0]:02d}: {b[1]}" for b in BOOKS}
KJV_FOLDER[19] = "19: Psalms"
WLCA_FOLDER = {b[0]: f"{b[0]:02d} {b[2]}" for b in BOOKS if b[2]}
TISCH_FOLDER = {b[0]: f"{b[0]:02d} {b[3]}" for b in BOOKS if b[3]}

# ──────────────────────────────────────────────
# Phase 1: Build Strong's vocabulary from cache
# ──────────────────────────────────────────────

def build_strongs_vocabulary():
    """Scan all cache files, extract every unique (word, Strong's number) pair."""
    print("Phase 1: Building Strong's vocabulary...")
    heb_vocab = {}  # num -> (most_common_word, count)
    grk_vocab = {}

    for f in CHAPTERS_DIR.glob("WLCa *.txt"):
        for line in f.read_text(encoding="utf-8", errors="replace").split("\n"):
            for m in re.finditer(r'([^\s<>]+)<S>(\d+)</S>', line):
                word = re.sub(r'[׃׀,.:;·\s]', '', m.group(1)).strip()
                num = int(m.group(2))
                if num > 0 and word:
                    if num not in heb_vocab:
                        heb_vocab[num] = {}
                    heb_vocab[num][word] = heb_vocab[num].get(word, 0) + 1

    for f in CHAPTERS_DIR.glob("TISCH *.txt"):
        for line in f.read_text(encoding="utf-8", errors="replace").split("\n"):
            for m in re.finditer(r'([^\s<>]+)<S>(\d+)</S>', line):
                word = re.sub(r'[,.:;·\s]', '', m.group(1)).strip()
                num = int(m.group(2))
                if num > 0 and word:
                    if num not in grk_vocab:
                        grk_vocab[num] = {}
                    grk_vocab[num][word] = grk_vocab[num].get(word, 0) + 1

    # Collapse to most common form per number
    heb_words = {}
    for num, forms in heb_vocab.items():
        best = max(forms, key=forms.get)
        heb_words[num] = (best, sum(forms.values()))

    grk_words = {}
    for num, forms in grk_vocab.items():
        best = max(forms, key=forms.get)
        grk_words[num] = (best, sum(forms.values()))

    print(f"  Hebrew: {len(heb_words)} unique Strong's numbers")
    print(f"  Greek: {len(grk_words)} unique Strong's numbers")
    return heb_words, grk_words


# ──────────────────────────────────────────────
# Phase 2: Create Strong's dictionary files
# ──────────────────────────────────────────────

# Known glosses (from plugin lexicon)
KNOWN_GLOSSES = {
    # Hebrew
    "H1": "father", "H113": "lord, master", "H120": "man, mankind",
    "H136": "Lord", "H157": "to love", "H215": "to give light",
    "H216": "light", "H226": "sign", "H259": "one",
    "H410": "God", "H430": "God (Elohim)", "H539": "to believe",
    "H559": "to say", "H571": "truth", "H776": "earth, land",
    "H834": "which, that", "H853": "[obj. marker]",
    "H914": "to separate", "H922": "void", "H929": "beast",
    "H996": "between", "H1121": "son", "H1242": "morning",
    "H1254": "to create", "H1285": "covenant", "H1288": "to bless",
    "H1350": "to redeem", "H1419": "great", "H1696": "to speak",
    "H1697": "word, matter", "H1818": "blood", "H1870": "way, path",
    "H1961": "to be", "H2009": "behold", "H2145": "male",
    "H2232": "to sow", "H2233": "seed", "H2403": "sin",
    "H2416": "living", "H2580": "grace", "H2617": "lovingkindness",
    "H2822": "darkness", "H2896": "good", "H3027": "hand",
    "H3045": "to know", "H3068": "the LORD (YHWH)", "H3117": "day",
    "H3220": "sea", "H3318": "to go out", "H3372": "to fear",
    "H3444": "salvation", "H3519": "glory", "H3533": "to subdue",
    "H3548": "priest", "H3556": "star", "H3588": "for, that",
    "H3605": "all, every", "H3651": "so, thus", "H3671": "wing",
    "H3722": "to atone", "H3820": "heart", "H3915": "night",
    "H3966": "very", "H3974": "luminary", "H4150": "appointed time",
    "H4325": "water", "H4327": "kind, species", "H4390": "to fill",
    "H4397": "angel, messenger", "H4428": "king", "H4475": "dominion",
    "H4725": "place", "H4899": "anointed one", "H4910": "to rule",
    "H4941": "justice", "H5030": "prophet", "H5315": "soul, life",
    "H5347": "female", "H5414": "to give", "H5545": "to forgive",
    "H5650": "servant", "H5769": "eternity", "H5771": "iniquity",
    "H5775": "bird", "H5921": "upon", "H5930": "burnt offering",
    "H5971": "people", "H6086": "tree", "H6153": "evening",
    "H6212": "herb", "H6213": "to do, make", "H6440": "face",
    "H6509": "be fruitful", "H6529": "fruit", "H6635": "host",
    "H6754": "image", "H6944": "holiness", "H6960": "to gather",
    "H7121": "to call", "H7200": "to see", "H7225": "beginning",
    "H7235": "to multiply", "H7287": "to rule", "H7307": "spirit, wind",
    "H7363": "to hover", "H7430": "to creep", "H7431": "creeping thing",
    "H7549": "expanse", "H7706": "Almighty", "H7965": "peace",
    "H8034": "name", "H8064": "heavens", "H8085": "to hear",
    "H8104": "to keep", "H8141": "year", "H8145": "second",
    "H8147": "two", "H8317": "to swarm", "H8414": "formless",
    "H8415": "the deep", "H8432": "midst", "H8451": "law, instruction",
    "H8577": "sea creature",
    # Greek
    "G11": "Abraham", "G25": "to love", "G26": "love",
    "G32": "angel", "G40": "holy", "G80": "brother",
    "G129": "blood", "G165": "age, eternity", "G225": "truth",
    "G266": "sin", "G386": "resurrection", "G435": "man",
    "G444": "man, person", "G575": "from", "G630": "to release",
    "G649": "apostle", "G652": "apostle", "G746": "beginning",
    "G846": "he/she/it", "G907": "to baptize", "G932": "kingdom",
    "G935": "king", "G976": "book", "G1063": "for",
    "G1074": "generation", "G1078": "origin", "G1080": "to beget",
    "G1096": "to become", "G1097": "to know", "G1135": "woman",
    "G1138": "David", "G1161": "but, and", "G1223": "through",
    "G1242": "covenant", "G1343": "righteousness", "G1411": "power",
    "G1453": "to raise", "G1510": "to be", "G1515": "peace",
    "G1537": "from, out of", "G1577": "church", "G1680": "hope",
    "G1722": "in", "G1849": "authority", "G2098": "gospel",
    "G2147": "to find", "G2192": "to have", "G2193": "until",
    "G2222": "life", "G2288": "death", "G2309": "to will",
    "G2316": "God", "G2424": "Jesus", "G2443": "in order that",
    "G2532": "and", "G2564": "to call", "G2889": "world",
    "G2962": "Lord", "G2992": "people", "G3004": "to say",
    "G3056": "word", "G3083": "ransom", "G3101": "disciple",
    "G3137": "Mary", "G3326": "with, after", "G3340": "to repent",
    "G3361": "not", "G3384": "mother", "G3441": "alone",
    "G3551": "law", "G3588": "the", "G3686": "name",
    "G3739": "who, which", "G3754": "that", "G3756": "not",
    "G3767": "therefore", "G3778": "this", "G3875": "advocate",
    "G3880": "to receive", "G3933": "virgin", "G3956": "all",
    "G3962": "father", "G4100": "to believe", "G4102": "faith",
    "G4137": "to fulfill", "G4151": "spirit", "G4160": "to do, make",
    "G4314": "to, toward", "G4396": "prophet", "G4982": "to save",
    "G4991": "salvation", "G5043": "child", "G5088": "to give birth",
    "G5207": "son", "G5399": "to fear", "G5456": "voice",
    "G5485": "grace", "G5547": "Christ",
}


def create_strongs_dictionary(heb_words, grk_words):
    """Create a dictionary file for every Strong's number."""
    print("Phase 2: Creating Strong's dictionary files...")

    heb_dir = STRONGS_DIR / "hebrew"
    grk_dir = STRONGS_DIR / "greek"
    heb_dir.mkdir(parents=True, exist_ok=True)
    grk_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for num, (word, freq) in heb_words.items():
        sid = f"H{num}"
        gloss = KNOWN_GLOSSES.get(sid, "")
        concept_path = None
        # Check if a concept note exists
        for cf in (CONCEPTS_DIR / "hebrew").glob(f"H{num} - *.md"):
            concept_path = f"concepts/hebrew/{cf.stem}"
            break

        content = f"---\naliases:\n  - \"{sid}\"\nstrongs: {sid}\n"
        content += f"original: \"{word}\"\ngloss: \"{gloss}\"\n"
        content += f"frequency: {freq}\ntestament: OT\n"
        if concept_path:
            content += f"concept: \"[[{concept_path}]]\"\n"
        content += f"tags:\n  - strongs\n  - strongs/hebrew\n---\n\n"
        content += f"# {sid} \u2014 {word}\n\n"
        if gloss:
            content += f"*{gloss}*\n\n"
        if concept_path:
            content += f"Full study: [[{concept_path}]]\n"

        (heb_dir / f"{sid}.md").write_text(content, encoding="utf-8")
        count += 1

    for num, (word, freq) in grk_words.items():
        sid = f"G{num}"
        gloss = KNOWN_GLOSSES.get(sid, "")
        concept_path = None
        for cf in (CONCEPTS_DIR / "greek").glob(f"G{num} - *.md"):
            concept_path = f"concepts/greek/{cf.stem}"
            break

        content = f"---\naliases:\n  - \"{sid}\"\nstrongs: {sid}\n"
        content += f"original: \"{word}\"\ngloss: \"{gloss}\"\n"
        content += f"frequency: {freq}\ntestament: NT\n"
        if concept_path:
            content += f"concept: \"[[{concept_path}]]\"\n"
        content += f"tags:\n  - strongs\n  - strongs/greek\n---\n\n"
        content += f"# {sid} \u2014 {word}\n\n"
        if gloss:
            content += f"*{gloss}*\n\n"
        if concept_path:
            content += f"Full study: [[{concept_path}]]\n"

        (grk_dir / f"{sid}.md").write_text(content, encoding="utf-8")
        count += 1

    print(f"  Created {count} Strong's dictionary files")
    return count


# ──────────────────────────────────────────────
# Phase 3: Load cross-references
# ──────────────────────────────────────────────

def parse_tsv_ref(ref):
    if '-' in ref:
        ref = ref.split('-')[0]
    parts = ref.split('.')
    if len(parts) < 3:
        return None
    if parts[0] not in ABBREV_TO_NUM:
        return None
    try:
        return (ABBREV_TO_NUM[parts[0]], int(parts[1]), int(parts[2]))
    except (ValueError, IndexError):
        return None

def classify_xref(from_book, to_book):
    if from_book <= 39 and to_book >= 40: return "fulfills"
    if from_book >= 40 and to_book <= 39: return "quotes"
    if from_book == to_book: return "parallels"
    if abs(from_book - to_book) <= 2: return "parallels"
    return "alludes_to"

def load_cross_references():
    print("Phase 3: Loading cross-references...")
    xrefs = defaultdict(list)
    with open(XREF_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("#") or line.startswith("From"):
                continue
            parts = line.strip().split("\t")
            if len(parts) < 3: continue
            try: votes = int(parts[2])
            except ValueError: continue
            if votes < MIN_XREF_VOTES: continue
            fr = parse_tsv_ref(parts[0])
            to = parse_tsv_ref(parts[1])
            if fr and to:
                xrefs[fr].append({"to": to, "votes": votes})
    for key in xrefs:
        xrefs[key].sort(key=lambda x: -x["votes"])
        xrefs[key] = xrefs[key][:MAX_XREFS_PER_VERSE]
    print(f"  Loaded {sum(len(v) for v in xrefs.values()):,} cross-references")
    return dict(xrefs)


# ──────────────────────────────────────────────
# Phase 4: Generate chapters
# ──────────────────────────────────────────────

def read_cached(version, book_num, chapter):
    path = CHAPTERS_DIR / f"{version} {book_num} {chapter}.txt"
    if not path.exists(): return []
    return path.read_text(encoding="utf-8").rstrip("\n").split("\n")

def parse_strongs(text):
    pairs = []
    parts = re.split(r'<S>(\d+)</S>', text)
    for i in range(0, len(parts) - 1, 2):
        chunk = parts[i].strip()
        words = chunk.replace('\u05be', ' ').split()
        word = words[-1] if words else ""
        word = re.sub(r'[\u05c3\u05c0,.:;\u00b7\s]', '', word).strip()
        try: num = int(parts[i+1])
        except ValueError: continue
        if word and num > 0:
            pairs.append((word, num))
    return pairs

def get_kjv_para_starts(book_num, chapter):
    folder = KJV_FOLDER.get(book_num)
    if not folder: return {1}
    name = NUM_TO_BOOK[book_num][1]
    path = KJV_DIR / folder / f"{name} ch: {chapter}.md"
    if not path.exists(): return {1}
    starts = set()
    for line in path.read_text(encoding="utf-8").split("\n"):
        m = re.match(r'\*\*(\d+)\*\*\s*\u00b6', line.strip())
        if m: starts.add(int(m.group(1)))
    return starts or {1}

SKIP = {853,5921,834,3588,3605,413,3651,3588,1161,2532,1722,1537,
        3739,3778,1063,2443,575,2596,5259,4314,846,3956,3767,3754,
        3756,2228,3361}

def generate_chapter(book_num, chapter, xrefs):
    book = NUM_TO_BOOK[book_num]
    name, heb, grk, abbrev = book[1], book[2], book[3], book[4]
    total_ch, genre, section = book[5], book[6], book[7]
    is_nt = book_num >= 40
    orig_ver = "TISCH" if is_nt else "WLCa"
    orig_lang = "Greek" if is_nt else "Hebrew"

    nasb = read_cached("NASB", book_num, chapter)
    if not nasb: return ""
    orig = read_cached(orig_ver, book_num, chapter)
    nv = len(nasb)

    paras = sorted(get_kjv_para_starts(book_num, chapter))
    if not paras or paras[0] != 1:
        paras = [1] + [p for p in paras if p > 1]

    # Build pericope boundaries
    pericopes = []
    for i, start in enumerate(paras):
        end = paras[i+1] - 1 if i+1 < len(paras) else nv
        if start > nv: break
        pericopes.append((start, min(end, nv)))

    # Collect cross-refs for frontmatter
    ch_xrefs = []
    for v in range(1, nv+1):
        key = (book_num, chapter, v)
        if key in xrefs:
            for xr in xrefs[key]:
                tb, tc, tv = xr["to"]
                tn = NUM_TO_BOOK[tb][1]
                rel = classify_xref(book_num, tb)
                ch_xrefs.append({
                    "v": v, "target": f"{tn} {tc}:{tv}",
                    "link": f"[[bibles/NASB-IL/{tn}/{tn} {tc}#v{tv}|{tn} {tc}:{tv} @{rel}]]",
                    "votes": xr["votes"], "type": rel
                })

    # ── Frontmatter ──
    fm = ["---"]
    fm.append("type: chapter")
    fm.append(f"book: \"[[bibles/NASB-IL/{name}/-- {name} --]]\"")
    fm.append(f"book.name: {name}")
    fm.append(f"book.number: {book_num}")
    fm.append(f"chapter: {chapter}")
    fm.append(f"chapter.total: {total_ch}")
    fm.append(f"testament: {'NT' if is_nt else 'OT'}")
    fm.append(f"section: {section}")
    fm.append(f"genre: {genre}")
    fm.append(f"original.language: {orig_lang}")
    fm.append(f"verses.total: {nv}")

    # Breadcrumbs navigation
    fm.append(f"up: \"[[bibles/NASB-IL/{name}/-- {name} --]]\"")
    if chapter > 1:
        fm.append(f"prev: \"[[bibles/NASB-IL/{name}/{name} {chapter-1}]]\"")
    elif book_num > 1:
        pb = NUM_TO_BOOK[book_num-1]
        fm.append(f"prev: \"[[bibles/NASB-IL/{pb[1]}/{pb[1]} {pb[5]}]]\"")
    if chapter < total_ch:
        fm.append(f"next: \"[[bibles/NASB-IL/{name}/{name} {chapter+1}]]\"")
    elif book_num < 66:
        nb = NUM_TO_BOOK[book_num+1]
        fm.append(f"next: \"[[bibles/NASB-IL/{nb[1]}/{nb[1]} 1]]\"")

    # Parallel versions
    kjv_f = KJV_FOLDER.get(book_num, "")
    fm.append(f"parallel.kjv: \"[[bibles/KJV/{kjv_f}/{name} ch: {chapter}]]\"")
    if not is_nt and heb:
        wf = WLCA_FOLDER.get(book_num, "")
        fm.append(f"parallel.hebrew: \"[[bibles/WLCa/{wf}/{heb} {chapter}]]\"")
    if is_nt and grk:
        tf = TISCH_FOLDER.get(book_num, "")
        fm.append(f"parallel.greek: \"[[bibles/TISCH/{tf}/{grk} {chapter}]]\"")

    # Cross-refs in frontmatter (typed)
    if ch_xrefs:
        fm.append("cross.refs:")
        for xr in ch_xrefs[:20]:  # Cap at 20 in frontmatter
            fm.append(f"  - \"{xr['link']}\"")

    # Tags
    t_tag = "nt" if is_nt else "ot"
    fm.append("tags:")
    fm.append(f"  - bible/{t_tag}")
    fm.append(f"  - bible/{section.lower().replace(' ', '-')}")
    fm.append(f"  - genre/{genre}")

    fm.append("---")

    # ── Body ──
    lines = list(fm)
    lines.append("")
    lines.append(f"# {name} {chapter}")
    lines.append("")

    # Pericope sections (no inline navigation — breadcrumbs handles it)
    for start_v, end_v in pericopes:
        vr = f"{start_v}" if start_v == end_v else f"{start_v}-{end_v}"
        lines.append(f"## {name} {chapter}:{vr}")
        lines.append("")

        for vi in range(start_v - 1, min(end_v, nv)):
            vn = vi + 1
            vtext = nasb[vi] if vi < len(nasb) else ""
            lines.append(f"###### v{vn}")
            lines.append(f"<sup>{vn}</sup> {vtext}")
            lines.append("")

        # Interlinear — FIXED: use [[H7225]] not [[path\|alias]]
        if orig:
            lines.append(f"> [!{orig_lang.lower()}]- Interlinear \u2014 {name} {chapter}:{vr}")
            for vi in range(start_v - 1, min(end_v, nv)):
                vn = vi + 1
                if vi >= len(orig): continue
                pairs = parse_strongs(orig[vi])
                if not pairs: continue
                lines.append(f"> **{vn}**")
                lines.append("> | Original | Strong's | Gloss |")
                lines.append("> |---:|:---:|:---|")
                prefix = "G" if is_nt else "H"
                for word, num in pairs:
                    sid = f"{prefix}{num}"
                    gloss = KNOWN_GLOSSES.get(sid, "")
                    if num in SKIP:
                        lines.append(f"> | {word} | {sid} | *[function]* |")
                    else:
                        g = gloss if gloss else "\u2014"
                        lines.append(f"> | {word} | [[{sid}]] | {g} |")
                lines.append(">")
            lines.append("")

    return "\n".join(lines)


def generate_book_index(book_num):
    b = NUM_TO_BOOK[book_num]
    name, heb, grk, total_ch, genre, section = b[1], b[2], b[3], b[5], b[6], b[7]
    is_nt = book_num >= 40

    lines = ["---", "type: book"]
    lines.append(f"book.name: {name}")
    lines.append(f"book.number: {book_num}")
    lines.append(f"testament: {'NT' if is_nt else 'OT'}")
    lines.append(f"section: {section}")
    lines.append(f"genre: {genre}")
    lines.append(f"chapters.total: {total_ch}")
    if heb: lines.append(f"original.name: \"{heb}\"")
    if grk: lines.append(f"original.name: \"{grk}\"")
    lines.append(f"up: \"[[bibles/NASB-IL/-- Bible --]]\"")
    lines.append("tags:")
    lines.append(f"  - bible/{'nt' if is_nt else 'ot'}")
    lines.append(f"  - bible/{section.lower().replace(' ', '-')}")
    lines.append("---")
    lines.append("")
    lines.append(f"# {name}")
    lines.append("")
    if heb: lines.append(f"*{heb}*"); lines.append("")
    if grk: lines.append(f"*{grk}*"); lines.append("")
    lines.append("## Chapters")
    lines.append("")
    for ch in range(1, total_ch + 1):
        lines.append(f"- [[bibles/NASB-IL/{name}/{name} {ch}|Chapter {ch}]]")
    return "\n".join(lines)


def generate_bible_index():
    lines = ["---", "type: bible-index", "version: NASB-IL"]
    lines.append("down:")
    for b in BOOKS:
        lines.append(f"  - \"[[bibles/NASB-IL/{b[1]}/-- {b[1]} --]]\"")
    lines.append("tags:")
    lines.append("  - bible/index")
    lines.append("---")
    lines.append("")
    lines.append("# NASB Interlinear Bible")
    lines.append("")
    current_section = ""
    for b in BOOKS:
        if b[7] != current_section:
            current_section = b[7]
            lines.append(f"## {current_section}")
            lines.append("")
        orig = f" (*{b[2]}*)" if b[2] else (f" (*{b[3]}*)" if b[3] else "")
        lines.append(f"- [[bibles/NASB-IL/{b[1]}/-- {b[1]} --|{b[1]}]]{orig}")
    return "\n".join(lines)


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    # Phase 1: Build vocabulary
    heb_words, grk_words = build_strongs_vocabulary()

    # Phase 2: Create Strong's dictionary
    if STRONGS_DIR.exists():
        shutil.rmtree(STRONGS_DIR)
    create_strongs_dictionary(heb_words, grk_words)

    # Phase 3: Load cross-references
    xrefs = load_cross_references()

    # Phase 4: Regenerate vault
    print("Phase 4: Regenerating chapters...")
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)

    total = 0
    for book_num, name, *rest in BOOKS:
        total_ch = rest[3]
        book_dir = OUTPUT_DIR / name
        book_dir.mkdir(parents=True, exist_ok=True)
        ch_count = 0
        for chapter in range(1, total_ch + 1):
            content = generate_chapter(book_num, chapter, xrefs)
            if content:
                (book_dir / f"{name} {chapter}.md").write_text(content, encoding="utf-8")
                ch_count += 1
                total += 1
        # Book index
        idx = generate_book_index(book_num)
        (book_dir / f"-- {name} --.md").write_text(idx, encoding="utf-8")
        print(f"  {name}: {ch_count} chapters")

    # Bible index
    (OUTPUT_DIR / "-- Bible --.md").write_text(generate_bible_index(), encoding="utf-8")

    print(f"\nDone! {total} chapters regenerated")
    print(f"Strong's dictionary: {len(list(STRONGS_DIR.rglob('*.md')))} files")


if __name__ == "__main__":
    main()
