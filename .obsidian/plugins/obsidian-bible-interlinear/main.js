"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BibleInterlinearPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/data/cache.ts
var import_obsidian = require("obsidian");
var BibleCache = class {
  constructor(app) {
    this.app = app;
    this.cachePath = (0, import_obsidian.normalizePath)(
      ".obsidian/plugins/gslogimaker-my-bible/.chapters"
    );
    this.fileCache = /* @__PURE__ */ new Map();
  }
  /**
   * Build the filename for a given version, book number, and chapter.
   */
  getFileName(version, bookNum, chapter) {
    return `${version} ${bookNum} ${chapter}.txt`;
  }
  /**
   * Read a cache file and return lines as an array.
   * Results are cached in memory for repeat access.
   */
  async readCacheFile(version, bookNum, chapter) {
    const fileName = this.getFileName(version, bookNum, chapter);
    const cacheKey = `${version}-${bookNum}-${chapter}`;
    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey);
    }
    const fullPath = (0, import_obsidian.normalizePath)(`${this.cachePath}/${fileName}`);
    try {
      const basePath = this.app.vault.adapter.basePath;
      const fs = require("fs");
      const absolutePath = `${basePath}/${fullPath}`;
      if (!fs.existsSync(absolutePath)) {
        return [];
      }
      const content = fs.readFileSync(absolutePath, "utf-8");
      const lines = content.split("\n").filter((line) => line.length > 0);
      this.fileCache.set(cacheKey, lines);
      return lines;
    } catch {
      return [];
    }
  }
  /**
   * Get verses for a range in a specific version.
   * @param version  Translation code (NASB, WLCa, TISCH)
   * @param bookNum  Book number (1-66)
   * @param chapter  Chapter number
   * @param startVerse  First verse (1-based, default 1)
   * @param endVerse  Last verse (1-based, default all)
   */
  async getVerses(version, bookNum, chapter, startVerse, endVerse) {
    const lines = await this.readCacheFile(version, bookNum, chapter);
    if (lines.length === 0) {
      return [];
    }
    const start = (startVerse ?? 1) - 1;
    const end = endVerse ?? lines.length;
    const verses = [];
    for (let i = start; i < Math.min(end, lines.length); i++) {
      verses.push({
        verseNum: i + 1,
        text: lines[i]
      });
    }
    return verses;
  }
  /**
   * Get a single verse.
   */
  async getVerse(version, bookNum, chapter, verse) {
    const lines = await this.readCacheFile(version, bookNum, chapter);
    if (verse < 1 || verse > lines.length) {
      return null;
    }
    return lines[verse - 1];
  }
  /**
   * Get the total number of verses in a chapter.
   */
  async getVerseCount(version, bookNum, chapter) {
    const lines = await this.readCacheFile(version, bookNum, chapter);
    return lines.length;
  }
  /**
   * Check whether a particular version + book + chapter is available in the cache.
   */
  async hasChapter(version, bookNum, chapter) {
    const lines = await this.readCacheFile(version, bookNum, chapter);
    return lines.length > 0;
  }
  /**
   * Get all verse lines for a chapter as a flat string array.
   * This is the primary API used by code block processors.
   * Returns the raw lines (one per verse) or null if the file is missing.
   */
  async getChapter(version, bookNum, chapter) {
    const lines = await this.readCacheFile(version, bookNum, chapter);
    if (lines.length === 0)
      return null;
    return lines;
  }
  /**
   * Clear the in-memory file cache (useful if files changed on disk).
   */
  clearCache() {
    this.fileCache.clear();
  }
};

// src/data/crossrefs.ts
var import_obsidian2 = require("obsidian");

