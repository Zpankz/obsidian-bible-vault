/**
 * Reader for My Bible's .chapters/ cache files.
 *
 * File format: files named "{VERSION} {book_num} {chapter}.txt"
 * One verse per line (line 1 = verse 1, line 2 = verse 2, etc.)
 *
 * Supported versions:
 *   NASB   — plain English text
 *   WLCa   — Hebrew with <S>NNNN</S> Strong's tags
 *   TISCH  — Greek with <S>NNNN</S> Strong's tags
 */

import { App, normalizePath } from "obsidian";

export interface VerseText {
	verseNum: number;
	text: string;
}

export class BibleCache {
	private app: App;
	private cachePath: string;
	private fileCache: Map<string, string[]>;

	constructor(app: App) {
		this.app = app;
		this.cachePath = normalizePath(
			".obsidian/plugins/gslogimaker-my-bible/.chapters"
		);
		this.fileCache = new Map();
	}

	/**
	 * Build the filename for a given version, book number, and chapter.
	 */
	private getFileName(version: string, bookNum: number, chapter: number): string {
		return `${version} ${bookNum} ${chapter}.txt`;
	}

	/**
	 * Read a cache file and return lines as an array.
	 * Results are cached in memory for repeat access.
	 */
	private async readCacheFile(version: string, bookNum: number, chapter: number): Promise<string[]> {
		const fileName = this.getFileName(version, bookNum, chapter);
		const cacheKey = `${version}-${bookNum}-${chapter}`;

		if (this.fileCache.has(cacheKey)) {
			return this.fileCache.get(cacheKey)!;
		}

		const fullPath = normalizePath(`${this.cachePath}/${fileName}`);

		try {
			const basePath = (this.app.vault.adapter as any).basePath as string;
			const fs = require("fs");
			const absolutePath = `${basePath}/${fullPath}`;

			if (!fs.existsSync(absolutePath)) {
				return [];
			}

			const content: string = fs.readFileSync(absolutePath, "utf-8");
			const lines = content.split("\n").filter((line: string) => line.length > 0);
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
	async getVerses(
		version: string,
		bookNum: number,
		chapter: number,
		startVerse?: number,
		endVerse?: number
	): Promise<VerseText[]> {
		const lines = await this.readCacheFile(version, bookNum, chapter);

		if (lines.length === 0) {
			return [];
		}

		const start = (startVerse ?? 1) - 1; // convert to 0-based
		const end = endVerse ?? lines.length;

		const verses: VerseText[] = [];
		for (let i = start; i < Math.min(end, lines.length); i++) {
			verses.push({
				verseNum: i + 1,
				text: lines[i],
			});
		}

		return verses;
	}

	/**
	 * Get a single verse.
	 */
	async getVerse(
		version: string,
		bookNum: number,
		chapter: number,
		verse: number
	): Promise<string | null> {
		const lines = await this.readCacheFile(version, bookNum, chapter);
		if (verse < 1 || verse > lines.length) {
			return null;
		}
		return lines[verse - 1];
	}

	/**
	 * Get the total number of verses in a chapter.
	 */
	async getVerseCount(version: string, bookNum: number, chapter: number): Promise<number> {
		const lines = await this.readCacheFile(version, bookNum, chapter);
		return lines.length;
	}

	/**
	 * Check whether a particular version + book + chapter is available in the cache.
	 */
	async hasChapter(version: string, bookNum: number, chapter: number): Promise<boolean> {
		const lines = await this.readCacheFile(version, bookNum, chapter);
		return lines.length > 0;
	}

	/**
	 * Get all verse lines for a chapter as a flat string array.
	 * This is the primary API used by code block processors.
	 * Returns the raw lines (one per verse) or null if the file is missing.
	 */
	async getChapter(
		version: string,
		bookNum: number,
		chapter: number
	): Promise<string[] | null> {
		const lines = await this.readCacheFile(version, bookNum, chapter);
		if (lines.length === 0) return null;
		return lines;
	}

	/**
	 * Clear the in-memory file cache (useful if files changed on disk).
	 */
	clearCache(): void {
		this.fileCache.clear();
	}
}
