/**
 * Book registry for all 66 canonical books.
 * Provides IDs, names, chapter counts, original-language names, and aliases.
 */

export interface BookInfo {
	id: number;
	name: string;
	originalName: string;
	chapters: number;
	testament: "OT" | "NT";
	aliases: string[];
}

export const BOOKS: BookInfo[] = [
	// --- Old Testament ---
	{ id: 1,  name: "Genesis",       originalName: "בְּרֵאשִׁית",    chapters: 50, testament: "OT", aliases: ["Gen", "Ge", "Gn", "1Mo", "1 Mo", "1Mos", "1 Mos", "1Moses", "1 Moses", "Genes", "Gns"] },
	{ id: 2,  name: "Exodus",        originalName: "שְׁמוֹת",       chapters: 40, testament: "OT", aliases: ["Exod", "Exo", "Ex", "2Mo", "2 Mo", "2Mos", "2 Mos", "2Moses", "2 Moses", "Exd", "Exs"] },
	{ id: 3,  name: "Leviticus",     originalName: "וַיִּקְרָא",     chapters: 27, testament: "OT", aliases: ["Lev", "Le", "Lv", "3Mo", "3 Mo", "3Mos", "3 Mos", "3Moses", "3 Moses", "Levit", "Lvt"] },
	{ id: 4,  name: "Numbers",       originalName: "בְּמִדְבַּר",    chapters: 36, testament: "OT", aliases: ["Num", "Nu", "Nm", "Nb", "4Mo", "4 Mo", "4Mos", "4 Mos", "4Moses", "4 Moses", "Numb"] },
	{ id: 5,  name: "Deuteronomy",   originalName: "דְּבָרִים",      chapters: 34, testament: "OT", aliases: ["Deut", "Deu", "De", "Dt", "5Mo", "5 Mo", "5Mos", "5 Mos", "5Moses", "5 Moses", "Dtr"] },
	{ id: 6,  name: "Joshua",        originalName: "יְהוֹשֻׁעַ",     chapters: 24, testament: "OT", aliases: ["Josh", "Jos", "Jsh", "Josua", "Josu", "Josa", "Joh", "Jshua", "Js", "Jo", "Jsa"] },
	{ id: 7,  name: "Judges",        originalName: "שׁוֹפְטִים",     chapters: 21, testament: "OT", aliases: ["Judg", "Jdg", "Jg", "Jdgs", "Judgs", "Jud", "Ri", "Richt", "Richter", "Jges", "Jgs"] },
	{ id: 8,  name: "Ruth",          originalName: "רוּת",           chapters: 4,  testament: "OT", aliases: ["Rth", "Ru", "Rut", "Rt", "Rth", "Ruta", "Rh", "Roo", "Rutha", "Rta", "Rooth"] },
	{ id: 9,  name: "1 Samuel",      originalName: "שְׁמוּאֵל א",    chapters: 31, testament: "OT", aliases: ["1Sam", "1 Sam", "1Sa", "1 Sa", "1Sm", "1 Sm", "I Sam", "I Sa", "1st Samuel", "1st Sam", "1S"] },
	{ id: 10, name: "2 Samuel",      originalName: "שְׁמוּאֵל ב",    chapters: 24, testament: "OT", aliases: ["2Sam", "2 Sam", "2Sa", "2 Sa", "2Sm", "2 Sm", "II Sam", "II Sa", "2nd Samuel", "2nd Sam", "2S"] },
	{ id: 11, name: "1 Kings",       originalName: "מְלָכִים א",     chapters: 22, testament: "OT", aliases: ["1Kgs", "1 Kgs", "1Ki", "1 Ki", "1Kin", "1 Kin", "I Kings", "I Ki", "1st Kings", "1st Kgs", "1K"] },
	{ id: 12, name: "2 Kings",       originalName: "מְלָכִים ב",     chapters: 25, testament: "OT", aliases: ["2Kgs", "2 Kgs", "2Ki", "2 Ki", "2Kin", "2 Kin", "II Kings", "II Ki", "2nd Kings", "2nd Kgs", "2K"] },
	{ id: 13, name: "1 Chronicles",  originalName: "דִּבְרֵי הַיָּמִים א", chapters: 29, testament: "OT", aliases: ["1Chr", "1 Chr", "1Ch", "1 Ch", "I Chr", "1Chron", "1 Chron", "I Chronicles", "1st Chronicles", "1st Chr", "1Cr"] },
	{ id: 14, name: "2 Chronicles",  originalName: "דִּבְרֵי הַיָּמִים ב", chapters: 36, testament: "OT", aliases: ["2Chr", "2 Chr", "2Ch", "2 Ch", "II Chr", "2Chron", "2 Chron", "II Chronicles", "2nd Chronicles", "2nd Chr", "2Cr"] },
	{ id: 15, name: "Ezra",          originalName: "עֶזְרָא",        chapters: 10, testament: "OT", aliases: ["Ezr", "Ez", "Esr", "Esra", "Ezra", "Ea", "Era", "Ezraa", "Ezo", "Eza", "Ezar"] },
	{ id: 16, name: "Nehemiah",      originalName: "נְחֶמְיָה",      chapters: 13, testament: "OT", aliases: ["Neh", "Ne", "Nehem", "Nhem", "Nehm", "Nhe", "Nhm", "Nehemia", "Nehemija", "Neem", "Nemi"] },
	{ id: 17, name: "Esther",        originalName: "אֶסְתֵּר",       chapters: 10, testament: "OT", aliases: ["Esth", "Est", "Es", "Ester", "Estr", "Esth", "Etr", "Esthr", "Esto", "Esta", "Esthe"] },
	{ id: 18, name: "Job",           originalName: "אִיּוֹב",        chapters: 42, testament: "OT", aliases: ["Jb", "Jo", "Hiob", "Hio", "Ijob", "Ijb", "Iob", "Jab", "Joab", "Jobe", "Jobb"] },
	{ id: 19, name: "Psalms",        originalName: "תְּהִלִּים",     chapters: 150, testament: "OT", aliases: ["Ps", "Psa", "Psm", "Pss", "Psalm", "Pslm", "Plm", "Pl", "Psal", "Psalmen", "Pslms"] },
	{ id: 20, name: "Proverbs",      originalName: "מִשְׁלֵי",       chapters: 31, testament: "OT", aliases: ["Prov", "Pro", "Pr", "Prv", "Prvbs", "Prvb", "Pv", "Prbs", "Prob", "Prove", "Provs"] },
	{ id: 21, name: "Ecclesiastes",  originalName: "קֹהֶלֶת",        chapters: 12, testament: "OT", aliases: ["Eccl", "Ecc", "Ec", "Eccles", "Ecclst", "Qoh", "Qoheleth", "Pred", "Prediger", "Eccle", "Ecl"] },
	{ id: 22, name: "Song of Solomon", originalName: "שִׁיר הַשִּׁירִים", chapters: 8, testament: "OT", aliases: ["Song", "SOS", "So", "SS", "Cant", "Canticles", "Song of Songs", "Sng", "Songs", "Sol", "SoS"] },
	{ id: 23, name: "Isaiah",        originalName: "יְשַׁעְיָהוּ",   chapters: 66, testament: "OT", aliases: ["Isa", "Is", "Jes", "Jesaja", "Isai", "Isah", "Isaia", "Isaj", "Ia", "Isaa", "Isai"] },
	{ id: 24, name: "Jeremiah",      originalName: "יִרְמְיָהוּ",    chapters: 52, testament: "OT", aliases: ["Jer", "Je", "Jr", "Jere", "Jerem", "Jeremia", "Jerm", "Jra", "Jrem", "Jerea", "Jrm"] },
	{ id: 25, name: "Lamentations",  originalName: "אֵיכָה",         chapters: 5,  testament: "OT", aliases: ["Lam", "La", "Lament", "Lmnt", "Lmn", "Klgl", "Klag", "Klagel", "Lme", "Lams", "Lamn"] },
	{ id: 26, name: "Ezekiel",       originalName: "יְחֶזְקֵאל",     chapters: 48, testament: "OT", aliases: ["Ezek", "Eze", "Ezk", "Hes", "Hesek", "Hesekiel", "Ezkl", "Ezel", "Ezl", "Ezke", "Ezkl"] },
	{ id: 27, name: "Daniel",        originalName: "דָּנִיֵּאל",      chapters: 12, testament: "OT", aliases: ["Dan", "Da", "Dn", "Danl", "Dani", "Danl", "Dnl", "Dane", "Dna", "Dann", "Danil"] },
	{ id: 28, name: "Hosea",         originalName: "הוֹשֵׁעַ",       chapters: 14, testament: "OT", aliases: ["Hos", "Ho", "Hse", "Hosea", "Hosa", "Hsea", "Hoe", "Hoes", "Hoea", "Hosa", "Hosee"] },
	{ id: 29, name: "Joel",          originalName: "יוֹאֵל",         chapters: 3,  testament: "OT", aliases: ["Joe", "Jl", "Joel", "Jol", "Jle", "Joal", "Jeel", "Jol", "Joell", "Jael", "Jel"] },
	{ id: 30, name: "Amos",          originalName: "עָמוֹס",         chapters: 9,  testament: "OT", aliases: ["Am", "Amo", "Ams", "Amss", "Amso", "Amosa", "Amoos", "Amos", "Amoa", "Amoe", "Amoq"] },
	{ id: 31, name: "Obadiah",       originalName: "עוֹבַדְיָה",     chapters: 1,  testament: "OT", aliases: ["Obad", "Ob", "Oba", "Obd", "Obda", "Obadi", "Obadj", "Obdia", "Obah", "Obai", "Obdh"] },
	{ id: 32, name: "Jonah",         originalName: "יוֹנָה",         chapters: 4,  testament: "OT", aliases: ["Jon", "Jnh", "Jna", "Jonah", "Jona", "Jonh", "Jnh", "Jnah", "Jnha", "Jone", "Jns"] },
	{ id: 33, name: "Micah",         originalName: "מִיכָה",         chapters: 7,  testament: "OT", aliases: ["Mic", "Mi", "Mica", "Micha", "Mch", "Mca", "Mich", "Mcah", "Mia", "Mcb", "Mik"] },
	{ id: 34, name: "Nahum",         originalName: "נַחוּם",         chapters: 3,  testament: "OT", aliases: ["Nah", "Na", "Nahm", "Nahu", "Nhm", "Nahum", "Nah", "Naam", "Naum", "Nha", "Nhum"] },
	{ id: 35, name: "Habakkuk",      originalName: "חֲבַקּוּק",      chapters: 3,  testament: "OT", aliases: ["Hab", "Hb", "Habk", "Habak", "Hbk", "Habakk", "Habb", "Habq", "Hbk", "Habkk", "Hak"] },
	{ id: 36, name: "Zephaniah",     originalName: "צְפַנְיָה",      chapters: 3,  testament: "OT", aliases: ["Zeph", "Zep", "Zp", "Zph", "Zepha", "Zephn", "Zphn", "Zefa", "Zef", "Zphn", "Zpn"] },
	{ id: 37, name: "Haggai",        originalName: "חַגַּי",         chapters: 2,  testament: "OT", aliases: ["Hag", "Hg", "Hagg", "Hagga", "Hagi", "Haggai", "Hagg", "Haga", "Hga", "Hge", "Hgai"] },
	{ id: 38, name: "Zechariah",     originalName: "זְכַרְיָה",      chapters: 14, testament: "OT", aliases: ["Zech", "Zec", "Zc", "Zch", "Zach", "Zachar", "Zchar", "Zecha", "Zchr", "Sach", "Sech"] },
	{ id: 39, name: "Malachi",       originalName: "מַלְאָכִי",      chapters: 4,  testament: "OT", aliases: ["Mal", "Ml", "Malach", "Mala", "Mlch", "Malc", "Malak", "Mlk", "Male", "Malk", "Mlac"] },

	// --- New Testament ---
	{ id: 40, name: "Matthew",       originalName: "Μαθθαῖος",      chapters: 28, testament: "NT", aliases: ["Matt", "Mat", "Mt", "Matth", "Mtt", "Matthw", "Mthw", "Mth", "Mw", "Mtw", "Matw"] },
	{ id: 41, name: "Mark",          originalName: "Μάρκος",         chapters: 16, testament: "NT", aliases: ["Mrk", "Mk", "Mr", "Marc", "Mrc", "Mrks", "Marca", "Mkr", "Mak", "Mrka", "Mks"] },
	{ id: 42, name: "Luke",          originalName: "Λουκᾶς",         chapters: 24, testament: "NT", aliases: ["Luk", "Lk", "Lu", "Lke", "Luc", "Luka", "Lukas", "Lks", "Lku", "Lca", "Luk"] },
	{ id: 43, name: "John",          originalName: "Ἰωάννης",        chapters: 21, testament: "NT", aliases: ["Jn", "Jhn", "Joh", "Jno", "Jo", "Jhn", "Johnn", "Jhon", "Joan", "Joha", "Jnhn"] },
	{ id: 44, name: "Acts",          originalName: "Πράξεις",        chapters: 28, testament: "NT", aliases: ["Act", "Ac", "Acs", "Acts", "Acta", "Apg", "Apostelg", "Akt", "Actos", "Acos", "Acte"] },
	{ id: 45, name: "Romans",        originalName: "Ρωμαίους",       chapters: 16, testament: "NT", aliases: ["Rom", "Ro", "Rm", "Roma", "Rmn", "Rmns", "Roms", "Romn", "Rma", "Roe", "Romns"] },
	{ id: 46, name: "1 Corinthians", originalName: "Κορινθίους Α",   chapters: 16, testament: "NT", aliases: ["1Cor", "1 Cor", "1Co", "1 Co", "I Cor", "1Corinth", "1 Corinth", "I Corinthians", "1st Corinthians", "1st Cor", "1C"] },
	{ id: 47, name: "2 Corinthians", originalName: "Κορινθίους Β",   chapters: 13, testament: "NT", aliases: ["2Cor", "2 Cor", "2Co", "2 Co", "II Cor", "2Corinth", "2 Corinth", "II Corinthians", "2nd Corinthians", "2nd Cor", "2C"] },
	{ id: 48, name: "Galatians",     originalName: "Γαλάτας",        chapters: 6,  testament: "NT", aliases: ["Gal", "Ga", "Gl", "Galat", "Galatia", "Gala", "Galt", "Gals", "Gltn", "Gla", "Galn"] },
	{ id: 49, name: "Ephesians",     originalName: "Ἐφεσίους",       chapters: 6,  testament: "NT", aliases: ["Eph", "Ep", "Ephes", "Ephe", "Ephs", "Ephsn", "Epha", "Ephn", "Epe", "Eph", "Epi"] },
	{ id: 50, name: "Philippians",   originalName: "Φιλιππησίους",    chapters: 4,  testament: "NT", aliases: ["Phil", "Php", "Pp", "Phili", "Philip", "Phl", "Philp", "Phli", "Phip", "Phils", "Phillp"] },
	{ id: 51, name: "Colossians",    originalName: "Κολοσσαεῖς",     chapters: 4,  testament: "NT", aliases: ["Col", "Cl", "Cols", "Colos", "Coloss", "Colo", "Cla", "Clsn", "Coln", "Cola", "Coll"] },
	{ id: 52, name: "1 Thessalonians", originalName: "Θεσσαλονικεῖς Α", chapters: 5, testament: "NT", aliases: ["1Thess", "1 Thess", "1Th", "1 Th", "I Thess", "1Thessalonians", "I Thessalonians", "1st Thessalonians", "1st Thess", "1Ts", "1Thes"] },
	{ id: 53, name: "2 Thessalonians", originalName: "Θεσσαλονικεῖς Β", chapters: 3, testament: "NT", aliases: ["2Thess", "2 Thess", "2Th", "2 Th", "II Thess", "2Thessalonians", "II Thessalonians", "2nd Thessalonians", "2nd Thess", "2Ts", "2Thes"] },
	{ id: 54, name: "1 Timothy",     originalName: "Τιμόθεον Α",     chapters: 6,  testament: "NT", aliases: ["1Tim", "1 Tim", "1Ti", "1 Ti", "I Tim", "I Timothy", "1st Timothy", "1st Tim", "1Tm", "1Timo", "1Ty"] },
	{ id: 55, name: "2 Timothy",     originalName: "Τιμόθεον Β",     chapters: 4,  testament: "NT", aliases: ["2Tim", "2 Tim", "2Ti", "2 Ti", "II Tim", "II Timothy", "2nd Timothy", "2nd Tim", "2Tm", "2Timo", "2Ty"] },
	{ id: 56, name: "Titus",         originalName: "Τίτον",          chapters: 3,  testament: "NT", aliases: ["Tit", "Ti", "Tts", "Titu", "Titos", "Tts", "Tta", "Tita", "Titn", "Tiut", "Tite"] },
	{ id: 57, name: "Philemon",      originalName: "Φιλήμονα",       chapters: 1,  testament: "NT", aliases: ["Phlm", "Phm", "Pm", "Philem", "Philm", "Phile", "Phlmn", "Phln", "Phlem", "Phla", "Plm"] },
	{ id: 58, name: "Hebrews",       originalName: "Ἑβραίους",       chapters: 13, testament: "NT", aliases: ["Heb", "He", "Hbr", "Hebr", "Hebs", "Hbrs", "Hebrw", "Hbrw", "Hba", "Hbe", "Hbre"] },
	{ id: 59, name: "James",         originalName: "Ἰάκωβος",        chapters: 5,  testament: "NT", aliases: ["Jas", "Jm", "Jam", "Jms", "Jak", "Jako", "Jakobus", "Jame", "Jams", "Jma", "Jmb"] },
	{ id: 60, name: "1 Peter",       originalName: "Πέτρου Α",       chapters: 5,  testament: "NT", aliases: ["1Pet", "1 Pet", "1Pe", "1 Pe", "1Pt", "1 Pt", "I Pet", "I Peter", "1st Peter", "1st Pet", "1P"] },
	{ id: 61, name: "2 Peter",       originalName: "Πέτρου Β",       chapters: 3,  testament: "NT", aliases: ["2Pet", "2 Pet", "2Pe", "2 Pe", "2Pt", "2 Pt", "II Pet", "II Peter", "2nd Peter", "2nd Pet", "2P"] },
	{ id: 62, name: "1 John",        originalName: "Ἰωάννου Α",      chapters: 5,  testament: "NT", aliases: ["1Jn", "1 Jn", "1John", "1 John", "1Jo", "1 Jo", "I John", "I Jn", "1st John", "1st Jn", "1J"] },
	{ id: 63, name: "2 John",        originalName: "Ἰωάννου Β",      chapters: 1,  testament: "NT", aliases: ["2Jn", "2 Jn", "2John", "2 John", "2Jo", "2 Jo", "II John", "II Jn", "2nd John", "2nd Jn", "2J"] },
	{ id: 64, name: "3 John",        originalName: "Ἰωάννου Γ",      chapters: 1,  testament: "NT", aliases: ["3Jn", "3 Jn", "3John", "3 John", "3Jo", "3 Jo", "III John", "III Jn", "3rd John", "3rd Jn", "3J"] },
	{ id: 65, name: "Jude",          originalName: "Ἰούδας",         chapters: 1,  testament: "NT", aliases: ["Jud", "Jde", "Jd", "Jude", "Judas", "Jda", "Jdee", "Jdu", "Jue", "Jdes", "Jdo"] },
	{ id: 66, name: "Revelation",    originalName: "Ἀποκάλυψις",     chapters: 22, testament: "NT", aliases: ["Rev", "Re", "Rv", "Revel", "Revl", "Apocal", "Apoc", "Offb", "Offenb", "Offenbarung", "Rvl"] },
];

