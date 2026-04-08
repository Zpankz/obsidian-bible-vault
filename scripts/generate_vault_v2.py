#!/usr/bin/env python3
"""
Bible Vault Generator v2 — Pericope Format with Dedron Frontmatter

Generates a complete NASB-IL (Interlinear) Bible vault with:
- Pericope-level notes (Approach B: passage segments, not individual verses)
- Flat dedron-syntax frontmatter (dotted keys for hierarchical data)
- Wikilinks in frontmatter for Obsidian Bases API queries
- Cross-references as footnotes with typed wikilinks (@quotes, @alludes_to, etc.)
- Interlinear code blocks for each verse
- Concept note wikilinks inline in English text
- Book and chapter folder notes with navigation
"""

import os
import re
import csv
import json
import sys
from pathlib import Path
from collections import defaultdict
from typing import Optional

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

BASE = Path("/Users/mikhail/obsidian/book")
CHAPTERS_DIR = BASE / ".obsidian/plugins/gslogimaker-my-bible/.chapters"
XREF_FILE = BASE / "bibles/cross_references.tsv"
OUTPUT_DIR = BASE / "bibles/NASB-IL"
CONCEPTS_DIR = BASE / "concepts"
KJV_DIR = BASE / "bibles/KJV"

MIN_XREF_VOTES = 10
MAX_XREFS_PER_VERSE = 8

# ──────────────────────────────────────────────
# Book data
# ──────────────────────────────────────────────

