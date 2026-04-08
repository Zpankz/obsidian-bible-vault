/**
 * EditorSuggest for Bible reference insertion.
 * Triggered by typing "-- " at the start of a line.
 */

import {
	Editor,
	EditorPosition,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import { getBookByAlias, BookInfo } from "../data/books";
import { BibleCache } from "../data/cache";

interface BibleSuggestion {
	book: BookInfo;
	chapter: number;
	startVerse?: number;
	endVerse?: number;
	displayText: string;
	previewText: string;
}

// Using a simplified inline implementation since EditorSuggest
// requires the full Obsidian type. This will be registered from main.ts.
export function parseTriggerLine(
	line: string
): { book: BookInfo; chapter: number; startVerse?: number; endVerse?: number } | null {
	// Must start with "-- "
	if (!line.startsWith("-- ")) return null;

	const ref = line.slice(3).trim();
	if (ref.length < 2) return null;

	// Parse: BookName Chapter:Verse-EndVerse
	const m = ref.match(
		/^([A-Za-z0-9 ]+?)\s*(\d{1,3})(?:\s*[:.]?\s*(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?)?$/
	);
	if (!m) return null;

	const bookName = m[1].trim();
	const book = getBookByAlias(bookName);
	if (!book) return null;

	const chapter = parseInt(m[2], 10);
	if (chapter < 1 || chapter > book.chapters) return null;

	const startVerse = m[3] ? parseInt(m[3], 10) : undefined;
	const endVerse = m[4] ? parseInt(m[4], 10) : undefined;

	return { book, chapter, startVerse, endVerse };
}

/**
 * Format verses into a callout block for insertion.
 */
export function formatPassageCallout(
	bookName: string,
	chapter: number,
	verses: string[],
	startVerse?: number,
	endVerse?: number
): string {
	const refLabel = startVerse
		? `${bookName} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ""}`
		: `${bookName} ${chapter}`;

	const linkPath = `bibles/NASB-IL/${bookName}/${bookName} ${chapter}`;

	let body = "";
	if (startVerse && endVerse) {
		for (let v = startVerse; v <= Math.min(endVerse, verses.length); v++) {
			body += `> <sup>${v}</sup> ${verses[v - 1]}\n`;
		}
	} else if (startVerse) {
		if (startVerse <= verses.length) {
			body = `> <sup>${startVerse}</sup> ${verses[startVerse - 1]}\n`;
		}
	} else {
		for (let v = 1; v <= verses.length; v++) {
			body += `> <sup>${v}</sup> ${verses[v - 1]} `;
		}
		body = `> ${body.trim()}\n`;
	}

	return `> [!quote]+ [[${linkPath}|${refLabel}]]\n${body}`;
}
