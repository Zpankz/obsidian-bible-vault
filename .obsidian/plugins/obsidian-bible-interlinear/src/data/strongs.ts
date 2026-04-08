/**
 * Strong's number lexicon and parser.
 * Extracts word-strongs pairs from tagged Hebrew/Greek text.
 */

export interface StrongsEntry {
	original: string;
	transliteration: string;
	gloss: string;
}

export interface WordStrongs {
	word: string;
	strongs: number;
	prefix: "H" | "G";
	entry?: StrongsEntry;
}

/** Parse <S>NNNN</S> tagged text into word-strongs pairs */
export function parseStrongsText(text: string, isNT: boolean): WordStrongs[] {
	const pairs: WordStrongs[] = [];
	const parts = text.split(/<S>(\d+)<\/S>/);
	const prefix = isNT ? "G" : "H";

	for (let i = 0; i < parts.length - 1; i += 2) {
		const chunk = parts[i].trim();
		const words = chunk.replace(/־/g, " ").split(/\s+/);
		let word = words[words.length - 1] || "";
		word = word.replace(/[׃׀,.:;·]/g, "").trim();
		const num = parseInt(parts[i + 1], 10);

		if (word && num > 0) {
			pairs.push({
				word,
				strongs: num,
				prefix,
				entry: getStrongsEntry(num, isNT),
			});
		}
	}
	return pairs;
}

/** Function words to skip in interlinear display */
const SKIP_STRONGS = new Set([
	853, 5921, 834, 3588, 3605, 413, 3651, // Hebrew
]);

const SKIP_GREEK = new Set([
	3588, 1161, 2532, 1722, 1537, 3739, 3778, 1063,
	2443, 575, 2596, 5259, 4314, 846, 3956, 3767,
	3754, 3756, 2228, 3361,
]);

export function isSkippable(strongs: number, isNT: boolean): boolean {
	return isNT ? SKIP_GREEK.has(strongs) : SKIP_STRONGS.has(strongs);
}

/** Get a Strong's dictionary entry */
export function getStrongsEntry(num: number, isNT: boolean): StrongsEntry | undefined {
	return isNT ? GREEK_LEXICON.get(num) : HEBREW_LEXICON.get(num);
}

/** Get concept note path for a Strong's number */
export function getConceptPath(num: number, isNT: boolean): string | undefined {
	const entry = getStrongsEntry(num, isNT);
	if (!entry) return undefined;
	const prefix = isNT ? "G" : "H";
	const subdir = isNT ? "greek" : "hebrew";
	return `concepts/${subdir}/${prefix}${num} - ${entry.transliteration}`;
}

// ── Hebrew Lexicon ──