BOOKS = [
    (1, "Genesis", "בראשית", None, "Gen", 50, "narrative", "Torah"),
    (2, "Exodus", "שמות", None, "Exod", 40, "narrative", "Torah"),
    (3, "Leviticus", "ויקרא", None, "Lev", 27, "law", "Torah"),
    (4, "Numbers", "במדבר", None, "Num", 36, "narrative", "Torah"),
    (5, "Deuteronomy", "דברים", None, "Deut", 34, "law", "Torah"),
    (6, "Joshua", "יהושע", None, "Josh", 24, "narrative", "Historical"),
    (7, "Judges", "שופטים", None, "Judg", 21, "narrative", "Historical"),
    (8, "Ruth", "רות", None, "Ruth", 4, "narrative", "Historical"),
    (9, "1 Samuel", "שמואל א", None, "1Sam", 31, "narrative", "Historical"),
    (10, "2 Samuel", "שמואל ב", None, "2Sam", 24, "narrative", "Historical"),
    (11, "1 Kings", "מלכים א", None, "1Kgs", 22, "narrative", "Historical"),
    (12, "2 Kings", "מלכים ב", None, "2Kgs", 25, "narrative", "Historical"),
    (13, "1 Chronicles", "דברי הימים א", None, "1Chr", 29, "narrative", "Historical"),
    (14, "2 Chronicles", "דברי הימים ב", None, "2Chr", 36, "narrative", "Historical"),
    (15, "Ezra", "עזרא", None, "Ezra", 10, "narrative", "Historical"),
    (16, "Nehemiah", "נחמיה", None, "Neh", 13, "narrative", "Historical"),
    (17, "Esther", "אסתר", None, "Esth", 10, "narrative", "Historical"),
    (18, "Job", "איוב", None, "Job", 42, "wisdom", "Wisdom"),
    (19, "Psalms", "תהלים", None, "Ps", 150, "poetry", "Wisdom"),
    (20, "Proverbs", "משלי", None, "Prov", 31, "wisdom", "Wisdom"),
    (21, "Ecclesiastes", "קהלת", None, "Eccl", 12, "wisdom", "Wisdom"),
    (22, "Song of Solomon", "שיר השירים", None, "Song", 8, "poetry", "Wisdom"),
    (23, "Isaiah", "ישעיהו", None, "Isa", 66, "prophecy", "Major Prophets"),
    (24, "Jeremiah", "ירמיהו", None, "Jer", 52, "prophecy", "Major Prophets"),
    (25, "Lamentations", "איכה", None, "Lam", 5, "poetry", "Major Prophets"),
    (26, "Ezekiel", "יחזקאל", None, "Ezek", 48, "prophecy", "Major Prophets"),
    (27, "Daniel", "דניאל", None, "Dan", 12, "apocalyptic", "Major Prophets"),
    (28, "Hosea", "הושע", None, "Hos", 14, "prophecy", "Minor Prophets"),
    (29, "Joel", "יואל", None, "Joel", 3, "prophecy", "Minor Prophets"),
    (30, "Amos", "עמוס", None, "Amos", 9, "prophecy", "Minor Prophets"),
    (31, "Obadiah", "עבדיה", None, "Obad", 1, "prophecy", "Minor Prophets"),
    (32, "Jonah", "יונה", None, "Jonah", 4, "narrative", "Minor Prophets"),
    (33, "Micah", "מיכה", None, "Mic", 7, "prophecy", "Minor Prophets"),
    (34, "Nahum", "נחום", None, "Nah", 3, "prophecy", "Minor Prophets"),
    (35, "Habakkuk", "חבקוק", None, "Hab", 3, "prophecy", "Minor Prophets"),
    (36, "Zephaniah", "צפניה", None, "Zeph", 3, "prophecy", "Minor Prophets"),
    (37, "Haggai", "חגי", None, "Hag", 2, "prophecy", "Minor Prophets"),
    (38, "Zechariah", "זכריה", None, "Zech", 14, "prophecy", "Minor Prophets"),
    (39, "Malachi", "מלאכי", None, "Mal", 4, "prophecy", "Minor Prophets"),
    (40, "Matthew", None, "ΚΑΤΑ ΜΑΤΘΑΙΟΝ", "Matt", 28, "gospel", "Gospels"),
    (41, "Mark", None, "ΚΑΤΑ ΜΑΡΚΟΝ", "Mark", 16, "gospel", "Gospels"),
    (42, "Luke", None, "ΚΑΤΑ ΛΟΥΚΑΝ", "Luke", 24, "gospel", "Gospels"),
    (43, "John", None, "ΚΑΤΑ ΙΩΑΝΝΗΝ", "John", 21, "gospel", "Gospels"),
    (44, "Acts", None, "ΠΡΑΞΕΙΣ", "Acts", 28, "narrative", "Acts"),
    (45, "Romans", None, "ΠΡΟΣ ΡΩΜΑΙΟΥΣ", "Rom", 16, "epistle", "Pauline"),
    (46, "1 Corinthians", None, "ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Α΄", "1Cor", 16, "epistle", "Pauline"),
    (47, "2 Corinthians", None, "ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Β΄", "2Cor", 13, "epistle", "Pauline"),
    (48, "Galatians", None, "ΠΡΟΣ ΓΑΛΑΤΑΣ", "Gal", 6, "epistle", "Pauline"),
    (49, "Ephesians", None, "ΠΡΟΣ ΕΦΕΣΙΟΥΣ", "Eph", 6, "epistle", "Pauline"),
    (50, "Philippians", None, "ΠΡΟΣ ΦΙΛΙΠΠΗΣΙΟΥΣ", "Phil", 4, "epistle", "Pauline"),
    (51, "Colossians", None, "ΠΡΟΣ ΚΟΛΟΣΣΑΕΙΣ", "Col", 4, "epistle", "Pauline"),
    (52, "1 Thessalonians", None, "ΘΕΣΣΑΛΟΝΙΚΕΙΣ Α΄", "1Thess", 5, "epistle", "Pauline"),
    (53, "2 Thessalonians", None, "ΘΕΣΣΑΛΟΝΙΚΕΙΣ Β΄", "2Thess", 3, "epistle", "Pauline"),
    (54, "1 Timothy", None, "ΠΡΟΣ ΤΙΜΟΘΕΟΝ Α΄", "1Tim", 6, "epistle", "Pauline"),
    (55, "2 Timothy", None, "ΠΡΟΣ ΤΙΜΟΘΕΟΝ Β΄", "2Tim", 4, "epistle", "Pauline"),
    (56, "Titus", None, "ΠΡΟΣ ΤΙΤΟΝ", "Titus", 3, "epistle", "Pauline"),
    (57, "Philemon", None, "ΠΡΟΣ ΦΙΛΗΜΟΝΑ", "Phlm", 1, "epistle", "Pauline"),
    (58, "Hebrews", None, "ΠΡΟΣ ΕΒΡΑΙΟΥΣ", "Heb", 13, "epistle", "General"),
    (59, "James", None, "ΙΑΚΩΒΟΥ", "Jas", 5, "epistle", "General"),
    (60, "1 Peter", None, "ΠΕΤΡΟΥ Α΄", "1Pet", 5, "epistle", "General"),
    (61, "2 Peter", None, "ΠΕΤΡΟΥ Β΄", "2Pet", 3, "epistle", "General"),
    (62, "1 John", None, "ΙΩΑΝΝΟΥ Α΄", "1John", 5, "epistle", "General"),
    (63, "2 John", None, "ΙΩΑΝΝΟΥ Β΄", "2John", 1, "epistle", "General"),
    (64, "3 John", None, "ΙΩΑΝΝΟΥ Γ΄", "3John", 1, "epistle", "General"),
    (65, "Jude", None, "ΙΟΥΔΑ", "Jude", 1, "epistle", "General"),
    (66, "Revelation", None, "ΑΠΟΚΑΛΥΨΙΣ ΙΩΑΝΝΟΥ", "Rev", 22, "apocalyptic", "Apocalyptic"),
]

NUM_TO_BOOK = {b[0]: b for b in BOOKS}
ABBREV_TO_NUM = {b[4]: b[0] for b in BOOKS}

KJV_FOLDER = {b[0]: f"{b[0]:02d}: {b[1]}" for b in BOOKS}
KJV_FOLDER[19] = "19: Psalms"

WLCA_FOLDER = {b[0]: f"{b[0]:02d} {b[2]}" for b in BOOKS if b[2]}
TISCH_FOLDER = {b[0]: f"{b[0]:02d} {b[3]}" for b in BOOKS if b[3]}

# ──────────────────────────────────────────────
# Strong's glossary (comprehensive)
# ──────────────────────────────────────────────

