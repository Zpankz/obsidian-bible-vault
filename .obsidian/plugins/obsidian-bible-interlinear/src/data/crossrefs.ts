/**
 * Loader for bibles/cross_references.tsv
 *
 * Format: From Verse\tTo Verse\tVotes
 * References like Gen.1.1, Matt.11.25
 * First line is a header/comment.
 */

import { App, normalizePath } from "obsidian";
import { findBookByXrefKey, findBookById, getCrossRefBookKey } from "./books";

export interface CrossReference {
	fromBook: string;
	fromChapter: number;
	fromVerse: number;
	toBook: string;
	toChapter: number;
	toVerse: number;
	votes: number;
}

/**
 * CrossRef shape used by the renderer — resolved to book IDs.
 */
export interface CrossRef {
	targetBook: number;
	targetChapter: number;
	targetVerse: number;
	votes: number;
	relationType?: string;
}

/**
 * Parsed verse key for fast indexing: "bookKey.chapter.verse"
 */
function makeVerseKey(book: string, chapter: number, verse: number): string {
	return `${book}.${chapter}.${verse}`;
}

export class CrossRefIndex {
	private index: Map<string, CrossReference[]>;
	private loaded: boolean;
	private app: App;
	private voteThreshold: number;

	constructor(app: App, voteThreshold?: number) {
		this.app = app;
		this.index = new Map();
		this.loaded = false;
		this.voteThreshold = voteThreshold ?? 10;
	}

	/**
	 * Load and parse the TSV file, filtering by vote threshold.
	 * Can be called with no args to use stored app/threshold, or with explicit args.
	 */
	async load(app?: App, voteThreshold?: number): Promise<void> {
		const resolvedApp = app ?? this.app;
		const resolvedThreshold = voteThreshold ?? this.voteThreshold;
		this.index.clear();
		this.loaded = false;

		const tsvPath = normalizePath("bibles/cross_references.tsv");

		let content: string;
		try {
			const basePath = (resolvedApp.vault.adapter as any).basePath as string;
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
			// Skip header/comment lines
			if (line.startsWith("#") || line.startsWith("From")) {
				continue;
			}

			const trimmed = line.trim();
			if (trimmed.length === 0) {
				continue;
			}

			const parts = trimmed.split("\t");
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

			const ref: CrossReference = {
				fromBook: from.book,
				fromChapter: from.chapter,
				fromVerse: from.verse,
				toBook: to.book,
				toChapter: to.chapter,
				toVerse: to.verse,
				votes,
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

		// Sort each verse's refs by vote count descending
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
	getRefsForVerse(bookXrefKey: string, chapter: number, verse: number, maxRefs: number): CrossReference[] {
		if (!this.loaded) return [];

		const key = makeVerseKey(bookXrefKey, chapter, verse);
		const refs = this.index.get(key);
		if (!refs) return [];

		return refs.slice(0, maxRefs);
	}

	/**
	 * Get cross-references for a verse by book ID, chapter, verse.
	 * Resolves the book ID to the TSV key internally.
	 * Returns CrossRef[] for use by the renderer.
	 */
	getForVerse(bookId: number, chapter: number, verse: number, maxRefs: number): CrossRef[] {
		if (!this.loaded) return [];

		const book = findBookById(bookId);
		if (!book) return [];

		const xrefKey = getCrossRefBookKey(book);
		const key = makeVerseKey(xrefKey, chapter, verse);
		const rawRefs = this.index.get(key);
		if (!rawRefs) return [];

		const resolved: CrossRef[] = [];
		for (const raw of rawRefs.slice(0, maxRefs)) {
			const targetBook = findBookByXrefKey(raw.toBook);
			if (!targetBook) continue;

			resolved.push({
				targetBook: targetBook.id,
				targetChapter: raw.toChapter,
				targetVerse: raw.toVerse,
				votes: raw.votes,
			});
		}

		return resolved;
	}

	/**
	 * Check if loaded.
	 */
	isLoaded(): boolean {
		return this.loaded;
	}

	/**
	 * Convert a CrossReference target to a human-readable string.
	 * e.g. "Psalm 96:5"
	 */
	static formatRef(ref: CrossReference): string {
		const book = findBookByXrefKey(ref.toBook);
		const bookName = book ? book.name : ref.toBook;
		return `${bookName} ${ref.toChapter}:${ref.toVerse}`;
	}

	/**
	 * Convert a CrossReference target to a vault wikilink path.
	 * e.g. "bibles/NASB-IL/Psalms/Psalms 96"
	 */
	static formatRefLink(ref: CrossReference, biblePath: string): string {
		const book = findBookByXrefKey(ref.toBook);
		const bookName = book ? book.name : ref.toBook;
		return `${biblePath}/${bookName}/${bookName} ${ref.toChapter}`;
	}
}

/**
 * Parse a cross-ref verse string like "Gen.1.1" or "Matt.11.25" into components.
 */
function parseXrefVerse(s: string): { book: string; chapter: number; verse: number } | null {
	const parts = s.split(".");
	if (parts.length < 3) return null;

	const book = parts[0];
	const chapter = parseInt(parts[1], 10);
	const verse = parseInt(parts[2], 10);

	if (isNaN(chapter) || isNaN(verse)) return null;

	return { book, chapter, verse };
}
