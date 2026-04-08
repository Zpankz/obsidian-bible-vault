/**
 * Interlinear renderer — flexbox-based word-by-word display
 * with Strong's number links and RTL support.
 */

import { MarkdownRenderer, Component } from "obsidian";
import { WordStrongs, isSkippable, getConceptPath } from "../data/strongs";

export interface InterlinearOptions {
	mode: "reading" | "study";
	isHebrew: boolean;
}

export class InterlinearRenderer {
	/**
	 * Render a verse's interlinear display into the target element.
	 */
	renderVerse(
		target: HTMLElement,
		verseNum: number,
		englishText: string,
		wordData: WordStrongs[],
		options: InterlinearOptions,
		component: Component
	): void {
		const verseEl = target.createDiv({ cls: "bil-verse" });

		// English text with verse number
		const textEl = verseEl.createDiv({ cls: "bil-verse-text" });
		const supEl = textEl.createEl("sup", { text: String(verseNum) });
		supEl.addClass("bil-verse-num");
		textEl.appendText(" " + englishText);

		// Interlinear word display
		if (wordData.length > 0) {
			const wordsContainer = verseEl.createDiv({
				cls: [
					"bil-interlinear-words",
					options.mode === "study" ? "bil-expanded" : "bil-collapsed",
				],
			});

			if (options.isHebrew) {
				wordsContainer.setAttr("dir", "rtl");
			}

			for (const wd of wordData) {
				const wordEl = wordsContainer.createDiv({ cls: "bil-word" });
				const skip = isSkippable(wd.strongs, wd.prefix === "G");

				// Original language word
				const origEl = wordEl.createDiv({
					cls: "bil-word-original",
					text: wd.word,
				});
				if (options.isHebrew) {
					origEl.setAttr("dir", "rtl");
				}

				if (skip) {
					origEl.addClass("bil-function-word");
					continue;
				}

				// Strong's number (clickable link to concept note)
				const strongsEl = wordEl.createDiv({ cls: "bil-word-strongs" });
				const conceptPath = getConceptPath(wd.strongs, wd.prefix === "G");
				const strongsLabel = `${wd.prefix}${wd.strongs}`;

				if (conceptPath) {
					const linkEl = strongsEl.createEl("a", {
						cls: "internal-link",
						text: strongsLabel,
						attr: { "data-href": conceptPath },
					});
					linkEl.addEventListener("click", (e) => {
						e.preventDefault();
						(window as any).app?.workspace?.openLinkText(
							conceptPath, "", false
						);
					});
				} else {
					strongsEl.createSpan({ text: strongsLabel, cls: "bil-strongs-plain" });
				}

				// Transliteration
				if (wd.entry) {
					wordEl.createDiv({
						cls: "bil-word-translit",
						text: wd.entry.transliteration,
					});
				}

				// English gloss
				if (wd.entry) {
					wordEl.createDiv({
						cls: "bil-word-gloss",
						text: wd.entry.gloss,
					});
				} else {
					wordEl.createDiv({
						cls: "bil-word-gloss",
						text: "—",
					});
				}

				// Hover tooltip
				if (wd.entry) {
					wordEl.setAttr(
						"title",
						`${strongsLabel}: ${wd.entry.original} (${wd.entry.transliteration}) — ${wd.entry.gloss}`
					);
				}
			}
		}
	}

	/**
	 * Render a pericope (group of verses) with interlinear.
	 */
	renderPericope(
		target: HTMLElement,
		title: string,
		verses: Array<{
			verseNum: number;
			english: string;
			wordData: WordStrongs[];
		}>,
		options: InterlinearOptions,
		component: Component
	): void {
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
}