HEBREW_STRONGS = {
    120: ("אָדָם", "adam", "man, mankind"),
    136: ("אֲדֹנָי", "Adonai", "Lord, master"),
    157: ("אָהַב", "ahav", "to love"),
    215: ("אוֹר", "or", "light"),
    216: ("אוֹר", "or", "light"),
    226: ("אוֹת", "ot", "sign, wonder"),
    259: ("אֶחָד", "echad", "one, united"),
    410: ("אֵל", "El", "God, mighty one"),
    430: ("אֱלֹהִים", "Elohim", "God"),
    539: ("אָמַן", "aman", "to believe, be faithful"),
    559: ("אָמַר", "amar", "to say"),
    571: ("אֱמֶת", "emeth", "truth, faithfulness"),
    776: ("אֶרֶץ", "erets", "earth, land"),
    834: ("אֲשֶׁר", "asher", "which, that"),
    853: ("אֵת", "et", "[direct object marker]"),
    914: ("בָּדַל", "badal", "to separate"),
    922: ("בֹּהוּ", "bohu", "void, emptiness"),
    929: ("בְּהֵמָה", "behemah", "beast, cattle"),
    996: ("בֵּין", "beyn", "between"),
    1242: ("בֹּקֶר", "boqer", "morning"),
    1254: ("בָּרָא", "bara", "to create"),
    1285: ("בְּרִית", "berith", "covenant"),
    1288: ("בָּרַךְ", "barak", "to bless"),
    1350: ("גָּאַל", "gaal", "to redeem"),
    1419: ("גָּדוֹל", "gadol", "great"),
    1696: ("דָּבַר", "davar", "to speak; word"),
    1697: ("דָּבָר", "davar", "word, thing, matter"),
    1823: ("דְּמוּת", "demuth", "likeness"),
    1876: ("דָּשָׁא", "dasha", "to sprout"),
    1877: ("דֶּשֶׁא", "deshe", "vegetation"),
    1961: ("הָיָה", "hayah", "to be, become"),
    2009: ("הִנֵּה", "hinneh", "behold"),
    2145: ("זָכָר", "zakar", "male"),
    2232: ("זָרַע", "zara", "to sow"),
    2233: ("זֶרַע", "zera", "seed, offspring"),
    2403: ("חַטָּאת", "chattath", "sin"),
    2416: ("חַי", "chay", "living, life"),
    2549: ("חֲמִישִׁי", "chamishi", "fifth"),
    2617: ("חֶסֶד", "chesed", "lovingkindness"),
    2822: ("חֹשֶׁךְ", "choshek", "darkness"),
    2896: ("טוֹב", "tov", "good"),
    3045: ("יָדַע", "yada", "to know"),
    3068: ("יהוה", "YHWH", "the LORD"),
    3117: ("יוֹם", "yom", "day"),
    3220: ("יָם", "yam", "sea"),
    3318: ("יָצָא", "yatsa", "to go out"),
    3372: ("יָרֵא", "yare", "to fear, revere"),
    3444: ("יְשׁוּעָה", "yeshuah", "salvation"),
    3519: ("כָּבוֹד", "kavod", "glory"),
    3533: ("כָּבַשׁ", "kavash", "to subdue"),
    3548: ("כֹּהֵן", "kohen", "priest"),
    3556: ("כּוֹכָב", "kokav", "star"),
    3588: ("כִּי", "ki", "for, that, because"),
    3605: ("כֹּל", "kol", "all, every"),
    3651: ("כֵּן", "ken", "so, thus"),
    3671: ("כָּנָף", "kanaph", "wing"),
    3722: ("כָּפַר", "kaphar", "to atone"),
    3820: ("לֵב", "lev", "heart"),
    3915: ("לַיִל", "layil", "night"),
    3966: ("מְאֹד", "meod", "very, exceedingly"),
    3974: ("מָאוֹר", "maor", "luminary, light"),
    4150: ("מוֹעֵד", "moed", "appointed time"),
    4325: ("מַיִם", "mayim", "water, waters"),
    4327: ("מִין", "min", "kind, species"),
    4390: ("מָלֵא", "male", "to fill"),
    4397: ("מַלְאָךְ", "malak", "angel, messenger"),
    4428: ("מֶלֶךְ", "melek", "king"),
    4475: ("מֶמְשָׁלָה", "memshalah", "dominion, rule"),
    4723: ("מִקְוֶה", "miqveh", "gathering"),
    4725: ("מָקוֹם", "maqom", "place"),
    4899: ("מָשִׁיחַ", "mashiach", "anointed one"),
    4910: ("מָשַׁל", "mashal", "to rule"),
    4941: ("מִשְׁפָּט", "mishpat", "justice, judgment"),
    5030: ("נָבִיא", "navi", "prophet"),
    5315: ("נֶפֶשׁ", "nephesh", "soul, life, being"),
    5347: ("נְקֵבָה", "neqevah", "female"),
    5414: ("נָתַן", "natan", "to give"),
    5545: ("סָלַח", "salach", "to forgive"),
    5769: ("עוֹלָם", "olam", "eternity, forever"),
    5771: ("עָוֹן", "avon", "iniquity"),
    5774: ("עוּף", "uph", "to fly"),
    5775: ("עוֹף", "oph", "bird, fowl"),
    5921: ("עַל", "al", "upon, over"),
    5930: ("עֹלָה", "olah", "burnt offering"),
    6086: ("עֵץ", "ets", "tree, wood"),
    6153: ("עֶרֶב", "erev", "evening"),
    6212: ("עֵשֶׂב", "esev", "herb, plant"),
    6213: ("עָשָׂה", "asah", "to do, make"),
    6440: ("פָּנִים", "panim", "face"),
    6509: ("פָּרָה", "parah", "to be fruitful"),
    6529: ("פְּרִי", "peri", "fruit"),
    6635: ("צָבָא", "tsava", "host, army"),
    6754: ("צֶלֶם", "tselem", "image"),
    6944: ("קֹדֶשׁ", "qodesh", "holiness"),
    6960: ("קָוָה", "qavah", "to gather, wait"),
    6996: ("קָטָן", "qatan", "small, little"),
    7121: ("קָרָא", "qara", "to call"),
    7200: ("רָאָה", "raah", "to see"),
    7225: ("רֵאשִׁית", "reshith", "beginning"),
    7235: ("רָבָה", "ravah", "to multiply"),
    7287: ("רָדָה", "radah", "to rule, have dominion"),
    7307: ("רוּחַ", "ruach", "spirit, wind, breath"),
    7363: ("רָחַף", "rachaph", "to hover"),
    7430: ("רָמַשׂ", "ramas", "to creep"),
    7431: ("רֶמֶשׂ", "remes", "creeping thing"),
    7549: ("רָקִיעַ", "raqia", "expanse, firmament"),
    7706: ("שַׁדַּי", "Shaddai", "Almighty"),
    7965: ("שָׁלוֹם", "shalom", "peace"),
    7992: ("שְׁלִישִׁי", "shelishi", "third"),
    8064: ("שָׁמַיִם", "shamayim", "heavens, sky"),
    8085: ("שָׁמַע", "shama", "to hear, obey"),
    8141: ("שָׁנָה", "shanah", "year"),
    8145: ("שֵׁנִי", "sheni", "second"),
    8147: ("שְׁנַיִם", "shenayim", "two"),
    8317: ("שָׁרַץ", "sharats", "to swarm"),
    8318: ("שֶׁרֶץ", "sherets", "swarm, swarming thing"),
    8414: ("תֹּהוּ", "tohu", "formless, chaos"),
    8415: ("תְּהוֹם", "tehom", "the deep, abyss"),
    8432: ("תָּוֶךְ", "tavek", "midst, middle"),
    8451: ("תּוֹרָה", "torah", "law, instruction"),
    8577: ("תַּנִּין", "tannin", "sea creature, dragon"),
}