// src/data/books.ts
var BOOKS = [
  // --- Old Testament ---
  { id: 1, name: "Genesis", originalName: "\u05D1\u05B0\u05BC\u05E8\u05B5\u05D0\u05E9\u05B4\u05C1\u05D9\u05EA", chapters: 50, testament: "OT", aliases: ["Gen", "Ge", "Gn", "1Mo", "1 Mo", "1Mos", "1 Mos", "1Moses", "1 Moses", "Genes", "Gns"] },
  { id: 2, name: "Exodus", originalName: "\u05E9\u05B0\u05C1\u05DE\u05D5\u05B9\u05EA", chapters: 40, testament: "OT", aliases: ["Exod", "Exo", "Ex", "2Mo", "2 Mo", "2Mos", "2 Mos", "2Moses", "2 Moses", "Exd", "Exs"] },
  { id: 3, name: "Leviticus", originalName: "\u05D5\u05B7\u05D9\u05B4\u05BC\u05E7\u05B0\u05E8\u05B8\u05D0", chapters: 27, testament: "OT", aliases: ["Lev", "Le", "Lv", "3Mo", "3 Mo", "3Mos", "3 Mos", "3Moses", "3 Moses", "Levit", "Lvt"] },
  { id: 4, name: "Numbers", originalName: "\u05D1\u05B0\u05BC\u05DE\u05B4\u05D3\u05B0\u05D1\u05B7\u05BC\u05E8", chapters: 36, testament: "OT", aliases: ["Num", "Nu", "Nm", "Nb", "4Mo", "4 Mo", "4Mos", "4 Mos", "4Moses", "4 Moses", "Numb"] },
  { id: 5, name: "Deuteronomy", originalName: "\u05D3\u05B0\u05BC\u05D1\u05B8\u05E8\u05B4\u05D9\u05DD", chapters: 34, testament: "OT", aliases: ["Deut", "Deu", "De", "Dt", "5Mo", "5 Mo", "5Mos", "5 Mos", "5Moses", "5 Moses", "Dtr"] },
  { id: 6, name: "Joshua", originalName: "\u05D9\u05B0\u05D4\u05D5\u05B9\u05E9\u05BB\u05C1\u05E2\u05B7", chapters: 24, testament: "OT", aliases: ["Josh", "Jos", "Jsh", "Josua", "Josu", "Josa", "Joh", "Jshua", "Js", "Jo", "Jsa"] },
  { id: 7, name: "Judges", originalName: "\u05E9\u05C1\u05D5\u05B9\u05E4\u05B0\u05D8\u05B4\u05D9\u05DD", chapters: 21, testament: "OT", aliases: ["Judg", "Jdg", "Jg", "Jdgs", "Judgs", "Jud", "Ri", "Richt", "Richter", "Jges", "Jgs"] },
  { id: 8, name: "Ruth", originalName: "\u05E8\u05D5\u05BC\u05EA", chapters: 4, testament: "OT", aliases: ["Rth", "Ru", "Rut", "Rt", "Rth", "Ruta", "Rh", "Roo", "Rutha", "Rta", "Rooth"] },
  { id: 9, name: "1 Samuel", originalName: "\u05E9\u05B0\u05C1\u05DE\u05D5\u05BC\u05D0\u05B5\u05DC \u05D0", chapters: 31, testament: "OT", aliases: ["1Sam", "1 Sam", "1Sa", "1 Sa", "1Sm", "1 Sm", "I Sam", "I Sa", "1st Samuel", "1st Sam", "1S"] },
  { id: 10, name: "2 Samuel", originalName: "\u05E9\u05B0\u05C1\u05DE\u05D5\u05BC\u05D0\u05B5\u05DC \u05D1", chapters: 24, testament: "OT", aliases: ["2Sam", "2 Sam", "2Sa", "2 Sa", "2Sm", "2 Sm", "II Sam", "II Sa", "2nd Samuel", "2nd Sam", "2S"] },
  { id: 11, name: "1 Kings", originalName: "\u05DE\u05B0\u05DC\u05B8\u05DB\u05B4\u05D9\u05DD \u05D0", chapters: 22, testament: "OT", aliases: ["1Kgs", "1 Kgs", "1Ki", "1 Ki", "1Kin", "1 Kin", "I Kings", "I Ki", "1st Kings", "1st Kgs", "1K"] },
  { id: 12, name: "2 Kings", originalName: "\u05DE\u05B0\u05DC\u05B8\u05DB\u05B4\u05D9\u05DD \u05D1", chapters: 25, testament: "OT", aliases: ["2Kgs", "2 Kgs", "2Ki", "2 Ki", "2Kin", "2 Kin", "II Kings", "II Ki", "2nd Kings", "2nd Kgs", "2K"] },
  { id: 13, name: "1 Chronicles", originalName: "\u05D3\u05B4\u05BC\u05D1\u05B0\u05E8\u05B5\u05D9 \u05D4\u05B7\u05D9\u05B8\u05BC\u05DE\u05B4\u05D9\u05DD \u05D0", chapters: 29, testament: "OT", aliases: ["1Chr", "1 Chr", "1Ch", "1 Ch", "I Chr", "1Chron", "1 Chron", "I Chronicles", "1st Chronicles", "1st Chr", "1Cr"] },
  { id: 14, name: "2 Chronicles", originalName: "\u05D3\u05B4\u05BC\u05D1\u05B0\u05E8\u05B5\u05D9 \u05D4\u05B7\u05D9\u05B8\u05BC\u05DE\u05B4\u05D9\u05DD \u05D1", chapters: 36, testament: "OT", aliases: ["2Chr", "2 Chr", "2Ch", "2 Ch", "II Chr", "2Chron", "2 Chron", "II Chronicles", "2nd Chronicles", "2nd Chr", "2Cr"] },
  { id: 15, name: "Ezra", originalName: "\u05E2\u05B6\u05D6\u05B0\u05E8\u05B8\u05D0", chapters: 10, testament: "OT", aliases: ["Ezr", "Ez", "Esr", "Esra", "Ezra", "Ea", "Era", "Ezraa", "Ezo", "Eza", "Ezar"] },
  { id: 16, name: "Nehemiah", originalName: "\u05E0\u05B0\u05D7\u05B6\u05DE\u05B0\u05D9\u05B8\u05D4", chapters: 13, testament: "OT", aliases: ["Neh", "Ne", "Nehem", "Nhem", "Nehm", "Nhe", "Nhm", "Nehemia", "Nehemija", "Neem", "Nemi"] },
  { id: 17, name: "Esther", originalName: "\u05D0\u05B6\u05E1\u05B0\u05EA\u05B5\u05BC\u05E8", chapters: 10, testament: "OT", aliases: ["Esth", "Est", "Es", "Ester", "Estr", "Esth", "Etr", "Esthr", "Esto", "Esta", "Esthe"] },
  { id: 18, name: "Job", originalName: "\u05D0\u05B4\u05D9\u05BC\u05D5\u05B9\u05D1", chapters: 42, testament: "OT", aliases: ["Jb", "Jo", "Hiob", "Hio", "Ijob", "Ijb", "Iob", "Jab", "Joab", "Jobe", "Jobb"] },
  { id: 19, name: "Psalms", originalName: "\u05EA\u05B0\u05BC\u05D4\u05B4\u05DC\u05B4\u05BC\u05D9\u05DD", chapters: 150, testament: "OT", aliases: ["Ps", "Psa", "Psm", "Pss", "Psalm", "Pslm", "Plm", "Pl", "Psal", "Psalmen", "Pslms"] },
  { id: 20, name: "Proverbs", originalName: "\u05DE\u05B4\u05E9\u05B0\u05C1\u05DC\u05B5\u05D9", chapters: 31, testament: "OT", aliases: ["Prov", "Pro", "Pr", "Prv", "Prvbs", "Prvb", "Pv", "Prbs", "Prob", "Prove", "Provs"] },
  { id: 21, name: "Ecclesiastes", originalName: "\u05E7\u05B9\u05D4\u05B6\u05DC\u05B6\u05EA", chapters: 12, testament: "OT", aliases: ["Eccl", "Ecc", "Ec", "Eccles", "Ecclst", "Qoh", "Qoheleth", "Pred", "Prediger", "Eccle", "Ecl"] },
  { id: 22, name: "Song of Solomon", originalName: "\u05E9\u05B4\u05C1\u05D9\u05E8 \u05D4\u05B7\u05E9\u05B4\u05BC\u05C1\u05D9\u05E8\u05B4\u05D9\u05DD", chapters: 8, testament: "OT", aliases: ["Song", "SOS", "So", "SS", "Cant", "Canticles", "Song of Songs", "Sng", "Songs", "Sol", "SoS"] },
  { id: 23, name: "Isaiah", originalName: "\u05D9\u05B0\u05E9\u05B7\u05C1\u05E2\u05B0\u05D9\u05B8\u05D4\u05D5\u05BC", chapters: 66, testament: "OT", aliases: ["Isa", "Is", "Jes", "Jesaja", "Isai", "Isah", "Isaia", "Isaj", "Ia", "Isaa", "Isai"] },
  { id: 24, name: "Jeremiah", originalName: "\u05D9\u05B4\u05E8\u05B0\u05DE\u05B0\u05D9\u05B8\u05D4\u05D5\u05BC", chapters: 52, testament: "OT", aliases: ["Jer", "Je", "Jr", "Jere", "Jerem", "Jeremia", "Jerm", "Jra", "Jrem", "Jerea", "Jrm"] },
  { id: 25, name: "Lamentations", originalName: "\u05D0\u05B5\u05D9\u05DB\u05B8\u05D4", chapters: 5, testament: "OT", aliases: ["Lam", "La", "Lament", "Lmnt", "Lmn", "Klgl", "Klag", "Klagel", "Lme", "Lams", "Lamn"] },
  { id: 26, name: "Ezekiel", originalName: "\u05D9\u05B0\u05D7\u05B6\u05D6\u05B0\u05E7\u05B5\u05D0\u05DC", chapters: 48, testament: "OT", aliases: ["Ezek", "Eze", "Ezk", "Hes", "Hesek", "Hesekiel", "Ezkl", "Ezel", "Ezl", "Ezke", "Ezkl"] },
  { id: 27, name: "Daniel", originalName: "\u05D3\u05B8\u05BC\u05E0\u05B4\u05D9\u05B5\u05BC\u05D0\u05DC", chapters: 12, testament: "OT", aliases: ["Dan", "Da", "Dn", "Danl", "Dani", "Danl", "Dnl", "Dane", "Dna", "Dann", "Danil"] },
  { id: 28, name: "Hosea", originalName: "\u05D4\u05D5\u05B9\u05E9\u05B5\u05C1\u05E2\u05B7", chapters: 14, testament: "OT", aliases: ["Hos", "Ho", "Hse", "Hosea", "Hosa", "Hsea", "Hoe", "Hoes", "Hoea", "Hosa", "Hosee"] },
  { id: 29, name: "Joel", originalName: "\u05D9\u05D5\u05B9\u05D0\u05B5\u05DC", chapters: 3, testament: "OT", aliases: ["Joe", "Jl", "Joel", "Jol", "Jle", "Joal", "Jeel", "Jol", "Joell", "Jael", "Jel"] },
  { id: 30, name: "Amos", originalName: "\u05E2\u05B8\u05DE\u05D5\u05B9\u05E1", chapters: 9, testament: "OT", aliases: ["Am", "Amo", "Ams", "Amss", "Amso", "Amosa", "Amoos", "Amos", "Amoa", "Amoe", "Amoq"] },
  { id: 31, name: "Obadiah", originalName: "\u05E2\u05D5\u05B9\u05D1\u05B7\u05D3\u05B0\u05D9\u05B8\u05D4", chapters: 1, testament: "OT", aliases: ["Obad", "Ob", "Oba", "Obd", "Obda", "Obadi", "Obadj", "Obdia", "Obah", "Obai", "Obdh"] },
  { id: 32, name: "Jonah", originalName: "\u05D9\u05D5\u05B9\u05E0\u05B8\u05D4", chapters: 4, testament: "OT", aliases: ["Jon", "Jnh", "Jna", "Jonah", "Jona", "Jonh", "Jnh", "Jnah", "Jnha", "Jone", "Jns"] },
  { id: 33, name: "Micah", originalName: "\u05DE\u05B4\u05D9\u05DB\u05B8\u05D4", chapters: 7, testament: "OT", aliases: ["Mic", "Mi", "Mica", "Micha", "Mch", "Mca", "Mich", "Mcah", "Mia", "Mcb", "Mik"] },
  { id: 34, name: "Nahum", originalName: "\u05E0\u05B7\u05D7\u05D5\u05BC\u05DD", chapters: 3, testament: "OT", aliases: ["Nah", "Na", "Nahm", "Nahu", "Nhm", "Nahum", "Nah", "Naam", "Naum", "Nha", "Nhum"] },
  { id: 35, name: "Habakkuk", originalName: "\u05D7\u05B2\u05D1\u05B7\u05E7\u05BC\u05D5\u05BC\u05E7", chapters: 3, testament: "OT", aliases: ["Hab", "Hb", "Habk", "Habak", "Hbk", "Habakk", "Habb", "Habq", "Hbk", "Habkk", "Hak"] },
  { id: 36, name: "Zephaniah", originalName: "\u05E6\u05B0\u05E4\u05B7\u05E0\u05B0\u05D9\u05B8\u05D4", chapters: 3, testament: "OT", aliases: ["Zeph", "Zep", "Zp", "Zph", "Zepha", "Zephn", "Zphn", "Zefa", "Zef", "Zphn", "Zpn"] },
  { id: 37, name: "Haggai", originalName: "\u05D7\u05B7\u05D2\u05B7\u05BC\u05D9", chapters: 2, testament: "OT", aliases: ["Hag", "Hg", "Hagg", "Hagga", "Hagi", "Haggai", "Hagg", "Haga", "Hga", "Hge", "Hgai"] },
  { id: 38, name: "Zechariah", originalName: "\u05D6\u05B0\u05DB\u05B7\u05E8\u05B0\u05D9\u05B8\u05D4", chapters: 14, testament: "OT", aliases: ["Zech", "Zec", "Zc", "Zch", "Zach", "Zachar", "Zchar", "Zecha", "Zchr", "Sach", "Sech"] },
  { id: 39, name: "Malachi", originalName: "\u05DE\u05B7\u05DC\u05B0\u05D0\u05B8\u05DB\u05B4\u05D9", chapters: 4, testament: "OT", aliases: ["Mal", "Ml", "Malach", "Mala", "Mlch", "Malc", "Malak", "Mlk", "Male", "Malk", "Mlac"] },
  // --- New Testament ---
  { id: 40, name: "Matthew", originalName: "\u039C\u03B1\u03B8\u03B8\u03B1\u1FD6\u03BF\u03C2", chapters: 28, testament: "NT", aliases: ["Matt", "Mat", "Mt", "Matth", "Mtt", "Matthw", "Mthw", "Mth", "Mw", "Mtw", "Matw"] },
  { id: 41, name: "Mark", originalName: "\u039C\u03AC\u03C1\u03BA\u03BF\u03C2", chapters: 16, testament: "NT", aliases: ["Mrk", "Mk", "Mr", "Marc", "Mrc", "Mrks", "Marca", "Mkr", "Mak", "Mrka", "Mks"] },
  { id: 42, name: "Luke", originalName: "\u039B\u03BF\u03C5\u03BA\u1FB6\u03C2", chapters: 24, testament: "NT", aliases: ["Luk", "Lk", "Lu", "Lke", "Luc", "Luka", "Lukas", "Lks", "Lku", "Lca", "Luk"] },
  { id: 43, name: "John", originalName: "\u1F38\u03C9\u03AC\u03BD\u03BD\u03B7\u03C2", chapters: 21, testament: "NT", aliases: ["Jn", "Jhn", "Joh", "Jno", "Jo", "Jhn", "Johnn", "Jhon", "Joan", "Joha", "Jnhn"] },
  { id: 44, name: "Acts", originalName: "\u03A0\u03C1\u03AC\u03BE\u03B5\u03B9\u03C2", chapters: 28, testament: "NT", aliases: ["Act", "Ac", "Acs", "Acts", "Acta", "Apg", "Apostelg", "Akt", "Actos", "Acos", "Acte"] },
  { id: 45, name: "Romans", originalName: "\u03A1\u03C9\u03BC\u03B1\u03AF\u03BF\u03C5\u03C2", chapters: 16, testament: "NT", aliases: ["Rom", "Ro", "Rm", "Roma", "Rmn", "Rmns", "Roms", "Romn", "Rma", "Roe", "Romns"] },
  { id: 46, name: "1 Corinthians", originalName: "\u039A\u03BF\u03C1\u03B9\u03BD\u03B8\u03AF\u03BF\u03C5\u03C2 \u0391", chapters: 16, testament: "NT", aliases: ["1Cor", "1 Cor", "1Co", "1 Co", "I Cor", "1Corinth", "1 Corinth", "I Corinthians", "1st Corinthians", "1st Cor", "1C"] },
  { id: 47, name: "2 Corinthians", originalName: "\u039A\u03BF\u03C1\u03B9\u03BD\u03B8\u03AF\u03BF\u03C5\u03C2 \u0392", chapters: 13, testament: "NT", aliases: ["2Cor", "2 Cor", "2Co", "2 Co", "II Cor", "2Corinth", "2 Corinth", "II Corinthians", "2nd Corinthians", "2nd Cor", "2C"] },
  { id: 48, name: "Galatians", originalName: "\u0393\u03B1\u03BB\u03AC\u03C4\u03B1\u03C2", chapters: 6, testament: "NT", aliases: ["Gal", "Ga", "Gl", "Galat", "Galatia", "Gala", "Galt", "Gals", "Gltn", "Gla", "Galn"] },
  { id: 49, name: "Ephesians", originalName: "\u1F18\u03C6\u03B5\u03C3\u03AF\u03BF\u03C5\u03C2", chapters: 6, testament: "NT", aliases: ["Eph", "Ep", "Ephes", "Ephe", "Ephs", "Ephsn", "Epha", "Ephn", "Epe", "Eph", "Epi"] },
  { id: 50, name: "Philippians", originalName: "\u03A6\u03B9\u03BB\u03B9\u03C0\u03C0\u03B7\u03C3\u03AF\u03BF\u03C5\u03C2", chapters: 4, testament: "NT", aliases: ["Phil", "Php", "Pp", "Phili", "Philip", "Phl", "Philp", "Phli", "Phip", "Phils", "Phillp"] },
  { id: 51, name: "Colossians", originalName: "\u039A\u03BF\u03BB\u03BF\u03C3\u03C3\u03B1\u03B5\u1FD6\u03C2", chapters: 4, testament: "NT", aliases: ["Col", "Cl", "Cols", "Colos", "Coloss", "Colo", "Cla", "Clsn", "Coln", "Cola", "Coll"] },
  { id: 52, name: "1 Thessalonians", originalName: "\u0398\u03B5\u03C3\u03C3\u03B1\u03BB\u03BF\u03BD\u03B9\u03BA\u03B5\u1FD6\u03C2 \u0391", chapters: 5, testament: "NT", aliases: ["1Thess", "1 Thess", "1Th", "1 Th", "I Thess", "1Thessalonians", "I Thessalonians", "1st Thessalonians", "1st Thess", "1Ts", "1Thes"] },
  { id: 53, name: "2 Thessalonians", originalName: "\u0398\u03B5\u03C3\u03C3\u03B1\u03BB\u03BF\u03BD\u03B9\u03BA\u03B5\u1FD6\u03C2 \u0392", chapters: 3, testament: "NT", aliases: ["2Thess", "2 Thess", "2Th", "2 Th", "II Thess", "2Thessalonians", "II Thessalonians", "2nd Thessalonians", "2nd Thess", "2Ts", "2Thes"] },
  { id: 54, name: "1 Timothy", originalName: "\u03A4\u03B9\u03BC\u03CC\u03B8\u03B5\u03BF\u03BD \u0391", chapters: 6, testament: "NT", aliases: ["1Tim", "1 Tim", "1Ti", "1 Ti", "I Tim", "I Timothy", "1st Timothy", "1st Tim", "1Tm", "1Timo", "1Ty"] },
  { id: 55, name: "2 Timothy", originalName: "\u03A4\u03B9\u03BC\u03CC\u03B8\u03B5\u03BF\u03BD \u0392", chapters: 4, testament: "NT", aliases: ["2Tim", "2 Tim", "2Ti", "2 Ti", "II Tim", "II Timothy", "2nd Timothy", "2nd Tim", "2Tm", "2Timo", "2Ty"] },
  { id: 56, name: "Titus", originalName: "\u03A4\u03AF\u03C4\u03BF\u03BD", chapters: 3, testament: "NT", aliases: ["Tit", "Ti", "Tts", "Titu", "Titos", "Tts", "Tta", "Tita", "Titn", "Tiut", "Tite"] },
  { id: 57, name: "Philemon", originalName: "\u03A6\u03B9\u03BB\u03AE\u03BC\u03BF\u03BD\u03B1", chapters: 1, testament: "NT", aliases: ["Phlm", "Phm", "Pm", "Philem", "Philm", "Phile", "Phlmn", "Phln", "Phlem", "Phla", "Plm"] },
  { id: 58, name: "Hebrews", originalName: "\u1F19\u03B2\u03C1\u03B1\u03AF\u03BF\u03C5\u03C2", chapters: 13, testament: "NT", aliases: ["Heb", "He", "Hbr", "Hebr", "Hebs", "Hbrs", "Hebrw", "Hbrw", "Hba", "Hbe", "Hbre"] },
  { id: 59, name: "James", originalName: "\u1F38\u03AC\u03BA\u03C9\u03B2\u03BF\u03C2", chapters: 5, testament: "NT", aliases: ["Jas", "Jm", "Jam", "Jms", "Jak", "Jako", "Jakobus", "Jame", "Jams", "Jma", "Jmb"] },
  { id: 60, name: "1 Peter", originalName: "\u03A0\u03AD\u03C4\u03C1\u03BF\u03C5 \u0391", chapters: 5, testament: "NT", aliases: ["1Pet", "1 Pet", "1Pe", "1 Pe", "1Pt", "1 Pt", "I Pet", "I Peter", "1st Peter", "1st Pet", "1P"] },
  { id: 61, name: "2 Peter", originalName: "\u03A0\u03AD\u03C4\u03C1\u03BF\u03C5 \u0392", chapters: 3, testament: "NT", aliases: ["2Pet", "2 Pet", "2Pe", "2 Pe", "2Pt", "2 Pt", "II Pet", "II Peter", "2nd Peter", "2nd Pet", "2P"] },
  { id: 62, name: "1 John", originalName: "\u1F38\u03C9\u03AC\u03BD\u03BD\u03BF\u03C5 \u0391", chapters: 5, testament: "NT", aliases: ["1Jn", "1 Jn", "1John", "1 John", "1Jo", "1 Jo", "I John", "I Jn", "1st John", "1st Jn", "1J"] },
  { id: 63, name: "2 John", originalName: "\u1F38\u03C9\u03AC\u03BD\u03BD\u03BF\u03C5 \u0392", chapters: 1, testament: "NT", aliases: ["2Jn", "2 Jn", "2John", "2 John", "2Jo", "2 Jo", "II John", "II Jn", "2nd John", "2nd Jn", "2J"] },
  { id: 64, name: "3 John", originalName: "\u1F38\u03C9\u03AC\u03BD\u03BD\u03BF\u03C5 \u0393", chapters: 1, testament: "NT", aliases: ["3Jn", "3 Jn", "3John", "3 John", "3Jo", "3 Jo", "III John", "III Jn", "3rd John", "3rd Jn", "3J"] },
  { id: 65, name: "Jude", originalName: "\u1F38\u03BF\u03CD\u03B4\u03B1\u03C2", chapters: 1, testament: "NT", aliases: ["Jud", "Jde", "Jd", "Jude", "Judas", "Jda", "Jdee", "Jdu", "Jue", "Jdes", "Jdo"] },
  { id: 66, name: "Revelation", originalName: "\u1F08\u03C0\u03BF\u03BA\u03AC\u03BB\u03C5\u03C8\u03B9\u03C2", chapters: 22, testament: "NT", aliases: ["Rev", "Re", "Rv", "Revel", "Revl", "Apocal", "Apoc", "Offb", "Offenb", "Offenbarung", "Rvl"] }
];
var ALIAS_MAP = /* @__PURE__ */ new Map();
for (const book of BOOKS) {
  ALIAS_MAP.set(book.name.toLowerCase(), book);
  for (const alias of book.aliases) {
    ALIAS_MAP.set(alias.toLowerCase(), book);
  }
}
function findBook(nameOrAlias) {
  return ALIAS_MAP.get(nameOrAlias.trim().toLowerCase());
}
function findBookById(id) {
  return BOOKS.find((b) => b.id === id);
}
function getCrossRefBookKey(book) {
  const XREF_KEYS = {
    1: "Gen",
    2: "Exod",
    3: "Lev",
    4: "Num",
    5: "Deut",
    6: "Josh",
    7: "Judg",
    8: "Ruth",
    9: "1Sam",
    10: "2Sam",
    11: "1Kgs",
    12: "2Kgs",
    13: "1Chr",
    14: "2Chr",
    15: "Ezra",
    16: "Neh",
    17: "Esth",
    18: "Job",
    19: "Ps",
    20: "Prov",
    21: "Eccl",
    22: "Song",
    23: "Isa",
    24: "Jer",
    25: "Lam",
    26: "Ezek",
    27: "Dan",
    28: "Hos",
    29: "Joel",
    30: "Amos",
    31: "Obad",
    32: "Jonah",
    33: "Mic",
    34: "Nah",
    35: "Hab",
    36: "Zeph",
    37: "Hag",
    38: "Zech",
    39: "Mal",
    40: "Matt",
    41: "Mark",
    42: "Luke",
    43: "John",
    44: "Acts",
    45: "Rom",
    46: "1Cor",
    47: "2Cor",
    48: "Gal",
    49: "Eph",
    50: "Phil",
    51: "Col",
    52: "1Thess",
    53: "2Thess",
    54: "1Tim",
    55: "2Tim",
    56: "Titus",
    57: "Phlm",
    58: "Heb",
    59: "Jas",
    60: "1Pet",
    61: "2Pet",
    62: "1John",
    63: "2John",
    64: "3John",
    65: "Jude",
    66: "Rev"
  };
  return XREF_KEYS[book.id] || book.name;
}
var XREF_KEY_TO_BOOK = /* @__PURE__ */ new Map();
for (const book of BOOKS) {
  XREF_KEY_TO_BOOK.set(getCrossRefBookKey(book), book);
}
function findBookByXrefKey(key) {
  return XREF_KEY_TO_BOOK.get(key);
}
var getBookByAlias = findBook;

