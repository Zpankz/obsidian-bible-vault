/**
 * obsidian-bible-interlinear — Monolithic Bible study plugin
 *
 * Combines interlinear rendering (from ling-gloss pattern),
 * verse injection (from My Bible cache), and reference detection
 * (from local-bible-ref pattern) into a single SOTA plugin.
 */

import {
	Plugin,
	MarkdownRenderer,
	Notice,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";

import { BibleCache } from "./data/cache";
import { CrossRefIndex } from "./data/crossrefs";
import { parseStrongsText, getConceptPath, isSkippable } from "./data/strongs";
import { getBookByAlias, getBookById, BOOKS, BookInfo } from "./data/books";
import { InterlinearRenderer } from "./render/interlinear";
import { CrossRefRenderer } from "./render/crossrefs";
import { detectReferences } from "./editor/reference-detect";
import { parseTriggerLine, formatPassageCallout } from "./editor/suggest";
import {
	BibleInterlinearSettings,
	DEFAULT_SETTINGS,
	BibleInterlinearSettingTab,
} from "./settings";

export default class BibleInterlinearPlugin extends Plugin {
	settings: BibleInterlinearSettings = DEFAULT_SETTINGS;
	cache!: BibleCache;
	crossrefs!: CrossRefIndex;
	interlinearRenderer!: InterlinearRenderer;
	crossrefRenderer!: CrossRefRenderer;

	async onload() {
		await this.loadSettings();

		this.cache = new BibleCache(this.app);
		this.crossrefs = new CrossRefIndex(
			this.app,
			this.settings.crossrefVoteThreshold
		);
		this.interlinearRenderer = new InterlinearRenderer();
		this.crossrefRenderer = new CrossRefRenderer(this.app);

		// Load cross-references in background
		this.crossrefs.load().catch((e) => {
			console.warn("Bible Interlinear: Failed to load cross-references", e);
		});

		// ── Code Block Processors ──

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

		// Backward compatibility with ling-gloss
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

		// ── Markdown Post Processor (inline reference detection) ──

		this.registerMarkdownPostProcessor((el, ctx) => {
			if (this.settings.detectReferencesInText) {
				detectReferences(el, ctx);
			}
		});

		// ── EditorSuggest for "-- " trigger ──

		this.registerEditorSuggest(new BibleReferenceSuggest(this));

		// ── Commands ──

		this.addCommand({
			id: "switch-translation",
			name: "Switch Bible translation",
			callback: () => {
				new Notice(
					"Translation switching: use plugin settings to change default translation"
				);
			},
		});

		this.addCommand({
			id: "clear-cache",
			name: "Clear verse cache",
			callback: () => {
				this.cache.clearCache();
				new Notice("Bible verse cache cleared.");
			},
		});

		this.addCommand({
			id: "reload-crossrefs",
			name: "Reload cross-references",
			callback: async () => {
				await this.crossrefs.load();
				new Notice("Cross-references reloaded.");
			},
		});

		// ── Settings Tab ──

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
	async processInterlinearBlock(source: string, el: HTMLElement): Promise<void> {
		const config = this.parseBlockConfig(source);
		if (!config.ref) {
			el.createDiv({
				cls: "bil-error",
				text: "Missing ref: parameter (e.g., ref: Gen 1:1-5)",
			});
			return;
		}

		const parsed = this.parseReference(config.ref);
		if (!parsed) {
			el.createDiv({
				cls: "bil-error",
				text: `Invalid reference: ${config.ref}`,
			});
			return;
		}

		const { book, chapter, startVerse, endVerse } = parsed;
		const translation = config.translation || this.settings.defaultTranslation;
		const origVersion = book.testament === "NT" ? "TISCH" : "WLCa";
		const isHebrew = book.testament === "OT";
		const mode = (config.mode as "reading" | "study") || this.settings.interlinearMode;

		// Fetch verse data
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
				text: `No verses found for ${book.name} ${chapter} in ${translation}`,
			});
			return;
		}

		const start = startVerse || 1;
		const end = endVerse || (startVerse || englishVerses.length);

		const container = el.createDiv({ cls: "bil-container" });

		// Title
		const refLabel = startVerse
			? `${book.name} ${chapter}:${start}${end !== start ? `-${end}` : ""}`
			: `${book.name} ${chapter}`;
		container.createEl("h3", { text: refLabel, cls: "bil-title" });

		// Render each verse
		for (let v = start; v <= Math.min(end, englishVerses.length); v++) {
			const english = englishVerses[v - 1] || "";
			const origText = origVerses && origVerses[v - 1] ? origVerses[v - 1] : "";
			const wordData = origText
				? parseStrongsText(origText, !isHebrew)
				: [];

			this.interlinearRenderer.renderVerse(
				container,
				v,
				english,
				wordData,
				{ mode, isHebrew },
				this
			);

			// Cross-references for this verse
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
	async processVerseBlock(source: string, el: HTMLElement): Promise<void> {
		const config = this.parseBlockConfig(source);
		const ref = config.ref || source.trim().split("\n")[0];

		const parsed = this.parseReference(ref);
		if (!parsed) {
			// Try legacy format: "book_id chapter:verse"
			const legacyParsed = this.parseLegacyReference(ref);
			if (legacyParsed) {
				const { bookId, chapter, verse } = legacyParsed;
				const translation = config.translation || this.settings.defaultTranslation;
				const verses = await this.cache.getChapter(translation, bookId, chapter);
				if (verses && verse && verse <= verses.length) {
					const text = `<sup>${verse}</sup> ${verses[verse - 1]}`;
					await MarkdownRenderer.render(this.app, text, el, "", this);
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
				text: `No text found for ${book.name} ${chapter}`,
			});
			return;
		}

		let md = "";
		const start = startVerse || 1;
		const end = endVerse || (startVerse || verses.length);

		for (let v = start; v <= Math.min(end, verses.length); v++) {
			md += `<sup>${v}</sup> ${verses[v - 1]} `;
		}

		await MarkdownRenderer.render(this.app, md.trim(), el, "", this);
	}

	private parseBlockConfig(
		source: string
	): Record<string, string> {
		const config: Record<string, string> = {};
		for (const line of source.split("\n")) {
			const m = line.match(/^\s*(\w+)\s*:\s*(.+?)\s*$/);
			if (m) {
				config[m[1].toLowerCase()] = m[2];
			}
		}
		return config;
	}

	private parseReference(
		ref: string
	): { book: any; chapter: number; startVerse?: number; endVerse?: number } | null {
		const m = ref.match(
			/^([A-Za-z0-9 ]+?)\s*(\d{1,3})(?:\s*[:.]?\s*(\d{1,3})(?:\s*[-\u2013]\s*(\d{1,3}))?)?$/
		);
		if (!m) return null;

		const book = getBookByAlias(m[1].trim());
		if (!book) return null;

		const chapter = parseInt(m[2], 10);
		if (chapter < 1 || chapter > book.chapters) return null;

		const startVerse = m[3] ? parseInt(m[3], 10) : undefined;
		const endVerse = m[4] ? parseInt(m[4], 10) : undefined;

		return { book, chapter, startVerse, endVerse };
	}

	private parseLegacyReference(
		ref: string
	): { bookId: number; chapter: number; verse?: number } | null {
		const parts = ref.trim().replace(/[:-]/g, " ").split(/\s+/);
		if (parts.length < 2) return null;

		const bookId = parseInt(parts[0], 10);
		if (isNaN(bookId) || bookId < 1 || bookId > 66) return null;

		const chapter = parseInt(parts[1], 10);
		if (isNaN(chapter)) return null;

		const verse = parts[2] ? parseInt(parts[2], 10) : undefined;
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
	async processGlossBlock(source: string, el: HTMLElement): Promise<void> {
		const container = el.createDiv({ cls: "ling-gloss" });
		const body = container.createDiv({ cls: "ling-gloss-body" });

		const lines = source.split("\n");
		const glossLines: string[][] = [];
		let currentLevel = -1;
		let exNumber = "";
		let ftText = "";
		let srcText = "";

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.length === 0) continue;

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
				// continuation line for current level
				if (!glossLines[currentLevel]) {
					glossLines[currentLevel] = [];
				}
				glossLines[currentLevel].push(...trimmed.split(/\s+/));
			}
		}

		// Example number
		if (exNumber) {
			container.createDiv({ cls: "ling-gloss-number", text: exNumber });
		}

		// Build aligned word columns
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

		// Free translation
		if (ftText) {
			body.createDiv({ cls: "ling-gloss-translation", text: ftText });
		}

		// Source
		if (srcText) {
			body.createDiv({ cls: "ling-gloss-source", text: srcText });
		}
	}
}