/** Map from lowercase alias/name to BookInfo, built once at module load. */
const ALIAS_MAP: Map<string, BookInfo> = new Map();

for (const book of BOOKS) {
	ALIAS_MAP.set(book.name.toLowerCase(), book);
	for (const alias of book.aliases) {
		ALIAS_MAP.set(alias.toLowerCase(), book);
	}
}

/**
 * Look up a book by any name or alias. Case-insensitive.
 */
export function findBook(nameOrAlias: string): BookInfo | undefined {
	return ALIAS_MAP.get(nameOrAlias.trim().toLowerCase());
}

/**
 * Look up a book by its numeric ID (1-66).
 */
export function findBookById(id: number): BookInfo | undefined {
	return BOOKS.find(b => b.id === id);
}

/**
 * Determine the original language source for a given book ID.
 * OT books (1-39) use Hebrew (WLCa), NT books (40-66) use Greek (TISCH).
 */
export function getOriginalVersion(bookId: number): string {
	return bookId <= 39 ? "WLCa" : "TISCH";
}

/**
 * Returns the short cross-reference key for a book, e.g. "Gen", "Matt".
 * Matches the format used in cross_references.tsv.
 */
export function getCrossRefBookKey(book: BookInfo): string {
	const XREF_KEYS: Record<number, string> = {
		1: "Gen", 2: "Exod", 3: "Lev", 4: "Num", 5: "Deut",
		6: "Josh", 7: "Judg", 8: "Ruth", 9: "1Sam", 10: "2Sam",
		11: "1Kgs", 12: "2Kgs", 13: "1Chr", 14: "2Chr", 15: "Ezra",
		16: "Neh", 17: "Esth", 18: "Job", 19: "Ps", 20: "Prov",
		21: "Eccl", 22: "Song", 23: "Isa", 24: "Jer", 25: "Lam",
		26: "Ezek", 27: "Dan", 28: "Hos", 29: "Joel", 30: "Amos",
		31: "Obad", 32: "Jonah", 33: "Mic", 34: "Nah", 35: "Hab",
		36: "Zeph", 37: "Hag", 38: "Zech", 39: "Mal",
		40: "Matt", 41: "Mark", 42: "Luke", 43: "John", 44: "Acts",
		45: "Rom", 46: "1Cor", 47: "2Cor", 48: "Gal", 49: "Eph",
		50: "Phil", 51: "Col", 52: "1Thess", 53: "2Thess",
		54: "1Tim", 55: "2Tim", 56: "Titus", 57: "Phlm", 58: "Heb",
		59: "Jas", 60: "1Pet", 61: "2Pet", 62: "1John", 63: "2John",
		64: "3John", 65: "Jude", 66: "Rev",
	};
	return XREF_KEYS[book.id] || book.name;
}

/** Reverse map from cross-ref key to book ID. */
const XREF_KEY_TO_BOOK: Map<string, BookInfo> = new Map();
for (const book of BOOKS) {
	XREF_KEY_TO_BOOK.set(getCrossRefBookKey(book), book);
}

/**
 * Look up a book by its cross-reference key (e.g. "Gen", "Matt").
 */
export function findBookByXrefKey(key: string): BookInfo | undefined {
	return XREF_KEY_TO_BOOK.get(key);
}

/**
 * Build a regex pattern that matches any book name or alias.
 * Returns a pattern string suitable for use in a larger regex.
 * Sorted by length descending so longer names match first.
 */
export function buildBookPattern(): string {
	const allNames: string[] = [];
	for (const book of BOOKS) {
		allNames.push(escapeRegExp(book.name));
		for (const alias of book.aliases) {
			allNames.push(escapeRegExp(alias));
		}
	}
	// Sort by length descending so "1 Samuel" matches before "1 Sam" etc.
	allNames.sort((a, b) => b.length - a.length);
	return allNames.join("|");
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Re-export with alternate names for API consistency
export const getBookByAlias = findBook;
export const getBookById = findBookById;