// src/data/crossrefs.ts
function makeVerseKey(book, chapter, verse) {
  return `${book}.${chapter}.${verse}`;
}
var CrossRefIndex = class {
  constructor(app, voteThreshold) {
    this.app = app;
    this.index = /* @__PURE__ */ new Map();
    this.loaded = false;
    this.voteThreshold = voteThreshold ?? 10;
  }
  /**
   * Load and parse the TSV file, filtering by vote threshold.
   * Can be called with no args to use stored app/threshold, or with explicit args.
   */
  async load(app, voteThreshold) {
    const resolvedApp = app ?? this.app;
    const resolvedThreshold = voteThreshold ?? this.voteThreshold;
    this.index.clear();
    this.loaded = false;
    const tsvPath = (0, import_obsidian2.normalizePath)("bibles/cross_references.tsv");
    let content;
    try {
      const basePath = resolvedApp.vault.adapter.basePath;
      const fs = require("fs");
      const absolutePath = `${basePath}/${tsvPath}`;
      if (!fs.existsSync(absolutePath)) {
        console.log("Bible Interlinear: cross_references.tsv not found at", absolutePath);
        return;
      }
      content = fs.readFileSync(absolutePath, "utf-8");
    } catch (e) {
      console.error("Bible Interlinear: Failed to read cross_references.tsv:", e);
      return;
    }
    const lines = content.split("\n");
    let parsed = 0;
    for (const line of lines) {
      if (line.startsWith("#") || line.startsWith("From")) {
        continue;
      }
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        continue;
      }
      const parts = trimmed.split("	");
      if (parts.length < 3) {
        continue;
      }
      const votes = parseInt(parts[2], 10);
      if (isNaN(votes) || votes < resolvedThreshold) {
        continue;
      }
      const from = parseXrefVerse(parts[0]);
      const to = parseXrefVerse(parts[1]);
      if (!from || !to) {
        continue;
      }
      const ref = {
        fromBook: from.book,
        fromChapter: from.chapter,
        fromVerse: from.verse,
        toBook: to.book,
        toChapter: to.chapter,
        toVerse: to.verse,
        votes
      };
      const key = makeVerseKey(from.book, from.chapter, from.verse);
      let existing = this.index.get(key);
      if (!existing) {
        existing = [];
        this.index.set(key, existing);
      }
      existing.push(ref);
      parsed++;
    }
    for (const refs of this.index.values()) {
      refs.sort((a, b) => b.votes - a.votes);
    }
    this.loaded = true;
    console.log(`Bible Interlinear: Loaded ${parsed} cross-references (threshold: ${resolvedThreshold} votes)`);
  }
  /**
   * Get cross-references for a specific verse, limited by maxRefs.
   * @param bookXrefKey  The cross-ref key for the book (e.g. "Gen", "Matt")
   * @param chapter  Chapter number
   * @param verse  Verse number
   * @param maxRefs  Maximum number of refs to return
   */
  getRefsForVerse(bookXrefKey, chapter, verse, maxRefs) {
    if (!this.loaded)
      return [];
    const key = makeVerseKey(bookXrefKey, chapter, verse);
    const refs = this.index.get(key);
    if (!refs)
      return [];
    return refs.slice(0, maxRefs);
  }
  /**
   * Get cross-references for a verse by book ID, chapter, verse.
   * Resolves the book ID to the TSV key internally.
   * Returns CrossRef[] for use by the renderer.
   */
  getForVerse(bookId, chapter, verse, maxRefs) {
    if (!this.loaded)
      return [];
    const book = findBookById(bookId);
    if (!book)
      return [];
    const xrefKey = getCrossRefBookKey(book);
    const key = makeVerseKey(xrefKey, chapter, verse);
    const rawRefs = this.index.get(key);
    if (!rawRefs)
      return [];
    const resolved = [];
    for (const raw of rawRefs.slice(0, maxRefs)) {
      const targetBook = findBookByXrefKey(raw.toBook);
      if (!targetBook)
        continue;
      resolved.push({
        targetBook: targetBook.id,
        targetChapter: raw.toChapter,
        targetVerse: raw.toVerse,
        votes: raw.votes
      });
    }
    return resolved;
  }
  /**
   * Check if loaded.
   */
  isLoaded() {
    return this.loaded;
  }
  /**
   * Convert a CrossReference target to a human-readable string.
   * e.g. "Psalm 96:5"
   */
  static formatRef(ref) {
    const book = findBookByXrefKey(ref.toBook);
    const bookName = book ? book.name : ref.toBook;
    return `${bookName} ${ref.toChapter}:${ref.toVerse}`;
  }
  /**
   * Convert a CrossReference target to a vault wikilink path.
   * e.g. "bibles/NASB-IL/Psalms/Psalms 96"
   */
  static formatRefLink(ref, biblePath) {
    const book = findBookByXrefKey(ref.toBook);
    const bookName = book ? book.name : ref.toBook;
    return `${biblePath}/${bookName}/${bookName} ${ref.toChapter}`;
  }
};
function parseXrefVerse(s) {
  const parts = s.split(".");
  if (parts.length < 3)
    return null;
  const book = parts[0];
  const chapter = parseInt(parts[1], 10);
  const verse = parseInt(parts[2], 10);
  if (isNaN(chapter) || isNaN(verse))
    return null;
  return { book, chapter, verse };
}