/**
 * EditorSuggest for Bible reference insertion.
 * Triggered by "-- " prefix at the start of a line.
 */
class BibleReferenceSuggest extends EditorSuggest<{
	book: BookInfo;
	chapter: number;
	startVerse?: number;
	endVerse?: number;
	displayText: string;
}> {
	plugin: BibleInterlinearPlugin;

	constructor(plugin: BibleInterlinearPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile | null
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		if (!line.startsWith("-- ")) return null;

		const parsed = parseTriggerLine(line);
		if (!parsed) return null;

		return {
			start: { line: cursor.line, ch: 0 },
			end: { line: cursor.line, ch: line.length },
			query: line.slice(3).trim(),
		};
	}

	async getSuggestions(
		context: EditorSuggestContext
	): Promise<
		Array<{
			book: BookInfo;
			chapter: number;
			startVerse?: number;
			endVerse?: number;
			displayText: string;
		}>
	> {
		const parsed = parseTriggerLine("-- " + context.query);
		if (!parsed) return [];

		const { book, chapter, startVerse, endVerse } = parsed;
		const refLabel = startVerse
			? `${book.name} ${chapter}:${startVerse}${endVerse ? `-${endVerse}` : ""}`
			: `${book.name} ${chapter}`;

		return [
			{
				book,
				chapter,
				startVerse,
				endVerse,
				displayText: `Insert ${refLabel}`,
			},
		];
	}

	renderSuggestion(
		value: {
			book: BookInfo;
			chapter: number;
			startVerse?: number;
			endVerse?: number;
			displayText: string;
		},
		el: HTMLElement
	): void {
		el.createDiv({ text: value.displayText });
		el.createDiv({
			cls: "bil-suggest-hint",
			text: `${value.book.name} (${value.book.originalName})`,
		});
	}

	async selectSuggestion(
		value: {
			book: BookInfo;
			chapter: number;
			startVerse?: number;
			endVerse?: number;
			displayText: string;
		},
		evt: MouseEvent | KeyboardEvent
	): Promise<void> {
		const { book, chapter, startVerse, endVerse } = value;
		const translation = this.plugin.settings.defaultTranslation;
		const verses = await this.plugin.cache.getChapter(
			translation,
			book.id,
			chapter
		);

		if (!verses) {
			new Notice(`No verses found for ${book.name} ${chapter}`);
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
}