const HEBREW_LEXICON = new Map<number, StrongsEntry>([
	[1, { original: "אָב", transliteration: "av", gloss: "father" }],
	[113, { original: "אָדוֹן", transliteration: "adon", gloss: "lord, master" }],
	[120, { original: "אָדָם", transliteration: "adam", gloss: "man, mankind" }],
	[136, { original: "אֲדֹנָי", transliteration: "Adonai", gloss: "Lord, master" }],
	[157, { original: "אָהַב", transliteration: "ahav", gloss: "to love" }],
	[216, { original: "אוֹר", transliteration: "or", gloss: "light" }],
	[226, { original: "אוֹת", transliteration: "ot", gloss: "sign, wonder" }],
	[259, { original: "אֶחָד", transliteration: "echad", gloss: "one, united" }],
	[410, { original: "אֵל", transliteration: "El", gloss: "God, mighty one" }],
	[430, { original: "אֱלֹהִים", transliteration: "Elohim", gloss: "God" }],
	[539, { original: "אָמַן", transliteration: "aman", gloss: "to believe" }],
	[559, { original: "אָמַר", transliteration: "amar", gloss: "to say" }],
	[571, { original: "אֱמֶת", transliteration: "emeth", gloss: "truth" }],
	[776, { original: "אֶרֶץ", transliteration: "erets", gloss: "earth, land" }],
	[853, { original: "אֵת", transliteration: "et", gloss: "[obj. marker]" }],
	[914, { original: "בָּדַל", transliteration: "badal", gloss: "to separate" }],
	[922, { original: "בֹּהוּ", transliteration: "bohu", gloss: "emptiness, void" }],
	[996, { original: "בֵּין", transliteration: "beyn", gloss: "between" }],
	[1242, { original: "בֹּקֶר", transliteration: "boqer", gloss: "morning" }],
	[1254, { original: "בָּרָא", transliteration: "bara", gloss: "to create" }],
	[1285, { original: "בְּרִית", transliteration: "berith", gloss: "covenant" }],
	[1288, { original: "בָּרַךְ", transliteration: "barak", gloss: "to bless" }],
	[1121, { original: "בֵּן", transliteration: "ben", gloss: "son" }],
	[1350, { original: "גָּאַל", transliteration: "gaal", gloss: "to redeem" }],
	[1697, { original: "דָּבָר", transliteration: "davar", gloss: "word, matter" }],
	[1818, { original: "דָּם", transliteration: "dam", gloss: "blood" }],
	[1870, { original: "דֶּרֶךְ", transliteration: "derek", gloss: "way, path" }],
	[1961, { original: "הָיָה", transliteration: "hayah", gloss: "to be, become" }],
	[2009, { original: "הִנֵּה", transliteration: "hinneh", gloss: "behold" }],
	[2403, { original: "חַטָּאת", transliteration: "chattath", gloss: "sin" }],
	[2416, { original: "חַי", transliteration: "chay", gloss: "living, life" }],
	[2580, { original: "חֵן", transliteration: "chen", gloss: "grace, favor" }],
	[2617, { original: "חֶסֶד", transliteration: "chesed", gloss: "lovingkindness" }],
	[2822, { original: "חֹשֶׁךְ", transliteration: "choshek", gloss: "darkness" }],
	[2896, { original: "טוֹב", transliteration: "tov", gloss: "good" }],
	[3027, { original: "יָד", transliteration: "yad", gloss: "hand" }],
	[3045, { original: "יָדַע", transliteration: "yada", gloss: "to know" }],
	[3068, { original: "יהוה", transliteration: "YHWH", gloss: "the LORD" }],
	[3117, { original: "יוֹם", transliteration: "yom", gloss: "day" }],
	[3220, { original: "יָם", transliteration: "yam", gloss: "sea" }],
	[3372, { original: "יָרֵא", transliteration: "yare", gloss: "to fear, revere" }],
	[3444, { original: "יְשׁוּעָה", transliteration: "yeshuah", gloss: "salvation" }],
	[3519, { original: "כָּבוֹד", transliteration: "kavod", gloss: "glory" }],
	[3548, { original: "כֹּהֵן", transliteration: "kohen", gloss: "priest" }],
	[3722, { original: "כָּפַר", transliteration: "kaphar", gloss: "to atone" }],
	[3820, { original: "לֵב", transliteration: "lev", gloss: "heart" }],
	[3915, { original: "לַיִל", transliteration: "layil", gloss: "night" }],
	[4150, { original: "מוֹעֵד", transliteration: "moed", gloss: "appointed time" }],
	[4325, { original: "מַיִם", transliteration: "mayim", gloss: "water" }],
	[4397, { original: "מַלְאָךְ", transliteration: "malak", gloss: "angel, messenger" }],
	[4428, { original: "מֶלֶךְ", transliteration: "melek", gloss: "king" }],
	[4899, { original: "מָשִׁיחַ", transliteration: "mashiach", gloss: "anointed one" }],
	[4941, { original: "מִשְׁפָּט", transliteration: "mishpat", gloss: "justice" }],
	[5030, { original: "נָבִיא", transliteration: "navi", gloss: "prophet" }],
	[5315, { original: "נֶפֶשׁ", transliteration: "nephesh", gloss: "soul, life" }],
	[5414, { original: "נָתַן", transliteration: "natan", gloss: "to give" }],
	[5545, { original: "סָלַח", transliteration: "salach", gloss: "to forgive" }],
	[5650, { original: "עֶבֶד", transliteration: "eved", gloss: "servant" }],
	[5769, { original: "עוֹלָם", transliteration: "olam", gloss: "eternity" }],
	[5771, { original: "עָוֹן", transliteration: "avon", gloss: "iniquity" }],
	[5921, { original: "עַל", transliteration: "al", gloss: "upon, over" }],
	[5930, { original: "עֹלָה", transliteration: "olah", gloss: "burnt offering" }],
	[5971, { original: "עַם", transliteration: "am", gloss: "people" }],
	[6213, { original: "עָשָׂה", transliteration: "asah", gloss: "to do, make" }],
	[6440, { original: "פָּנִים", transliteration: "panim", gloss: "face" }],
	[6529, { original: "פְּרִי", transliteration: "peri", gloss: "fruit" }],
	[6754, { original: "צֶלֶם", transliteration: "tselem", gloss: "image" }],
	[6944, { original: "קֹדֶשׁ", transliteration: "qodesh", gloss: "holiness" }],
	[7121, { original: "קָרָא", transliteration: "qara", gloss: "to call" }],
	[7200, { original: "רָאָה", transliteration: "raah", gloss: "to see" }],
	[7225, { original: "רֵאשִׁית", transliteration: "reshith", gloss: "beginning" }],
	[7287, { original: "רָדָה", transliteration: "radah", gloss: "to rule" }],
	[7307, { original: "רוּחַ", transliteration: "ruach", gloss: "spirit, wind" }],
	[7363, { original: "רָחַף", transliteration: "rachaf", gloss: "to hover" }],
	[7549, { original: "רָקִיעַ", transliteration: "raqia", gloss: "expanse" }],
	[7706, { original: "שַׁדַּי", transliteration: "Shaddai", gloss: "Almighty" }],
	[7965, { original: "שָׁלוֹם", transliteration: "shalom", gloss: "peace" }],
	[8064, { original: "שָׁמַיִם", transliteration: "shamayim", gloss: "heavens" }],
	[8034, { original: "שֵׁם", transliteration: "shem", gloss: "name" }],
	[8085, { original: "שָׁמַע", transliteration: "shama", gloss: "to hear" }],
	[8104, { original: "שָׁמַר", transliteration: "shamar", gloss: "to keep, guard" }],
	[8414, { original: "תֹּהוּ", transliteration: "tohu", gloss: "formless" }],
	[8415, { original: "תְּהוֹם", transliteration: "tehom", gloss: "the deep" }],
	[8451, { original: "תּוֹרָה", transliteration: "torah", gloss: "law, instruction" }],
]);