// src/data/strongs.ts
function parseStrongsText(text, isNT) {
  const pairs = [];
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
        entry: getStrongsEntry(num, isNT)
      });
    }
  }
  return pairs;
}
var SKIP_STRONGS = /* @__PURE__ */ new Set([
  853,
  5921,
  834,
  3588,
  3605,
  413,
  3651
  // Hebrew
]);
var SKIP_GREEK = /* @__PURE__ */ new Set([
  3588,
  1161,
  2532,
  1722,
  1537,
  3739,
  3778,
  1063,
  2443,
  575,
  2596,
  5259,
  4314,
  846,
  3956,
  3767,
  3754,
  3756,
  2228,
  3361
]);
function isSkippable(strongs, isNT) {
  return isNT ? SKIP_GREEK.has(strongs) : SKIP_STRONGS.has(strongs);
}
function getStrongsEntry(num, isNT) {
  return isNT ? GREEK_LEXICON.get(num) : HEBREW_LEXICON.get(num);
}
function getConceptPath(num, isNT) {
  const entry = getStrongsEntry(num, isNT);
  if (!entry)
    return void 0;
  const prefix = isNT ? "G" : "H";
  const subdir = isNT ? "greek" : "hebrew";
  return `concepts/${subdir}/${prefix}${num} - ${entry.transliteration}`;
}
var HEBREW_LEXICON = /* @__PURE__ */ new Map([
  [1, { original: "\u05D0\u05B8\u05D1", transliteration: "av", gloss: "father" }],
  [113, { original: "\u05D0\u05B8\u05D3\u05D5\u05B9\u05DF", transliteration: "adon", gloss: "lord, master" }],
  [120, { original: "\u05D0\u05B8\u05D3\u05B8\u05DD", transliteration: "adam", gloss: "man, mankind" }],
  [136, { original: "\u05D0\u05B2\u05D3\u05B9\u05E0\u05B8\u05D9", transliteration: "Adonai", gloss: "Lord, master" }],
  [157, { original: "\u05D0\u05B8\u05D4\u05B7\u05D1", transliteration: "ahav", gloss: "to love" }],
  [216, { original: "\u05D0\u05D5\u05B9\u05E8", transliteration: "or", gloss: "light" }],
  [226, { original: "\u05D0\u05D5\u05B9\u05EA", transliteration: "ot", gloss: "sign, wonder" }],
  [259, { original: "\u05D0\u05B6\u05D7\u05B8\u05D3", transliteration: "echad", gloss: "one, united" }],
  [410, { original: "\u05D0\u05B5\u05DC", transliteration: "El", gloss: "God, mighty one" }],
  [430, { original: "\u05D0\u05B1\u05DC\u05B9\u05D4\u05B4\u05D9\u05DD", transliteration: "Elohim", gloss: "God" }],
  [539, { original: "\u05D0\u05B8\u05DE\u05B7\u05DF", transliteration: "aman", gloss: "to believe" }],
  [559, { original: "\u05D0\u05B8\u05DE\u05B7\u05E8", transliteration: "amar", gloss: "to say" }],
  [571, { original: "\u05D0\u05B1\u05DE\u05B6\u05EA", transliteration: "emeth", gloss: "truth" }],
  [776, { original: "\u05D0\u05B6\u05E8\u05B6\u05E5", transliteration: "erets", gloss: "earth, land" }],
  [853, { original: "\u05D0\u05B5\u05EA", transliteration: "et", gloss: "[obj. marker]" }],
  [914, { original: "\u05D1\u05B8\u05BC\u05D3\u05B7\u05DC", transliteration: "badal", gloss: "to separate" }],
  [922, { original: "\u05D1\u05B9\u05BC\u05D4\u05D5\u05BC", transliteration: "bohu", gloss: "emptiness, void" }],
  [996, { original: "\u05D1\u05B5\u05BC\u05D9\u05DF", transliteration: "beyn", gloss: "between" }],
  [1242, { original: "\u05D1\u05B9\u05BC\u05E7\u05B6\u05E8", transliteration: "boqer", gloss: "morning" }],
  [1254, { original: "\u05D1\u05B8\u05BC\u05E8\u05B8\u05D0", transliteration: "bara", gloss: "to create" }],
  [1285, { original: "\u05D1\u05B0\u05BC\u05E8\u05B4\u05D9\u05EA", transliteration: "berith", gloss: "covenant" }],
  [1288, { original: "\u05D1\u05B8\u05BC\u05E8\u05B7\u05DA\u05B0", transliteration: "barak", gloss: "to bless" }],
  [1121, { original: "\u05D1\u05B5\u05BC\u05DF", transliteration: "ben", gloss: "son" }],
  [1350, { original: "\u05D2\u05B8\u05BC\u05D0\u05B7\u05DC", transliteration: "gaal", gloss: "to redeem" }],
  [1697, { original: "\u05D3\u05B8\u05BC\u05D1\u05B8\u05E8", transliteration: "davar", gloss: "word, matter" }],
  [1818, { original: "\u05D3\u05B8\u05BC\u05DD", transliteration: "dam", gloss: "blood" }],
  [1870, { original: "\u05D3\u05B6\u05BC\u05E8\u05B6\u05DA\u05B0", transliteration: "derek", gloss: "way, path" }],
  [1961, { original: "\u05D4\u05B8\u05D9\u05B8\u05D4", transliteration: "hayah", gloss: "to be, become" }],
  [2009, { original: "\u05D4\u05B4\u05E0\u05B5\u05BC\u05D4", transliteration: "hinneh", gloss: "behold" }],
  [2403, { original: "\u05D7\u05B7\u05D8\u05B8\u05BC\u05D0\u05EA", transliteration: "chattath", gloss: "sin" }],
  [2416, { original: "\u05D7\u05B7\u05D9", transliteration: "chay", gloss: "living, life" }],
  [2580, { original: "\u05D7\u05B5\u05DF", transliteration: "chen", gloss: "grace, favor" }],
  [2617, { original: "\u05D7\u05B6\u05E1\u05B6\u05D3", transliteration: "chesed", gloss: "lovingkindness" }],
  [2822, { original: "\u05D7\u05B9\u05E9\u05B6\u05C1\u05DA\u05B0", transliteration: "choshek", gloss: "darkness" }],
  [2896, { original: "\u05D8\u05D5\u05B9\u05D1", transliteration: "tov", gloss: "good" }],
  [3027, { original: "\u05D9\u05B8\u05D3", transliteration: "yad", gloss: "hand" }],
  [3045, { original: "\u05D9\u05B8\u05D3\u05B7\u05E2", transliteration: "yada", gloss: "to know" }],
  [3068, { original: "\u05D9\u05D4\u05D5\u05D4", transliteration: "YHWH", gloss: "the LORD" }],
  [3117, { original: "\u05D9\u05D5\u05B9\u05DD", transliteration: "yom", gloss: "day" }],
  [3220, { original: "\u05D9\u05B8\u05DD", transliteration: "yam", gloss: "sea" }],
  [3372, { original: "\u05D9\u05B8\u05E8\u05B5\u05D0", transliteration: "yare", gloss: "to fear, revere" }],
  [3444, { original: "\u05D9\u05B0\u05E9\u05C1\u05D5\u05BC\u05E2\u05B8\u05D4", transliteration: "yeshuah", gloss: "salvation" }],
  [3519, { original: "\u05DB\u05B8\u05BC\u05D1\u05D5\u05B9\u05D3", transliteration: "kavod", gloss: "glory" }],
  [3548, { original: "\u05DB\u05B9\u05BC\u05D4\u05B5\u05DF", transliteration: "kohen", gloss: "priest" }],
  [3722, { original: "\u05DB\u05B8\u05BC\u05E4\u05B7\u05E8", transliteration: "kaphar", gloss: "to atone" }],
  [3820, { original: "\u05DC\u05B5\u05D1", transliteration: "lev", gloss: "heart" }],
  [3915, { original: "\u05DC\u05B7\u05D9\u05B4\u05DC", transliteration: "layil", gloss: "night" }],
  [4150, { original: "\u05DE\u05D5\u05B9\u05E2\u05B5\u05D3", transliteration: "moed", gloss: "appointed time" }],
  [4325, { original: "\u05DE\u05B7\u05D9\u05B4\u05DD", transliteration: "mayim", gloss: "water" }],
  [4397, { original: "\u05DE\u05B7\u05DC\u05B0\u05D0\u05B8\u05DA\u05B0", transliteration: "malak", gloss: "angel, messenger" }],
  [4428, { original: "\u05DE\u05B6\u05DC\u05B6\u05DA\u05B0", transliteration: "melek", gloss: "king" }],
  [4899, { original: "\u05DE\u05B8\u05E9\u05B4\u05C1\u05D9\u05D7\u05B7", transliteration: "mashiach", gloss: "anointed one" }],
  [4941, { original: "\u05DE\u05B4\u05E9\u05B0\u05C1\u05E4\u05B8\u05BC\u05D8", transliteration: "mishpat", gloss: "justice" }],
  [5030, { original: "\u05E0\u05B8\u05D1\u05B4\u05D9\u05D0", transliteration: "navi", gloss: "prophet" }],
  [5315, { original: "\u05E0\u05B6\u05E4\u05B6\u05E9\u05C1", transliteration: "nephesh", gloss: "soul, life" }],
  [5414, { original: "\u05E0\u05B8\u05EA\u05B7\u05DF", transliteration: "natan", gloss: "to give" }],
  [5545, { original: "\u05E1\u05B8\u05DC\u05B7\u05D7", transliteration: "salach", gloss: "to forgive" }],
  [5650, { original: "\u05E2\u05B6\u05D1\u05B6\u05D3", transliteration: "eved", gloss: "servant" }],
  [5769, { original: "\u05E2\u05D5\u05B9\u05DC\u05B8\u05DD", transliteration: "olam", gloss: "eternity" }],
  [5771, { original: "\u05E2\u05B8\u05D5\u05B9\u05DF", transliteration: "avon", gloss: "iniquity" }],
  [5921, { original: "\u05E2\u05B7\u05DC", transliteration: "al", gloss: "upon, over" }],
  [5930, { original: "\u05E2\u05B9\u05DC\u05B8\u05D4", transliteration: "olah", gloss: "burnt offering" }],
  [5971, { original: "\u05E2\u05B7\u05DD", transliteration: "am", gloss: "people" }],
  [6213, { original: "\u05E2\u05B8\u05E9\u05B8\u05C2\u05D4", transliteration: "asah", gloss: "to do, make" }],
  [6440, { original: "\u05E4\u05B8\u05BC\u05E0\u05B4\u05D9\u05DD", transliteration: "panim", gloss: "face" }],
  [6529, { original: "\u05E4\u05B0\u05BC\u05E8\u05B4\u05D9", transliteration: "peri", gloss: "fruit" }],
  [6754, { original: "\u05E6\u05B6\u05DC\u05B6\u05DD", transliteration: "tselem", gloss: "image" }],
  [6944, { original: "\u05E7\u05B9\u05D3\u05B6\u05E9\u05C1", transliteration: "qodesh", gloss: "holiness" }],
  [7121, { original: "\u05E7\u05B8\u05E8\u05B8\u05D0", transliteration: "qara", gloss: "to call" }],
  [7200, { original: "\u05E8\u05B8\u05D0\u05B8\u05D4", transliteration: "raah", gloss: "to see" }],
  [7225, { original: "\u05E8\u05B5\u05D0\u05E9\u05B4\u05C1\u05D9\u05EA", transliteration: "reshith", gloss: "beginning" }],
  [7287, { original: "\u05E8\u05B8\u05D3\u05B8\u05D4", transliteration: "radah", gloss: "to rule" }],
  [7307, { original: "\u05E8\u05D5\u05BC\u05D7\u05B7", transliteration: "ruach", gloss: "spirit, wind" }],
  [7363, { original: "\u05E8\u05B8\u05D7\u05B7\u05E3", transliteration: "rachaf", gloss: "to hover" }],
  [7549, { original: "\u05E8\u05B8\u05E7\u05B4\u05D9\u05E2\u05B7", transliteration: "raqia", gloss: "expanse" }],
  [7706, { original: "\u05E9\u05B7\u05C1\u05D3\u05B7\u05BC\u05D9", transliteration: "Shaddai", gloss: "Almighty" }],
  [7965, { original: "\u05E9\u05B8\u05C1\u05DC\u05D5\u05B9\u05DD", transliteration: "shalom", gloss: "peace" }],
  [8064, { original: "\u05E9\u05B8\u05C1\u05DE\u05B7\u05D9\u05B4\u05DD", transliteration: "shamayim", gloss: "heavens" }],
  [8034, { original: "\u05E9\u05B5\u05C1\u05DD", transliteration: "shem", gloss: "name" }],
  [8085, { original: "\u05E9\u05B8\u05C1\u05DE\u05B7\u05E2", transliteration: "shama", gloss: "to hear" }],
  [8104, { original: "\u05E9\u05B8\u05C1\u05DE\u05B7\u05E8", transliteration: "shamar", gloss: "to keep, guard" }],
  [8414, { original: "\u05EA\u05B9\u05BC\u05D4\u05D5\u05BC", transliteration: "tohu", gloss: "formless" }],
  [8415, { original: "\u05EA\u05B0\u05BC\u05D4\u05D5\u05B9\u05DD", transliteration: "tehom", gloss: "the deep" }],
  [8451, { original: "\u05EA\u05BC\u05D5\u05B9\u05E8\u05B8\u05D4", transliteration: "torah", gloss: "law, instruction" }]
]);
var GREEK_LEXICON = /* @__PURE__ */ new Map([
  [11, { original: "\u1F08\u03B2\u03C1\u03B1\u03AC\u03BC", transliteration: "Abraam", gloss: "Abraham" }],
  [25, { original: "\u1F00\u03B3\u03B1\u03C0\u03AC\u03C9", transliteration: "agapao", gloss: "to love" }],
  [26, { original: "\u1F00\u03B3\u03AC\u03C0\u03B7", transliteration: "agape", gloss: "love" }],
  [32, { original: "\u1F04\u03B3\u03B3\u03B5\u03BB\u03BF\u03C2", transliteration: "angelos", gloss: "angel" }],
  [40, { original: "\u1F05\u03B3\u03B9\u03BF\u03C2", transliteration: "hagios", gloss: "holy" }],
  [80, { original: "\u1F00\u03B4\u03B5\u03BB\u03C6\u03CC\u03C2", transliteration: "adelphos", gloss: "brother" }],
  [129, { original: "\u03B1\u1F37\u03BC\u03B1", transliteration: "haima", gloss: "blood" }],
  [165, { original: "\u03B1\u1F30\u03CE\u03BD", transliteration: "aion", gloss: "age, eternity" }],
  [225, { original: "\u1F00\u03BB\u03AE\u03B8\u03B5\u03B9\u03B1", transliteration: "aletheia", gloss: "truth" }],
  [266, { original: "\u1F01\u03BC\u03B1\u03C1\u03C4\u03AF\u03B1", transliteration: "hamartia", gloss: "sin" }],
  [386, { original: "\u1F00\u03BD\u03AC\u03C3\u03C4\u03B1\u03C3\u03B9\u03C2", transliteration: "anastasis", gloss: "resurrection" }],
  [444, { original: "\u1F04\u03BD\u03B8\u03C1\u03C9\u03C0\u03BF\u03C2", transliteration: "anthropos", gloss: "man, person" }],
  [575, { original: "\u1F00\u03C0\u03CC", transliteration: "apo", gloss: "from" }],
  [649, { original: "\u1F00\u03C0\u03CC\u03C3\u03C4\u03BF\u03BB\u03BF\u03C2", transliteration: "apostolos", gloss: "apostle" }],
  [746, { original: "\u1F00\u03C1\u03C7\u03AE", transliteration: "arche", gloss: "beginning" }],
  [846, { original: "\u03B1\u1F50\u03C4\u03CC\u03C2", transliteration: "autos", gloss: "he/she/it" }],
  [907, { original: "\u03B2\u03B1\u03C0\u03C4\u03AF\u03B6\u03C9", transliteration: "baptizo", gloss: "to baptize" }],
  [932, { original: "\u03B2\u03B1\u03C3\u03B9\u03BB\u03B5\u03AF\u03B1", transliteration: "basileia", gloss: "kingdom" }],
  [976, { original: "\u03B2\u03AF\u03B2\u03BB\u03BF\u03C2", transliteration: "biblos", gloss: "book" }],
  [1078, { original: "\u03B3\u03AD\u03BD\u03B5\u03C3\u03B9\u03C2", transliteration: "genesis", gloss: "origin" }],
  [1080, { original: "\u03B3\u03B5\u03BD\u03BD\u03AC\u03C9", transliteration: "gennao", gloss: "to beget" }],
  [1093, { original: "\u03B3\u1FC6", transliteration: "ge", gloss: "earth, land" }],
  [1096, { original: "\u03B3\u03AF\u03BD\u03BF\u03BC\u03B1\u03B9", transliteration: "ginomai", gloss: "to become" }],
  [1097, { original: "\u03B3\u03B9\u03BD\u03CE\u03C3\u03BA\u03C9", transliteration: "ginosko", gloss: "to know" }],
  [1138, { original: "\u0394\u03B1\u03C5\u03B5\u03AF\u03B4", transliteration: "Daueid", gloss: "David" }],
  [1161, { original: "\u03B4\u03AD", transliteration: "de", gloss: "but, and" }],
  [1242, { original: "\u03B4\u03B9\u03B1\u03B8\u03AE\u03BA\u03B7", transliteration: "diatheke", gloss: "covenant" }],
  [1343, { original: "\u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7", transliteration: "dikaiosyne", gloss: "righteousness" }],
  [1391, { original: "\u03B4\u03CC\u03BE\u03B1", transliteration: "doxa", gloss: "glory" }],
  [1411, { original: "\u03B4\u03CD\u03BD\u03B1\u03BC\u03B9\u03C2", transliteration: "dynamis", gloss: "power" }],
  [1453, { original: "\u1F10\u03B3\u03B5\u03AF\u03C1\u03C9", transliteration: "egeiro", gloss: "to raise up" }],
  [1510, { original: "\u03B5\u1F30\u03BC\u03AF", transliteration: "eimi", gloss: "to be" }],
  [1515, { original: "\u03B5\u1F30\u03C1\u03AE\u03BD\u03B7", transliteration: "eirene", gloss: "peace" }],
  [1519, { original: "\u03B5\u1F30\u03C2", transliteration: "eis", gloss: "into, to" }],
  [1537, { original: "\u1F10\u03BA", transliteration: "ek", gloss: "out of, from" }],
  [1577, { original: "\u1F10\u03BA\u03BA\u03BB\u03B7\u03C3\u03AF\u03B1", transliteration: "ekklesia", gloss: "church" }],
  [1680, { original: "\u1F10\u03BB\u03C0\u03AF\u03C2", transliteration: "elpis", gloss: "hope" }],
  [1722, { original: "\u1F10\u03BD", transliteration: "en", gloss: "in, among" }],
  [1849, { original: "\u1F10\u03BE\u03BF\u03C5\u03C3\u03AF\u03B1", transliteration: "exousia", gloss: "authority" }],
  [2064, { original: "\u1F14\u03C1\u03C7\u03BF\u03BC\u03B1\u03B9", transliteration: "erchomai", gloss: "to come" }],
  [2098, { original: "\u03B5\u1F50\u03B1\u03B3\u03B3\u03AD\u03BB\u03B9\u03BF\u03BD", transliteration: "euangelion", gloss: "gospel" }],
  [2192, { original: "\u1F14\u03C7\u03C9", transliteration: "echo", gloss: "to have" }],
  [2222, { original: "\u03B6\u03C9\u03AE", transliteration: "zoe", gloss: "life" }],
  [2288, { original: "\u03B8\u03AC\u03BD\u03B1\u03C4\u03BF\u03C2", transliteration: "thanatos", gloss: "death" }],
  [2316, { original: "\u03B8\u03B5\u03CC\u03C2", transliteration: "theos", gloss: "God" }],
  [2384, { original: "\u1F38\u03B1\u03BA\u03CE\u03B2", transliteration: "Iakob", gloss: "Jacob" }],
  [2424, { original: "\u1F38\u03B7\u03C3\u03BF\u1FE6\u03C2", transliteration: "Iesous", gloss: "Jesus" }],
  [2455, { original: "\u1F38\u03BF\u03CD\u03B4\u03B1\u03C2", transliteration: "Ioudas", gloss: "Judah" }],
  [2464, { original: "\u1F38\u03C3\u03B1\u03AC\u03BA", transliteration: "Isaak", gloss: "Isaac" }],
  [2532, { original: "\u03BA\u03B1\u03AF", transliteration: "kai", gloss: "and, also" }],
  [2588, { original: "\u03BA\u03B1\u03C1\u03B4\u03AF\u03B1", transliteration: "kardia", gloss: "heart" }],
  [2889, { original: "\u03BA\u03CC\u03C3\u03BC\u03BF\u03C2", transliteration: "kosmos", gloss: "world" }],
  [2962, { original: "\u03BA\u03CD\u03C1\u03B9\u03BF\u03C2", transliteration: "kyrios", gloss: "Lord" }],
  [3004, { original: "\u03BB\u03AD\u03B3\u03C9", transliteration: "lego", gloss: "to say" }],
  [3056, { original: "\u03BB\u03CC\u03B3\u03BF\u03C2", transliteration: "logos", gloss: "word" }],
  [3101, { original: "\u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2", transliteration: "mathetes", gloss: "disciple" }],
  [3340, { original: "\u03BC\u03B5\u03C4\u03B1\u03BD\u03BF\u03AD\u03C9", transliteration: "metanoeo", gloss: "to repent" }],
  [3551, { original: "\u03BD\u03CC\u03BC\u03BF\u03C2", transliteration: "nomos", gloss: "law" }],
  [3588, { original: "\u1F41", transliteration: "ho", gloss: "the" }],
  [3739, { original: "\u1F45\u03C2", transliteration: "hos", gloss: "who, which" }],
  [3772, { original: "\u03BF\u1F50\u03C1\u03B1\u03BD\u03CC\u03C2", transliteration: "ouranos", gloss: "heaven" }],
  [3875, { original: "\u03C0\u03B1\u03C1\u03AC\u03BA\u03BB\u03B7\u03C4\u03BF\u03C2", transliteration: "parakletos", gloss: "advocate" }],
  [3956, { original: "\u03C0\u1FB6\u03C2", transliteration: "pas", gloss: "all, every" }],
  [3962, { original: "\u03C0\u03B1\u03C4\u03AE\u03C1", transliteration: "pater", gloss: "father" }],
  [4100, { original: "\u03C0\u03B9\u03C3\u03C4\u03B5\u03CD\u03C9", transliteration: "pisteuo", gloss: "to believe" }],
  [4102, { original: "\u03C0\u03AF\u03C3\u03C4\u03B9\u03C2", transliteration: "pistis", gloss: "faith" }],
  [4137, { original: "\u03C0\u03BB\u03B7\u03C1\u03CC\u03C9", transliteration: "pleroo", gloss: "to fulfill" }],
  [4151, { original: "\u03C0\u03BD\u03B5\u1FE6\u03BC\u03B1", transliteration: "pneuma", gloss: "spirit" }],
  [4160, { original: "\u03C0\u03BF\u03B9\u03AD\u03C9", transliteration: "poieo", gloss: "to do, make" }],
  [4396, { original: "\u03C0\u03C1\u03BF\u03C6\u03AE\u03C4\u03B7\u03C2", transliteration: "prophetes", gloss: "prophet" }],
  [4561, { original: "\u03C3\u03AC\u03C1\u03BE", transliteration: "sarx", gloss: "flesh" }],
  [4982, { original: "\u03C3\u03CE\u03B6\u03C9", transliteration: "sozo", gloss: "to save" }],
  [4991, { original: "\u03C3\u03C9\u03C4\u03B7\u03C1\u03AF\u03B1", transliteration: "soteria", gloss: "salvation" }],
  [5043, { original: "\u03C4\u03AD\u03BA\u03BD\u03BF\u03BD", transliteration: "teknon", gloss: "child" }],
  [5207, { original: "\u03C5\u1F31\u03CC\u03C2", transliteration: "huios", gloss: "son" }],
  [5329, { original: "\u03A6\u03AC\u03C1\u03B5\u03C2", transliteration: "Phares", gloss: "Perez" }],
  [5485, { original: "\u03C7\u03AC\u03C1\u03B9\u03C2", transliteration: "charis", gloss: "grace" }],
  [5547, { original: "\u03A7\u03C1\u03B9\u03C3\u03C4\u03CC\u03C2", transliteration: "Christos", gloss: "Christ" }],
  [5590, { original: "\u03C8\u03C5\u03C7\u03AE", transliteration: "psuche", gloss: "soul, life" }]
]);