GREEK_STRONGS = {
    11: ("Ἀβραάμ", "Abraam", "Abraham"),
    26: ("ἀγάπη", "agape", "love"),
    32: ("ἄγγελος", "angelos", "angel, messenger"),
    40: ("ἅγιος", "hagios", "holy, saint"),
    80: ("ἀδελφός", "adelphos", "brother"),
    129: ("αἷμα", "haima", "blood"),
    225: ("ἀλήθεια", "aletheia", "truth"),
    266: ("ἁμαρτία", "hamartia", "sin"),
    386: ("ἀνάστασις", "anastasis", "resurrection"),
    435: ("ἀνήρ", "aner", "man, husband"),
    575: ("ἀπό", "apo", "from"),
    630: ("ἀπολύω", "apolyo", "to release"),
    652: ("ἀπόστολος", "apostolos", "apostle"),
    746: ("ἀρχή", "arche", "beginning"),
    897: ("Βαβυλών", "Babylon", "Babylon"),
    907: ("βαπτίζω", "baptizo", "to baptize"),
    932: ("βασιλεία", "basileia", "kingdom"),
    935: ("βασιλεύς", "basileus", "king"),
    976: ("βίβλος", "biblos", "book"),
    1014: ("βούλομαι", "boulomai", "to will, desire"),
    1063: ("γάρ", "gar", "for"),
    1074: ("γενεά", "genea", "generation"),
    1078: ("γένεσις", "genesis", "origin, birth"),
    1080: ("γεννάω", "gennao", "to beget, give birth"),
    1096: ("γίνομαι", "ginomai", "to become"),
    1097: ("γινώσκω", "ginosko", "to know"),
    1135: ("γυνή", "gyne", "woman, wife"),
    1138: ("Δαυείδ", "Daueid", "David"),
    1161: ("δέ", "de", "but, and"),
    1165: ("δειγματίζω", "deigmatizo", "to expose"),
    1223: ("διά", "dia", "through"),
    1242: ("διαθήκη", "diatheke", "covenant"),
    1343: ("δικαιοσύνη", "dikaiosyne", "righteousness"),
    1411: ("δύναμις", "dynamis", "power"),
    1453: ("ἐγείρω", "egeiro", "to raise"),
    1510: ("εἰμί", "eimi", "to be"),
    1515: ("εἰρήνη", "eirene", "peace"),
    1537: ("ἐκ", "ek", "from, out of"),
    1577: ("ἐκκλησία", "ekklesia", "church, assembly"),
    1680: ("ἐλπίς", "elpis", "hope"),
    1722: ("ἐν", "en", "in"),
    1849: ("ἐξουσία", "exousia", "authority"),
    2098: ("εὐαγγέλιον", "euangelion", "gospel"),
    2147: ("εὑρίσκω", "heurisko", "to find"),
    2192: ("ἔχω", "echo", "to have"),
    2193: ("ἕως", "heos", "until"),
    2222: ("ζωή", "zoe", "life"),
    2288: ("θάνατος", "thanatos", "death"),
    2309: ("θέλω", "thelo", "to will, wish"),
    2316: ("θεός", "theos", "God"),
    2424: ("Ἰησοῦς", "Iesous", "Jesus"),
    2443: ("ἵνα", "hina", "in order that"),
    2564: ("καλέω", "kaleo", "to call"),
    2889: ("κόσμος", "kosmos", "world"),
    2962: ("κύριος", "kyrios", "Lord"),
    2992: ("λαός", "laos", "people"),
    3004: ("λέγω", "lego", "to say"),
    3056: ("λόγος", "logos", "word"),
    3083: ("λύτρον", "lutron", "ransom"),
    3101: ("μαθητής", "mathetes", "disciple"),
    3137: ("Μαρία", "Maria", "Mary"),
    3326: ("μετά", "meta", "with, after"),
    3340: ("μετανοέω", "metanoeo", "to repent"),
    3384: ("μήτηρ", "meter", "mother"),
    3441: ("μόνος", "monos", "alone, only"),
    3551: ("νόμος", "nomos", "law"),
    3588: ("ὁ", "ho", "the"),
    3624: ("σταυρός", "stauros", "cross"),
    3686: ("ὄνομα", "onoma", "name"),
    3739: ("ὅς", "hos", "who, which"),
    3754: ("ὅτι", "hoti", "that, because"),
    3756: ("οὐ", "ou", "not"),
    3767: ("οὖν", "oun", "therefore"),
    3778: ("οὗτος", "houtos", "this"),
    3875: ("παράκλητος", "parakletos", "advocate, comforter"),
    3880: ("παραλαμβάνω", "paralambano", "to receive"),
    3933: ("παρθένος", "parthenos", "virgin"),
    3956: ("πᾶς", "pas", "all, every"),
    3962: ("πατήρ", "pater", "father"),
    4100: ("πιστεύω", "pisteuo", "to believe"),
    4102: ("πίστις", "pistis", "faith"),
    4137: ("πληρόω", "pleroo", "to fulfill"),
    4151: ("πνεῦμα", "pneuma", "spirit, Spirit"),
    4160: ("ποιέω", "poieo", "to do, make"),
    4314: ("πρός", "pros", "to, toward"),
    4396: ("προφήτης", "prophetes", "prophet"),
    4982: ("σώζω", "sozo", "to save"),
    4991: ("σωτηρία", "soteria", "salvation"),
    5043: ("τέκνον", "teknon", "child"),
    5088: ("τίκτω", "tikto", "to give birth"),
    5207: ("υἱός", "huios", "son"),
    5399: ("φοβέω", "phobeo", "to fear"),
    5456: ("φωνή", "phone", "voice, sound"),
    5485: ("χάρις", "charis", "grace"),
    5547: ("Χριστός", "Christos", "Christ"),
}

