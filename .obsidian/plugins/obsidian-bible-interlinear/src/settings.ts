/**
 * Plugin settings and settings tab.
 */

import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export interface BibleInterlinearSettings {
	defaultTranslation: string;
	originalLanguageDisplay: boolean;
	interlinearMode: "reading" | "study";
	crossrefVoteThreshold: number;
	bibleFilesPath: string;
	conceptsPath: string;
	maxCrossrefsPerVerse: number;
	detectReferencesInText: boolean;
}

export const DEFAULT_SETTINGS: BibleInterlinearSettings = {
	defaultTranslation: "NASB",
	originalLanguageDisplay: true,
	interlinearMode: "study",
	crossrefVoteThreshold: 10,
	bibleFilesPath: "bibles/NASB-IL",
	conceptsPath: "concepts",
	maxCrossrefsPerVerse: 5,
	detectReferencesInText: true,
};

export class BibleInterlinearSettingTab extends PluginSettingTab {
	plugin: Plugin;
	settings: BibleInterlinearSettings;
	saveCallback: () => Promise<void>;

	constructor(
		app: App,
		plugin: Plugin,
		settings: BibleInterlinearSettings,
		saveCallback: () => Promise<void>
	) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = settings;
		this.saveCallback = saveCallback;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Bible Interlinear Settings" });

		new Setting(containerEl)
			.setName("Default translation")
			.setDesc("Translation used for verse text (e.g., NASB, KJV, WEBP)")
			.addText((text) =>
				text
					.setPlaceholder("NASB")
					.setValue(this.settings.defaultTranslation)
					.onChange(async (value) => {
						this.settings.defaultTranslation = value;
						await this.saveCallback();
					})
			);

		new Setting(containerEl)
			.setName("Show original language")
			.setDesc("Display Hebrew/Greek interlinear text alongside English")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.originalLanguageDisplay)
					.onChange(async (value) => {
						this.settings.originalLanguageDisplay = value;
						await this.saveCallback();
					})
			);

		new Setting(containerEl)
			.setName("Interlinear mode")
			.setDesc(
				"Reading: original + gloss only. Study: all annotation layers."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("reading", "Reading")
					.addOption("study", "Study")
					.setValue(this.settings.interlinearMode)
					.onChange(async (value) => {
						this.settings.interlinearMode = value as
							| "reading"
							| "study";
						await this.saveCallback();
					})
			);

		new Setting(containerEl)
			.setName("Cross-reference vote threshold")
			.setDesc(
				"Minimum community votes for a cross-reference to be shown (1-100)"
			)
			.addSlider((slider) =>
				slider
					.setLimits(1, 100, 1)
					.setValue(this.settings.crossrefVoteThreshold)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.settings.crossrefVoteThreshold = value;
						await this.saveCallback();
					})
			);

		new Setting(containerEl)
			.setName("Max cross-refs per verse")
			.setDesc("Maximum cross-references shown per verse (1-20)")
			.addSlider((slider) =>
				slider
					.setLimits(1, 20, 1)
					.setValue(this.settings.maxCrossrefsPerVerse)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.settings.maxCrossrefsPerVerse = value;
						await this.saveCallback();
					})
			);

		new Setting(containerEl)
			.setName("Bible files path")
			.setDesc("Vault path to the NASB-IL Bible files")
			.addText((text) =>
				text
					.setPlaceholder("bibles/NASB-IL")
					.setValue(this.settings.bibleFilesPath)
					.onChange(async (value) => {
						this.settings.bibleFilesPath = value;
						await this.saveCallback();
					})
			);

		new Setting(containerEl)
			.setName("Concepts path")
			.setDesc("Vault path to concept notes")
			.addText((text) =>
				text
					.setPlaceholder("concepts")
					.setValue(this.settings.conceptsPath)
					.onChange(async (value) => {
						this.settings.conceptsPath = value;
						await this.saveCallback();
					})
			);

		new Setting(containerEl)
			.setName("Detect references in text")
			.setDesc(
				"Auto-detect Bible references (Gen 1:1, John 3:16) in notes and make them clickable"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.detectReferencesInText)
					.onChange(async (value) => {
						this.settings.detectReferencesInText = value;
						await this.saveCallback();
					})
			);
	}
}