// src/render/interlinear.ts
var InterlinearRenderer = class {
  /**
   * Render a verse's interlinear display into the target element.
   */
  renderVerse(target, verseNum, englishText, wordData, options, component) {
    const verseEl = target.createDiv({ cls: "bil-verse" });
    const textEl = verseEl.createDiv({ cls: "bil-verse-text" });
    const supEl = textEl.createEl("sup", { text: String(verseNum) });
    supEl.addClass("bil-verse-num");
    textEl.appendText(" " + englishText);
    if (wordData.length > 0) {
      const wordsContainer = verseEl.createDiv({
        cls: [
          "bil-interlinear-words",
          options.mode === "study" ? "bil-expanded" : "bil-collapsed"
        ]
      });
      if (options.isHebrew) {
        wordsContainer.setAttr("dir", "rtl");
      }
      for (const wd of wordData) {
        const wordEl = wordsContainer.createDiv({ cls: "bil-word" });
        const skip = isSkippable(wd.strongs, wd.prefix === "G");
        const origEl = wordEl.createDiv({
          cls: "bil-word-original",
          text: wd.word
        });
        if (options.isHebrew) {
          origEl.setAttr("dir", "rtl");
        }
        if (skip) {
          origEl.addClass("bil-function-word");
          continue;
        }
        const strongsEl = wordEl.createDiv({ cls: "bil-word-strongs" });
        const conceptPath = getConceptPath(wd.strongs, wd.prefix === "G");
        const strongsLabel = `${wd.prefix}${wd.strongs}`;
        if (conceptPath) {
          const linkEl = strongsEl.createEl("a", {
            cls: "internal-link",
            text: strongsLabel,
            attr: { "data-href": conceptPath }
          });
          linkEl.addEventListener("click", (e) => {
            e.preventDefault();
            window.app?.workspace?.openLinkText(
              conceptPath,
              "",
              false
            );
          });
        } else {
          strongsEl.createSpan({ text: strongsLabel, cls: "bil-strongs-plain" });
        }
        if (wd.entry) {
          wordEl.createDiv({
            cls: "bil-word-translit",
            text: wd.entry.transliteration
          });
        }
        if (wd.entry) {
          wordEl.createDiv({
            cls: "bil-word-gloss",
            text: wd.entry.gloss
          });
        } else {
          wordEl.createDiv({
            cls: "bil-word-gloss",
            text: "\u2014"
          });
        }
        if (wd.entry) {
          wordEl.setAttr(
            "title",
            `${strongsLabel}: ${wd.entry.original} (${wd.entry.transliteration}) \u2014 ${wd.entry.gloss}`
          );
        }
      }
    }
  }
  /**
   * Render a pericope (group of verses) with interlinear.
   */
  renderPericope(target, title, verses, options, component) {
    const periEl = target.createDiv({ cls: "bil-pericope" });
    if (title) {
      periEl.createEl("h3", { text: title, cls: "bil-pericope-title" });
    }
    for (const verse of verses) {
      this.renderVerse(
        periEl,
        verse.verseNum,
        verse.english,
        verse.wordData,
        options,
        component
      );
    }
  }
};