// ── Greek Lexicon ──

const GREEK_LEXICON = new Map<number, StrongsEntry>([
	[11, { original: "Ἀβραάμ", transliteration: "Abraam", gloss: "Abraham" }],
	[25, { original: "ἀγαπάω", transliteration: "agapao", gloss: "to love" }],
	[26, { original: "ἀγάπη", transliteration: "agape", gloss: "love" }],
	[32, { original: "ἄγγελος", transliteration: "angelos", gloss: "angel" }],
	[40, { original: "ἅγιος", transliteration: "hagios", gloss: "holy" }],
	[80, { original: "ἀδελφός", transliteration: "adelphos", gloss: "brother" }],
	[129, { original: "αἷμα", transliteration: "haima", gloss: "blood" }],
	[165, { original: "αἰών", transliteration: "aion", gloss: "age, eternity" }],
	[225, { original: "ἀλήθεια", transliteration: "aletheia", gloss: "truth" }],
	[266, { original: "ἁμαρτία", transliteration: "hamartia", gloss: "sin" }],
	[386, { original: "ἀνάστασις", transliteration: "anastasis", gloss: "resurrection" }],
	[444, { original: "ἄνθρωπος", transliteration: "anthropos", gloss: "man, person" }],
	[575, { original: "ἀπό", transliteration: "apo", gloss: "from" }],
	[649, { original: "ἀπόστολος", transliteration: "apostolos", gloss: "apostle" }],
	[746, { original: "ἀρχή", transliteration: "arche", gloss: "beginning" }],
	[846, { original: "αὐτός", transliteration: "autos", gloss: "he/she/it" }],
	[907, { original: "βαπτίζω", transliteration: "baptizo", gloss: "to baptize" }],
	[932, { original: "βασιλεία", transliteration: "basileia", gloss: "kingdom" }],
	[976, { original: "βίβλος", transliteration: "biblos", gloss: "book" }],
	[1078, { original: "γένεσις", transliteration: "genesis", gloss: "origin" }],
	[1080, { original: "γεννάω", transliteration: "gennao", gloss: "to beget" }],
	[1093, { original: "γῆ", transliteration: "ge", gloss: "earth, land" }],
	[1096, { original: "γίνομαι", transliteration: "ginomai", gloss: "to become" }],
	[1097, { original: "γινώσκω", transliteration: "ginosko", gloss: "to know" }],
	[1138, { original: "Δαυείδ", transliteration: "Daueid", gloss: "David" }],
	[1161, { original: "δέ", transliteration: "de", gloss: "but, and" }],
	[1242, { original: "διαθήκη", transliteration: "diatheke", gloss: "covenant" }],
	[1343, { original: "δικαιοσύνη", transliteration: "dikaiosyne", gloss: "righteousness" }],
	[1391, { original: "δόξα", transliteration: "doxa", gloss: "glory" }],
	[1411, { original: "δύναμις", transliteration: "dynamis", gloss: "power" }],
	[1453, { original: "ἐγείρω", transliteration: "egeiro", gloss: "to raise up" }],
	[1510, { original: "εἰμί", transliteration: "eimi", gloss: "to be" }],
	[1515, { original: "εἰρήνη", transliteration: "eirene", gloss: "peace" }],
	[1519, { original: "εἰς", transliteration: "eis", gloss: "into, to" }],
	[1537, { original: "ἐκ", transliteration: "ek", gloss: "out of, from" }],
	[1577, { original: "ἐκκλησία", transliteration: "ekklesia", gloss: "church" }],
	[1680, { original: "ἐλπίς", transliteration: "elpis", gloss: "hope" }],
	[1722, { original: "ἐν", transliteration: "en", gloss: "in, among" }],
	[1849, { original: "ἐξουσία", transliteration: "exousia", gloss: "authority" }],
	[2064, { original: "ἔρχομαι", transliteration: "erchomai", gloss: "to come" }],
	[2098, { original: "εὐαγγέλιον", transliteration: "euangelion", gloss: "gospel" }],
	[2192, { original: "ἔχω", transliteration: "echo", gloss: "to have" }],
	[2222, { original: "ζωή", transliteration: "zoe", gloss: "life" }],
	[2288, { original: "θάνατος", transliteration: "thanatos", gloss: "death" }],
	[2316, { original: "θεός", transliteration: "theos", gloss: "God" }],
	[2384, { original: "Ἰακώβ", transliteration: "Iakob", gloss: "Jacob" }],
	[2424, { original: "Ἰησοῦς", transliteration: "Iesous", gloss: "Jesus" }],
	[2455, { original: "Ἰούδας", transliteration: "Ioudas", gloss: "Judah" }],
	[2464, { original: "Ἰσαάκ", transliteration: "Isaak", gloss: "Isaac" }],
	[2532, { original: "καί", transliteration: "kai", gloss: "and, also" }],
	[2588, { original: "καρδία", transliteration: "kardia", gloss: "heart" }],
	[2889, { original: "κόσμος", transliteration: "kosmos", gloss: "world" }],
	[2962, { original: "κύριος", transliteration: "kyrios", gloss: "Lord" }],
	[3004, { original: "λέγω", transliteration: "lego", gloss: "to say" }],
	[3056, { original: "λόγος", transliteration: "logos", gloss: "word" }],
	[3101, { original: "μαθητής", transliteration: "mathetes", gloss: "disciple" }],
	[3340, { original: "μετανοέω", transliteration: "metanoeo", gloss: "to repent" }],
	[3551, { original: "νόμος", transliteration: "nomos", gloss: "law" }],
	[3588, { original: "ὁ", transliteration: "ho", gloss: "the" }],
	[3739, { original: "ὅς", transliteration: "hos", gloss: "who, which" }],
	[3772, { original: "οὐρανός", transliteration: "ouranos", gloss: "heaven" }],
	[3875, { original: "παράκλητος", transliteration: "parakletos", gloss: "advocate" }],
	[3956, { original: "πᾶς", transliteration: "pas", gloss: "all, every" }],
	[3962, { original: "πατήρ", transliteration: "pater", gloss: "father" }],
	[4100, { original: "πιστεύω", transliteration: "pisteuo", gloss: "to believe" }],
	[4102, { original: "πίστις", transliteration: "pistis", gloss: "faith" }],
	[4137, { original: "πληρόω", transliteration: "pleroo", gloss: "to fulfill" }],
	[4151, { original: "πνεῦμα", transliteration: "pneuma", gloss: "spirit" }],
	[4160, { original: "ποιέω", transliteration: "poieo", gloss: "to do, make" }],
	[4396, { original: "προφήτης", transliteration: "prophetes", gloss: "prophet" }],
	[4561, { original: "σάρξ", transliteration: "sarx", gloss: "flesh" }],
	[4982, { original: "σώζω", transliteration: "sozo", gloss: "to save" }],
	[4991, { original: "σωτηρία", transliteration: "soteria", gloss: "salvation" }],
	[5043, { original: "τέκνον", transliteration: "teknon", gloss: "child" }],
	[5207, { original: "υἱός", transliteration: "huios", gloss: "son" }],
	[5329, { original: "Φάρες", transliteration: "Phares", gloss: "Perez" }],
	[5485, { original: "χάρις", transliteration: "charis", gloss: "grace" }],
	[5547, { original: "Χριστός", transliteration: "Christos", gloss: "Christ" }],
	[5590, { original: "ψυχή", transliteration: "psuche", gloss: "soul, life" }],
]);
