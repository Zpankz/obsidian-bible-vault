/**
 * Cross-reference renderer — collapsible callout with typed wikilinks.
 */

import { MarkdownRenderer, Component, App } from "obsidian";
import { CrossRef } from "../data/crossrefs";
import { BOOKS, findBookById } from "../data/books";

export class CrossRefRenderer {
	constructor(private app: App) {}

	/**
	 * Render cross-references as a collapsible details element.
	 */
	renderCrossRefs(
		target: HTMLElement,
		refs: CrossRef[],
		sourceBook: number,
		component: Component
	): void {
		if (refs.length === 0) return;

		const details = target.createEl("details", { cls: "bil-xrefs" });
		const summary = details.createEl("summary", {
			text: `Cross-references (${refs.length})`,
			cls: "bil-xrefs-summary",
		});

		const list = details.createEl("ul", { cls: "bil-xrefs-list" });

		for (const ref of refs) {
			const targetBook = findBookById(ref.targetBook);
			if (!targetBook) continue;

			const li = list.createEl("li", { cls: "bil-xref-item" });

			// Classify relationship type
			const relType = this.classifyRelationship(sourceBook, ref.targetBook);
			const displayRef = `${targetBook.name} ${ref.targetChapter}:${ref.targetVerse}`;
			const linkPath = `bibles/NASB-IL/${targetBook.name}/${targetBook.name} ${ref.targetChapter}`;

			// Create clickable link
			const linkEl = li.createEl("a", {
				cls: "internal-link",
				text: displayRef,
				attr: { "data-href": linkPath },
			});
			linkEl.addEventListener("click", (e) => {
				e.preventDefault();
				this.app.workspace.openLinkText(linkPath, "", false);
			});

			// Relationship type badge
			li.createSpan({
				text: ` @${relType}`,
				cls: `bil-xref-type bil-xref-${relType}`,
			});

			// Vote count
			li.createSpan({
				text: ` (${ref.votes})`,
				cls: "bil-xref-votes",
			});
		}
	}

	private classifyRelationship(fromBook: number, toBook: number): string {
		if (fromBook <= 39 && toBook >= 40) return "fulfills";
		if (fromBook >= 40 && toBook <= 39) return "quotes";
		if (fromBook === toBook) return "parallels";
		if (Math.abs(fromBook - toBook) <= 2) return "parallels";
		return "alludes_to";
	}
}