// src/render/crossrefs.ts
var CrossRefRenderer = class {
  constructor(app) {
    this.app = app;
  }
  /**
   * Render cross-references as a collapsible details element.
   */
  renderCrossRefs(target, refs, sourceBook, component) {
    if (refs.length === 0)
      return;
    const details = target.createEl("details", { cls: "bil-xrefs" });
    const summary = details.createEl("summary", {
      text: `Cross-references (${refs.length})`,
      cls: "bil-xrefs-summary"
    });
    const list = details.createEl("ul", { cls: "bil-xrefs-list" });
    for (const ref of refs) {
      const targetBook = findBookById(ref.targetBook);
      if (!targetBook)
        continue;
      const li = list.createEl("li", { cls: "bil-xref-item" });
      const relType = this.classifyRelationship(sourceBook, ref.targetBook);
      const displayRef = `${targetBook.name} ${ref.targetChapter}:${ref.targetVerse}`;
      const linkPath = `bibles/NASB-IL/${targetBook.name}/${targetBook.name} ${ref.targetChapter}`;
      const linkEl = li.createEl("a", {
        cls: "internal-link",
        text: displayRef,
        attr: { "data-href": linkPath }
      });
      linkEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(linkPath, "", false);
      });
      li.createSpan({
        text: ` @${relType}`,
        cls: `bil-xref-type bil-xref-${relType}`
      });
      li.createSpan({
        text: ` (${ref.votes})`,
        cls: "bil-xref-votes"
      });
    }
  }
  classifyRelationship(fromBook, toBook) {
    if (fromBook <= 39 && toBook >= 40)
      return "fulfills";
    if (fromBook >= 40 && toBook <= 39)
      return "quotes";
    if (fromBook === toBook)
      return "parallels";
    if (Math.abs(fromBook - toBook) <= 2)
      return "parallels";
    return "alludes_to";
  }
};

