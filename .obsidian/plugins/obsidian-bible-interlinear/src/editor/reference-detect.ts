/**
 * MarkdownPostProcessor that detects Bible references in rendered text
 * and wraps them in clickable internal links.
 */

import { MarkdownPostProcessorContext } from "obsidian";
import { BOOKS, getBookByAlias, BookInfo } from "../data/books";

/** Build a regex that matches Bible references in text */
function buildReferenceRegex(): RegExp {
	const bookNames: string[] = [];
	for (const book of BOOKS) {
		bookNames.push(book.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
		for (const alias of book.aliases) {
			bookNames.push(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
		}
	}
	bookNames.sort((a, b) => b.length - a.length);

	const pattern = `(?:^|[\\s(\\[])` +
		`(${bookNames.join("|")})` +
		`\\.?\\s*` +
		`(\\d{1,3})` +
		`(?:\\s*[:.]\\s*(\\d{1,3})` +
		`(?:\\s*[-\u2013]\\s*(\\d{1,3}))?)?` +
		`(?=[\\s,;.)\\]]|$)`;

	return new RegExp(pattern, "gi");
}

let cachedRegex: RegExp | null = null;

function getReferenceRegex(): RegExp {
	if (!cachedRegex) {
		cachedRegex = buildReferenceRegex();
	}
	cachedRegex.lastIndex = 0;
	return cachedRegex;
}

export function detectReferences(
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
): void {
	if (el.querySelector("code, pre, .frontmatter")) return;

	const textNodes: Text[] = [];
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

	let node: Text | null;
	while ((node = walker.nextNode() as Text | null)) {
		const parent = node.parentElement;
		if (
			parent &&
			(parent.tagName === "A" ||
				parent.tagName === "CODE" ||
				parent.tagName === "PRE" ||
				parent.classList.contains("internal-link") ||
				parent.closest("a, code, pre"))
		) {
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

		const matches: Array<{
			fullMatch: string;
			index: number;
			book: BookInfo;
			chapter: number;
			verse?: number;
			endVerse?: number;
		}> = [];

		let m: RegExpExecArray | null;
		while ((m = regex.exec(text)) !== null) {
			const book = getBookByAlias(m[1]);
			if (!book) continue;

			const chapter = parseInt(m[2], 10);
			if (chapter < 1 || chapter > book.chapters) continue;

			const verse = m[3] ? parseInt(m[3], 10) : undefined;
			const endVerse = m[4] ? parseInt(m[4], 10) : undefined;

			matches.push({
				fullMatch: m[0],
				index: m.index,
				book,
				chapter,
				verse,
				endVerse,
			});
		}

		if (matches.length === 0) continue;

		const frag = document.createDocumentFragment();
		let lastIdx = 0;

		for (const { fullMatch, index: startIdx, book, chapter, verse, endVerse } of matches) {
			const beforeText = text.slice(lastIdx, startIdx);
			if (beforeText) {
				frag.appendChild(document.createTextNode(beforeText));
			}

			const matchText = fullMatch.trimStart();
			const linkPath = `bibles/NASB-IL/${book.name}/${book.name} ${chapter}`;
			const displayText = verse
				? `${book.name} ${chapter}:${verse}${endVerse ? `-${endVerse}` : ""}`
				: `${book.name} ${chapter}`;

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