# Skip function words in interlinear (only show content words)
SKIP_STRONGS = {
    # Hebrew
    853, 5921, 834, 3588, 3605, 413, 3651,
    # Greek - articles, particles, prepositions
    3588, 1161, 2532, 1722, 1537, 3739, 3778, 1063, 2443, 575,
    2596, 5259, 4314, 846, 3956, 3767, 3754, 3756, 2228, 3361,
}

# ──────────────────────────────────────────────
# Cross-reference relationship typing
# ──────────────────────────────────────────────

def classify_xref(from_book: int, to_book: int) -> str:
    """Classify cross-reference relationship type for wikilink-types."""
    if from_book <= 39 and to_book >= 40:
        return "fulfills"
    if from_book >= 40 and to_book <= 39:
        return "quotes"
    if from_book == to_book:
        return "parallels"
    if abs(from_book - to_book) <= 2:
        return "parallels"
    return "alludes_to"


# ──────────────────────────────────────────────
# Data loading
# ──────────────────────────────────────────────

def read_cached_verses(version: str, book_num: int, chapter: int) -> list[str]:
    path = CHAPTERS_DIR / f"{version} {book_num} {chapter}.txt"
    if not path.exists():
        return []
    return path.read_text(encoding="utf-8").rstrip("\n").split("\n")


def parse_strongs(text: str) -> list[tuple[str, int]]:
    """Extract (word, strong_number) pairs from tagged text."""
    pairs = []
    parts = re.split(r'<S>(\d+)</S>', text)
    for i in range(0, len(parts) - 1, 2):
        chunk = parts[i].strip()
        words = chunk.replace('־', ' ').split()
        word = words[-1] if words else ""
        word = re.sub(r'[׃׀\s,.:;·]', '', word).strip()
        try:
            num = int(parts[i + 1])
        except ValueError:
            continue
        if word and num > 0:
            pairs.append((word, num))
    return pairs


def get_gloss(num: int, is_nt: bool) -> Optional[tuple[str, str, str]]:
    """Get (original, transliteration, gloss) for a Strong's number."""
    lookup = GREEK_STRONGS if is_nt else HEBREW_STRONGS
    return lookup.get(num)