// src/editor/reference-detect.ts
function buildReferenceRegex() {
  const bookNames = [];
  for (const book of BOOKS) {
    bookNames.push(book.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    for (const alias of book.aliases) {
      bookNames.push(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    }
  }
  bookNames.sort((a, b) => b.length - a.length);
  const pattern = `(?:^|[\\s(\\[])(${bookNames.join("|")})\\.?\\s*(\\d{1,3})(?:\\s*[:.]\\s*(\\d{1,3})(?:\\s*[-\u2013]\\s*(\\d{1,3}))?)?(?=[\\s,;.)\\]]|$)`;
  return new RegExp(pattern, "gi");
}
var cachedRegex = null;
function getReferenceRegex() {
  if (!cachedRegex) {
    cachedRegex = buildReferenceRegex();
  }
  cachedRegex.lastIndex = 0;
  return cachedRegex;
}
function detectReferences(el, ctx) {
  if (el.querySelector("code, pre, .frontmatter"))
    return;
  const textNodes = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent && (parent.tagName === "A" || parent.tagName === "CODE" || parent.tagName === "PRE" || parent.classList.contains("internal-link") || parent.closest("a, code, pre"))) {
      continue;
    }
    if (node.textContent && node.textContent.trim().length > 0) {
      textNodes.push(node);
    }
  }
  const regex = getReferenceRegex();
  for (const textNode of textNodes) {
    const text = textNode.textContent || "";
    regex.lastIndex = 0;
    const matches = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      const book = getBookByAlias(m[1]);
      if (!book)
        continue;
      const chapter = parseInt(m[2], 10);
      if (chapter < 1 || chapter > book.chapters)
        continue;
      const verse = m[3] ? parseInt(m[3], 10) : void 0;
      const endVerse = m[4] ? parseInt(m[4], 10) : void 0;
      matches.push({
        fullMatch: m[0],
        index: m.index,
        book,
        chapter,
        verse,
        endVerse
      });
    }
    if (matches.length === 0)
      continue;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    for (const { fullMatch, index: startIdx, book, chapter, verse, endVerse } of matches) {
      const beforeText = text.slice(lastIdx, startIdx);
      if (beforeText) {
        frag.appendChild(document.createTextNode(beforeText));
      }
      const matchText = fullMatch.trimStart();
      const linkPath = `bibles/NASB-IL/${book.name}/${book.name} ${chapter}`;
      const displayText = verse ? `${book.name} ${chapter}:${verse}${endVerse ? `-${endVerse}` : ""}` : `${book.name} ${chapter}`;
      const linkEl = document.createElement("a");
      linkEl.className = "internal-link bil-detected-ref";
      linkEl.setAttribute("data-href", linkPath);
      linkEl.textContent = matchText;
      linkEl.title = displayText;
      const leadingSpace = fullMatch.length - matchText.length;
      if (leadingSpace > 0) {
        frag.appendChild(
          document.createTextNode(fullMatch.slice(0, leadingSpace))
        );
      }
      frag.appendChild(linkEl);
      lastIdx = startIdx + fullMatch.length;
    }
    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

// src/editor/suggest.ts
function parseTriggerLine(line) {
  if (!line.startsWith("-- "))
    return null;
  const ref = line.slice(3).trim();
  if (ref.length < 2)
    return null;
  const m = ref.match(
    /^([A-Za-z0-9 ]+?)\s*(\d{1,3})(?:\s*[:.]?\s*(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?)?$/
  );
  if (!m)
    return null;
  const bookName = m[1].trim();
  const book = getBookByAlias(bookName);
  if (!book)
    return null;
  const chapter = parseInt(m[2], 10);
  if (chapter < 1 || chapter > book.chapters)
    return null;
  const startVerse = m[3] ? parseInt(m[3], 10) : void 0;
  const endVerse = m[4] ? parseInt(m[4], 10) : void 0;
  return { book, chapter, startVerse, endVerse };
}
function formatPassageCallout(bookName, chapter, verses, startVerse, endVerse) {
  const refLabel = startVerse ? `${bookName} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ""}` : `${bookName} ${chapter}`;
  const linkPath = `bibles/NASB-IL/${bookName}/${bookName} ${chapter}`;
  let body = "";
  if (startVerse && endVerse) {
    for (let v = startVerse; v <= Math.min(endVerse, verses.length); v++) {
      body += `> <sup>${v}</sup> ${verses[v - 1]}
`;
    }
  } else if (startVerse) {
    if (startVerse <= verses.length) {
      body = `> <sup>${startVerse}</sup> ${verses[startVerse - 1]}
`;
    }
  } else {
    for (let v = 1; v <= verses.length; v++) {
      body += `> <sup>${v}</sup> ${verses[v - 1]} `;
    }
    body = `> ${body.trim()}
`;
  }
  return `> [!quote]+ [[${linkPath}|${refLabel}]]
${body}`;
}

// src/settings.ts
var import_obsidian3 = require("obsidian");
var DEFAULT_SETTINGS = {
  defaultTranslation: "NASB",
  originalLanguageDisplay: true,
  interlinearMode: "study",
  crossrefVoteThreshold: 10,
  bibleFilesPath: "bibles/NASB-IL",
  conceptsPath: "concepts",
  maxCrossrefsPerVerse: 5,
  detectReferencesInText: true
};
var BibleInterlinearSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin, settings, saveCallback) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = settings;
    this.saveCallback = saveCallback;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Bible Interlinear Settings" });
    new import_obsidian3.Setting(containerEl).setName("Default translation").setDesc("Translation used for verse text (e.g., NASB, KJV, WEBP)").addText(
      (text) => text.setPlaceholder("NASB").setValue(this.settings.defaultTranslation).onChange(async (value) => {
        this.settings.defaultTranslation = value;
        await this.saveCallback();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Show original language").setDesc("Display Hebrew/Greek interlinear text alongside English").addToggle(
      (toggle) => toggle.setValue(this.settings.originalLanguageDisplay).onChange(async (value) => {
        this.settings.originalLanguageDisplay = value;
        await this.saveCallback();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Interlinear mode").setDesc(
      "Reading: original + gloss only. Study: all annotation layers."
    ).addDropdown(
      (dropdown) => dropdown.addOption("reading", "Reading").addOption("study", "Study").setValue(this.settings.interlinearMode).onChange(async (value) => {
        this.settings.interlinearMode = value;
        await this.saveCallback();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Cross-reference vote threshold").setDesc(
      "Minimum community votes for a cross-reference to be shown (1-100)"
    ).addSlider(
      (slider) => slider.setLimits(1, 100, 1).setValue(this.settings.crossrefVoteThreshold).setDynamicTooltip().onChange(async (value) => {
        this.settings.crossrefVoteThreshold = value;
        await this.saveCallback();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Max cross-refs per verse").setDesc("Maximum cross-references shown per verse (1-20)").addSlider(
      (slider) => slider.setLimits(1, 20, 1).setValue(this.settings.maxCrossrefsPerVerse).setDynamicTooltip().onChange(async (value) => {
        this.settings.maxCrossrefsPerVerse = value;
        await this.saveCallback();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Bible files path").setDesc("Vault path to the NASB-IL Bible files").addText(
      (text) => text.setPlaceholder("bibles/NASB-IL").setValue(this.settings.bibleFilesPath).onChange(async (value) => {
        this.settings.bibleFilesPath = value;
        await this.saveCallback();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Concepts path").setDesc("Vault path to concept notes").addText(
      (text) => text.setPlaceholder("concepts").setValue(this.settings.conceptsPath).onChange(async (value) => {
        this.settings.conceptsPath = value;
        await this.saveCallback();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Detect references in text").setDesc(
      "Auto-detect Bible references (Gen 1:1, John 3:16) in notes and make them clickable"
    ).addToggle(
      (toggle) => toggle.setValue(this.settings.detectReferencesInText).onChange(async (value) => {
        this.settings.detectReferencesInText = value;
        await this.saveCallback();
      })
    );
  }
};

// src/main.ts
var BibleInterlinearPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.cache = new BibleCache(this.app);
    this.crossrefs = new CrossRefIndex(
      this.app,
      this.settings.crossrefVoteThreshold
    );
    this.interlinearRenderer = new InterlinearRenderer();
    this.crossrefRenderer = new CrossRefRenderer(this.app);
    this.crossrefs.load().catch((e) => {
      console.warn("Bible Interlinear: Failed to load cross-references", e);
    });
    this.registerMarkdownCodeBlockProcessor(
      "bible-interlinear",
      async (source, el, ctx) => {
        await this.processInterlinearBlock(source, el);
      }
    );
    this.registerMarkdownCodeBlockProcessor(
      "bible",
      async (source, el, ctx) => {
        await this.processVerseBlock(source, el);
      }
    );
    this.registerMarkdownCodeBlockProcessor(
      "gloss",
      async (source, el, ctx) => {
        await this.processGlossBlock(source, el);
      }
    );
    this.registerMarkdownCodeBlockProcessor(
      "ngloss",
      async (source, el, ctx) => {
        await this.processGlossBlock(source, el);
      }
    );
    this.registerMarkdownPostProcessor((el, ctx) => {
      if (this.settings.detectReferencesInText) {
        detectReferences(el, ctx);
      }
    });
    this.registerEditorSuggest(new BibleReferenceSuggest(this));
    this.addCommand({
      id: "switch-translation",
      name: "Switch Bible translation",
      callback: () => {
        new import_obsidian4.Notice(
          "Translation switching: use plugin settings to change default translation"
        );
      }
    });
    this.addCommand({
      id: "clear-cache",
      name: "Clear verse cache",
      callback: () => {
        this.cache.clearCache();
        new import_obsidian4.Notice("Bible verse cache cleared.");
      }
    });
    this.addCommand({
      id: "reload-crossrefs",
      name: "Reload cross-references",
      callback: async () => {
        await this.crossrefs.load();
        new import_obsidian4.Notice("Cross-references reloaded.");
      }
    });
    this.addSettingTab(
      new BibleInterlinearSettingTab(
        this.app,
        this,
        this.settings,
        () => this.saveSettings()
      )
    );
    console.log("Bible Interlinear plugin loaded");
  }
  onunload() {
    console.log("Bible Interlinear plugin unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  /**
   * Process a ```bible-interlinear``` code block.
   * Syntax:
   *   ref: Gen 1:1-5
   *   translation: NASB
   *   original: WLCa
   *   mode: study
   */
  async processInterlinearBlock(source, el) {
    const config = this.parseBlockConfig(source);
    if (!config.ref) {
      el.createDiv({
        cls: "bil-error",
        text: "Missing ref: parameter (e.g., ref: Gen 1:1-5)"
      });
      return;
    }
    const parsed = this.parseReference(config.ref);
    if (!parsed) {
      el.createDiv({
        cls: "bil-error",
        text: `Invalid reference: ${config.ref}`
      });
      return;
    }
    const { book, chapter, startVerse, endVerse } = parsed;
    const translation = config.translation || this.settings.defaultTranslation;
    const origVersion = book.testament === "NT" ? "TISCH" : "WLCa";
    const isHebrew = book.testament === "OT";
    const mode = config.mode || this.settings.interlinearMode;
    const englishVerses = await this.cache.getChapter(
      translation,
      book.id,
      chapter
    );
    const origVerses = await this.cache.getChapter(
      origVersion,
      book.id,
      chapter
    );
    if (!englishVerses || englishVerses.length === 0) {
      el.createDiv({
        cls: "bil-error",
        text: `No verses found for ${book.name} ${chapter} in ${translation}`
      });
      return;
    }
    const start = startVerse || 1;
    const end = endVerse || (startVerse || englishVerses.length);
    const container = el.createDiv({ cls: "bil-container" });
    const refLabel = startVerse ? `${book.name} ${chapter}:${start}${end !== start ? `-${end}` : ""}` : `${book.name} ${chapter}`;
    container.createEl("h3", { text: refLabel, cls: "bil-title" });
    for (let v = start; v <= Math.min(end, englishVerses.length); v++) {
      const english = englishVerses[v - 1] || "";
      const origText = origVerses && origVerses[v - 1] ? origVerses[v - 1] : "";
      const wordData = origText ? parseStrongsText(origText, !isHebrew) : [];
      this.interlinearRenderer.renderVerse(
        container,
        v,
        english,
        wordData,
        { mode, isHebrew },
        this
      );
      const xrefs = this.crossrefs.getForVerse(
        book.id,
        chapter,
        v,
        this.settings.maxCrossrefsPerVerse
      );
      if (xrefs.length > 0) {
        this.crossrefRenderer.renderCrossRefs(
          container,
          xrefs,
          book.id,
          this
        );
      }
    }
  }
  /**
   * Process a ```bible``` code block (simple verse insertion).
   */
  async processVerseBlock(source, el) {
    const config = this.parseBlockConfig(source);
    const ref = config.ref || source.trim().split("\n")[0];
    const parsed = this.parseReference(ref);
    if (!parsed) {
      const legacyParsed = this.parseLegacyReference(ref);
      if (legacyParsed) {
        const { bookId, chapter: chapter2, verse } = legacyParsed;
        const translation2 = config.translation || this.settings.defaultTranslation;
        const verses2 = await this.cache.getChapter(translation2, bookId, chapter2);
        if (verses2 && verse && verse <= verses2.length) {
          const text = `<sup>${verse}</sup> ${verses2[verse - 1]}`;
          await import_obsidian4.MarkdownRenderer.render(this.app, text, el, "", this);
        }
        return;
      }
      el.createDiv({ cls: "bil-error", text: `Unknown reference: ${ref}` });
      return;
    }
    const { book, chapter, startVerse, endVerse } = parsed;
    const translation = config.translation || this.settings.defaultTranslation;
    const verses = await this.cache.getChapter(translation, book.id, chapter);
    if (!verses || verses.length === 0) {
      el.createDiv({
        cls: "bil-error",
        text: `No text found for ${book.name} ${chapter}`
      });
      return;
    }
    let md = "";
    const start = startVerse || 1;
    const end = endVerse || (startVerse || verses.length);
    for (let v = start; v <= Math.min(end, verses.length); v++) {
      md += `<sup>${v}</sup> ${verses[v - 1]} `;
    }
    await import_obsidian4.MarkdownRenderer.render(this.app, md.trim(), el, "", this);
  }
  parseBlockConfig(source) {
    const config = {};
    for (const line of source.split("\n")) {
      const m = line.match(/^\s*(\w+)\s*:\s*(.+?)\s*$/);
      if (m) {
        config[m[1].toLowerCase()] = m[2];
      }
    }
    return config;
  }
  parseReference(ref) {
    const m = ref.match(
      /^([A-Za-z0-9 ]+?)\s*(\d{1,3})(?:\s*[:.]?\s*(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?)?$/
    );
    if (!m)
      return null;
    const book = getBookByAlias(m[1].trim());
    if (!book)
      return null;
    const chapter = parseInt(m[2], 10);
    if (chapter < 1 || chapter > book.chapters)
      return null;
    const startVerse = m[3] ? parseInt(m[3], 10) : void 0;
    const endVerse = m[4] ? parseInt(m[4], 10) : void 0;
    return { book, chapter, startVerse, endVerse };
  }
  parseLegacyReference(ref) {
    const parts = ref.trim().replace(/[:-]/g, " ").split(/\s+/);
    if (parts.length < 2)
      return null;
    const bookId = parseInt(parts[0], 10);
    if (isNaN(bookId) || bookId < 1 || bookId > 66)
      return null;
    const chapter = parseInt(parts[1], 10);
    if (isNaN(chapter))
      return null;
    const verse = parts[2] ? parseInt(parts[2], 10) : void 0;
    return { bookId, chapter, verse };
  }
  /**
   * Process a ```gloss``` or ```ngloss``` code block.
   * Backward-compatible with the ling-gloss plugin format.
   *
   * Supported commands:
   *   \gla word1 word2 ...   — first gloss line (original text, italic)
   *   \glb word1 word2 ...   — second gloss line (morpheme gloss)
   *   \glc word1 word2 ...   — third gloss line (English gloss)
   *   \ft  free translation   — free translation line (italic, quoted)
   *   \ex  example number     — example number in parentheses
   *   \src source text        — source citation
   */
  async processGlossBlock(source, el) {
    const container = el.createDiv({ cls: "ling-gloss" });
    const body = container.createDiv({ cls: "ling-gloss-body" });
    const lines = source.split("\n");
    const glossLines = [];
    let currentLevel = -1;
    let exNumber = "";
    let ftText = "";
    let srcText = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0)
        continue;
      if (trimmed.startsWith("\\ex")) {
        exNumber = trimmed.slice(3).trim();
      } else if (trimmed.startsWith("\\gla")) {
        currentLevel = 0;
        glossLines[0] = trimmed.slice(4).trim().split(/\s+/);
      } else if (trimmed.startsWith("\\glb")) {
        currentLevel = 1;
        glossLines[1] = trimmed.slice(4).trim().split(/\s+/);
      } else if (trimmed.startsWith("\\glc")) {
        currentLevel = 2;
        glossLines[2] = trimmed.slice(4).trim().split(/\s+/);
      } else if (trimmed.startsWith("\\ft")) {
        ftText = trimmed.slice(3).trim();
      } else if (trimmed.startsWith("\\src")) {
        srcText = trimmed.slice(4).trim();
      } else if (currentLevel >= 0) {
        if (!glossLines[currentLevel]) {
          glossLines[currentLevel] = [];
        }
        glossLines[currentLevel].push(...trimmed.split(/\s+/));
      }
    }
    if (exNumber) {
      container.createDiv({ cls: "ling-gloss-number", text: exNumber });
    }
    const maxWords = Math.max(...glossLines.map((l) => l?.length ?? 0), 0);
    if (maxWords > 0) {
      const elementsDiv = body.createDiv({ cls: "ling-gloss-elements" });
      for (let i = 0; i < maxWords; i++) {
        const wordCol = elementsDiv.createDiv({ cls: "ling-gloss-element" });
        for (let level = 0; level < glossLines.length; level++) {
          const words = glossLines[level];
          const word = words && i < words.length ? words[i] : "";
          const levelClass = `ling-gloss-level-${String.fromCharCode(97 + level)}`;
          wordCol.createDiv({ cls: levelClass, text: word });
        }
      }
    }
    if (ftText) {
      body.createDiv({ cls: "ling-gloss-translation", text: ftText });
    }
    if (srcText) {
      body.createDiv({ cls: "ling-gloss-source", text: srcText });
    }
  }
};
var BibleReferenceSuggest = class extends import_obsidian4.EditorSuggest {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  onTrigger(cursor, editor, file) {
    const line = editor.getLine(cursor.line);
    if (!line.startsWith("-- "))
      return null;
    const parsed = parseTriggerLine(line);
    if (!parsed)
      return null;
    return {
      start: { line: cursor.line, ch: 0 },
      end: { line: cursor.line, ch: line.length },
      query: line.slice(3).trim()
    };
  }
  async getSuggestions(context) {
    const parsed = parseTriggerLine("-- " + context.query);
    if (!parsed)
      return [];
    const { book, chapter, startVerse, endVerse } = parsed;
    const refLabel = startVerse ? `${book.name} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ""}` : `${book.name} ${chapter}`;
    return [
      {
        book,
        chapter,
        startVerse,
        endVerse,
        displayText: `Insert ${refLabel}`
      }
    ];
  }
  renderSuggestion(value, el) {
    el.createDiv({ text: value.displayText });
    el.createDiv({
      cls: "bil-suggest-hint",
      text: `${value.book.name} (${value.book.originalName})`
    });
  }
  async selectSuggestion(value, evt) {
    const { book, chapter, startVerse, endVerse } = value;
    const translation = this.plugin.settings.defaultTranslation;
    const verses = await this.plugin.cache.getChapter(
      translation,
      book.id,
      chapter
    );
    if (!verses) {
      new import_obsidian4.Notice(`No verses found for ${book.name} ${chapter}`);
      return;
    }
    const callout = formatPassageCallout(
      book.name,
      chapter,
      verses,
      startVerse,
      endVerse
    );
    const editor = this.context?.editor;
    if (editor && this.context) {
      editor.replaceRange(
        callout,
        this.context.start,
        this.context.end
      );
    }
  }
};