def parse_tsv_ref(ref: str) -> Optional[tuple[int, int, int]]:
    if '-' in ref:
        ref = ref.split('-')[0]
    parts = ref.split('.')
    if len(parts) < 3:
        return None
    abbrev = parts[0]
    if abbrev not in ABBREV_TO_NUM:
        return None
    try:
        return (ABBREV_TO_NUM[abbrev], int(parts[1]), int(parts[2]))
    except (ValueError, IndexError):
        return None


def load_cross_references() -> dict:
    print("Loading cross-references...")
    xrefs = defaultdict(list)
    with open(XREF_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("#") or line.startswith("From"):
                continue
            parts = line.strip().split("\t")
            if len(parts) < 3:
                continue
            try:
                votes = int(parts[2])
            except ValueError:
                continue
            if votes < MIN_XREF_VOTES:
                continue
            from_ref = parse_tsv_ref(parts[0])
            to_ref = parse_tsv_ref(parts[1])
            if from_ref and to_ref:
                xrefs[from_ref].append({
                    "to": to_ref,
                    "votes": votes,
                })
    for key in xrefs:
        xrefs[key].sort(key=lambda x: -x["votes"])
        xrefs[key] = xrefs[key][:MAX_XREFS_PER_VERSE]
    total = sum(len(v) for v in xrefs.values())
    print(f"  Loaded {total:,} cross-references for {len(xrefs):,} verses")
    return dict(xrefs)


def get_kjv_paragraph_starts(book_num: int, chapter: int) -> set[int]:
    folder = KJV_FOLDER.get(book_num)
    if not folder:
        return {1}
    name = NUM_TO_BOOK[book_num][1]
    kjv_path = KJV_DIR / folder / f"{name} ch: {chapter}.md"
    if not kjv_path.exists():
        return {1}
    para_starts = set()
    with open(kjv_path, "r", encoding="utf-8") as f:
        for line in f:
            m = re.match(r'\*\*(\d+)\*\*\s*¶', line.strip())
            if m:
                para_starts.add(int(m.group(1)))
    if not para_starts:
        para_starts.add(1)
    return para_starts


# ──────────────────────────────────────────────
# Pericope generation
# ──────────────────────────────────────────────

def build_pericopes(book_num: int, chapter: int, num_verses: int) -> list[dict]:
    """Build pericope boundaries from KJV paragraph markers."""
    para_starts = sorted(get_kjv_paragraph_starts(book_num, chapter))
    if not para_starts or para_starts[0] != 1:
        para_starts = [1] + [p for p in para_starts if p > 1]

    pericopes = []
    for i, start in enumerate(para_starts):
        end = para_starts[i + 1] - 1 if i + 1 < len(para_starts) else num_verses
        if start > num_verses:
            break
        end = min(end, num_verses)
        pericopes.append({
            "start": start,
            "end": end,
            "order": i + 1,
        })
    return pericopes


def format_ref_display(book_num: int, chapter: int, verse: int) -> str:
    return f"{NUM_TO_BOOK[book_num][1]} {chapter}:{verse}"


def make_il_link(book_num: int, chapter: int) -> str:
    name = NUM_TO_BOOK[book_num][1]
    return f"bibles/NASB-IL/{name}/{name} {chapter}"


# ──────────────────────────────────────────────
# Chapter note generation (pericope sections)
# ──────────────────────────────────────────────

def generate_chapter(book_num: int, chapter: int, xrefs: dict) -> str:
    book = NUM_TO_BOOK[book_num]
    name, heb_name, grk_name, abbrev = book[1], book[2], book[3], book[4]
    total_chapters, genre, section = book[5], book[6], book[7]
    is_nt = book_num >= 40
    testament = "NT" if is_nt else "OT"
    orig_lang = "Greek" if is_nt else "Hebrew"
    orig_version = "TISCH" if is_nt else "WLCa"

    nasb_verses = read_cached_verses("NASB", book_num, chapter)
    if not nasb_verses:
        return ""
    orig_verses = read_cached_verses(orig_version, book_num, chapter)
    num_verses = len(nasb_verses)

    pericopes = build_pericopes(book_num, chapter, num_verses)

    # Collect all cross-refs for this chapter
    chapter_xrefs = {}
    for v in range(1, num_verses + 1):
        key = (book_num, chapter, v)
        if key in xrefs:
            chapter_xrefs[v] = xrefs[key]

    # Collect key terms (significant Strong's found in this chapter)
    key_terms = set()
    if orig_verses:
        for ov in orig_verses:
            for _, num in parse_strongs(ov):
                if num not in SKIP_STRONGS:
                    lookup = GREEK_STRONGS if is_nt else HEBREW_STRONGS
                    if num in lookup:
                        prefix = "G" if is_nt else "H"
                        entry = lookup[num]
                        key_terms.add(f"[[concepts/{'greek' if is_nt else 'hebrew'}/{prefix}{num} - {entry[1]}]]")

    # Build dedron frontmatter
    fm = []
    fm.append("---")
    fm.append("type: chapter")
    fm.append(f"book: \"[[bibles/NASB-IL/{name}/-- {name} --]]\"")
    fm.append(f"book.name: \"{name}\"")
    fm.append(f"book.number: {book_num}")
    fm.append(f"chapter: {chapter}")
    fm.append(f"chapter.total: {total_chapters}")
    fm.append(f"testament: {testament}")
    fm.append(f"section: \"{section}\"")
    fm.append(f"genre: \"{genre}\"")
    fm.append(f"original.language: \"{orig_lang}\"")
    fm.append(f"verses.total: {num_verses}")
    fm.append(f"pericopes.count: {len(pericopes)}")

    # Parallel version links
    kjv_folder = KJV_FOLDER.get(book_num, "")
    fm.append(f"parallel.kjv: \"[[bibles/KJV/{kjv_folder}/{name} ch: {chapter}]]\"")
    if book_num <= 39 and heb_name:
        wlca_folder = WLCA_FOLDER.get(book_num, "")
        fm.append(f"parallel.hebrew: \"[[bibles/WLCa/{wlca_folder}/{heb_name} {chapter}]]\"")
    if book_num >= 40 and grk_name:
        tisch_folder = TISCH_FOLDER.get(book_num, "")
        fm.append(f"parallel.greek: \"[[bibles/TISCH/{tisch_folder}/{grk_name} {chapter}]]\"")

    # Key terms as array
    if key_terms:
        sorted_terms = sorted(key_terms)[:15]
        fm.append("key.terms:")
        for t in sorted_terms:
            fm.append(f"  - \"{t}\"")

    fm.append("---")
    fm.append("")

    # Chapter heading
    lines = list(fm)
    lines.append(f"# {name} {chapter}")
    lines.append("")

    # Navigation
    nav = []
    if chapter > 1:
        nav.append(f"[[bibles/NASB-IL/{name}/{name} {chapter - 1}|\u2190 {name} {chapter - 1}]]")
    nav.append(f"[[bibles/NASB-IL/{name}/-- {name} --|Chapters]]")
    if chapter < total_chapters:
        nav.append(f"[[bibles/NASB-IL/{name}/{name} {chapter + 1}|{name} {chapter + 1} \u2192]]")
    lines.append(" | ".join(nav))
    lines.append("")
    lines.append("---")
    lines.append("")

    # Generate pericope sections
    footnote_counter = 1
    footnotes = []

    for peri in pericopes:
        start_v, end_v = peri["start"], peri["end"]
        verse_range = f"{start_v}" if start_v == end_v else f"{start_v}-{end_v}"

        lines.append(f"## {name} {chapter}:{verse_range}")
        lines.append("")

        # Verse text with inline concept links
        for v_idx in range(start_v - 1, min(end_v, num_verses)):
            v_num = v_idx + 1
            verse_text = nasb_verses[v_idx] if v_idx < len(nasb_verses) else ""

            # Add inline concept links for key terms
            if orig_verses and v_idx < len(orig_verses):
                strongs_pairs = parse_strongs(orig_verses[v_idx])
                for word, num in strongs_pairs:
                    if num in SKIP_STRONGS:
                        continue
                    lookup = GREEK_STRONGS if is_nt else HEBREW_STRONGS
                    if num in lookup:
                        entry = lookup[num]
                        prefix = "G" if is_nt else "H"
                        # Find English word that might correspond and link it
                        # For now, add footnote reference
                        pass

            # Cross-ref footnotes for this verse
            verse_xref_markers = ""
            if v_num in chapter_xrefs:
                for xr in chapter_xrefs[v_num]:
                    to_book, to_ch, to_v = xr["to"]
                    to_name = NUM_TO_BOOK[to_book][1]
                    rel_type = classify_xref(book_num, to_book)
                    fn_text = f"[[bibles/NASB-IL/{to_name}/{to_name} {to_ch}#v{to_v}|{to_name} {to_ch}:{to_v} @{rel_type}]]"
                    footnotes.append((footnote_counter, fn_text, xr["votes"]))
                    verse_xref_markers += f"[^{footnote_counter}]"
                    footnote_counter += 1

            lines.append(f"<sup>{v_num}</sup> {verse_text}{verse_xref_markers}")
            lines.append("")

        # Interlinear code block for this pericope
        if orig_verses:
            lines.append(f"> [!{orig_lang.lower()}]- Interlinear \u2014 {name} {chapter}:{verse_range}")
            for v_idx in range(start_v - 1, min(end_v, num_verses)):
                v_num = v_idx + 1
                if v_idx >= len(orig_verses):
                    continue
                strongs_pairs = parse_strongs(orig_verses[v_idx])
                if not strongs_pairs:
                    continue

                lines.append(f"> **{v_num}**")
                lines.append(f"> | Original | Strong's | Gloss |")
                lines.append(f"> |---:|:---:|:---|")
                for word, num in strongs_pairs:
                    if num in SKIP_STRONGS:
                        lines.append(f"> | {word} | \u2014 | *[function word]* |")
                        continue
                    gloss_data = get_gloss(num, is_nt)
                    prefix = "G" if is_nt else "H"
                    subdir = "greek" if is_nt else "hebrew"
                    if gloss_data:
                        translit = gloss_data[1]
                        gloss = gloss_data[2]
                        lines.append(f"> | {word} | [[concepts/{subdir}/{prefix}{num} - {translit}\\|{prefix}{num}]] | {gloss} |")
                    else:
                        lines.append(f"> | {word} | {prefix}{num} | \u2014 |")
                lines.append(">")
            lines.append("")

    # Footer navigation
    lines.append("---")
    lines.append("")
    nav2 = []
    if chapter > 1:
        nav2.append(f"- [[bibles/NASB-IL/{name}/{name} {chapter - 1}|\u2190 {name} {chapter - 1}]]")
    if chapter < total_chapters:
        nav2.append(f"- [[bibles/NASB-IL/{name}/{name} {chapter + 1}|{name} {chapter + 1} \u2192]]")
    lines.extend(nav2)
    lines.append("")

    # Parallel versions
    lines.append(f"**Parallel:** [[bibles/KJV/{kjv_folder}/{name} ch: {chapter}|KJV]]")
    if book_num <= 39 and heb_name:
        wlca_f = WLCA_FOLDER.get(book_num, "")
        lines.append(f" | [[bibles/WLCa/{wlca_f}/{heb_name} {chapter}|Hebrew]]")
    if book_num >= 40 and grk_name:
        tisch_f = TISCH_FOLDER.get(book_num, "")
        lines.append(f" | [[bibles/TISCH/{tisch_f}/{grk_name} {chapter}|Greek]]")
    lines.append("")

    # Footnotes (cross-references with typed wikilinks)
    if footnotes:
        for fn_num, fn_text, votes in footnotes:
            lines.append(f"[^{fn_num}]: {fn_text} ({votes} votes)")

    return "\n".join(lines)


# ──────────────────────────────────────────────
# Book index generation
# ──────────────────────────────────────────────

def generate_book_index(book_num: int) -> str:
    book = NUM_TO_BOOK[book_num]
    name, heb_name, grk_name = book[1], book[2], book[3]
    total_chapters, genre, section = book[5], book[6], book[7]
    is_nt = book_num >= 40

    fm = [
        "---",
        "type: book",
        f"book.name: \"{name}\"",
        f"book.number: {book_num}",
        f"testament: {'NT' if is_nt else 'OT'}",
        f"section: \"{section}\"",
        f"genre: \"{genre}\"",
        f"chapters.total: {total_chapters}",
    ]
    if heb_name:
        fm.append(f"original.name: \"{heb_name}\"")
    if grk_name:
        fm.append(f"original.name: \"{grk_name}\"")
    fm.append("---")
    fm.append("")

    lines = list(fm)
    lines.append(f"# {name}")
    lines.append("")
    if heb_name:
        lines.append(f"*{heb_name}*")
        lines.append("")
    if grk_name:
        lines.append(f"*{grk_name}*")
        lines.append("")
    lines.append(f"**Section:** {section} | **Genre:** {genre} | **Chapters:** {total_chapters}")
    lines.append("")
    lines.append("## Chapters")
    lines.append("")
    for ch in range(1, total_chapters + 1):
        lines.append(f"- [[bibles/NASB-IL/{name}/{name} {ch}|Chapter {ch}]]")

    return "\n".join(lines)


# ──────────────────────────────────────────────
# Bible index generation
# ──────────────────────────────────────────────

def generate_bible_index() -> str:
    lines = [
        "---",
        "type: bible-index",
        "version: NASB-IL",
        "---",
        "",
        "# NASB Interlinear Bible",
        "",
        "NASB text with Hebrew/Greek interlinear, Strong's numbers, typed cross-references, and concept links.",
        "",
    ]

    current_section = ""
    for b in BOOKS:
        section = b[7]
        if section != current_section:
            current_section = section
            lines.append(f"## {section}")
            lines.append("")
        orig = f" (*{b[2]}*)" if b[2] else (f" (*{b[3]}*)" if b[3] else "")
        lines.append(f"- [[bibles/NASB-IL/{b[1]}/-- {b[1]} --|{b[1]}]]{orig}")
    lines.append("")

    return "\n".join(lines)


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    xrefs = load_cross_references()

    # Clean output
    if OUTPUT_DIR.exists():
        import shutil
        shutil.rmtree(OUTPUT_DIR)

    total_generated = 0
    total_skipped = 0

    for book_num, name, heb_name, grk_name, abbrev, num_chapters, genre, section in BOOKS:
        book_dir = OUTPUT_DIR / name
        book_dir.mkdir(parents=True, exist_ok=True)

        print(f"Processing {name} ({num_chapters} chapters)...", end=" ", flush=True)
        book_count = 0

        for chapter in range(1, num_chapters + 1):
            content = generate_chapter(book_num, chapter, xrefs)
            if not content:
                total_skipped += 1
                continue
            out_path = book_dir / f"{name} {chapter}.md"
            out_path.write_text(content, encoding="utf-8")
            total_generated += 1
            book_count += 1

        # Book index
        index_content = generate_book_index(book_num)
        (book_dir / f"-- {name} --.md").write_text(index_content, encoding="utf-8")

        print(f"{book_count} chapters")

    # Bible index
    bible_idx = generate_bible_index()
    (OUTPUT_DIR / "-- Bible --.md").write_text(bible_idx, encoding="utf-8")

    print(f"\nDone! Generated {total_generated} chapters, skipped {total_skipped}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
