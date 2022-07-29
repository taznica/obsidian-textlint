import {
	App,
	Editor,
	FileSystemAdapter,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";
import * as path from "path";
import { TextLintEngine as devTextLintEngine } from "textlint";
import { ResultsView, VIEW_TYPE_RESULTS } from "./results-view";
import { TextlintResult } from "@textlint/types";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	resultsView: ResultsView;
	textLintEngine: typeof devTextLintEngine;

	getVaultAbsolutePath = (app: App) => {
		// TODO: app.vault.adapter.getBasePath() -> app.vault.getResourcePath()
		return app.vault.adapter instanceof FileSystemAdapter
			? app.vault.adapter.getBasePath()
			: null;
	};

	getNodeModulesAbsolutePath = (app: App) => {
		const vaultPath = this.getVaultAbsolutePath(app);
		const configDir = app.vault.configDir;
		const nodeModulesDir = "node_modules";

		return typeof vaultPath === "string"
			? path.resolve(vaultPath, configDir, nodeModulesDir)
			: null;
	};

	getTextlintrcAbsolutePath = (app: App) => {
		const vaultPath = this.getVaultAbsolutePath(app);
		const configDir = app.vault.configDir;
		const textlintrcFile = ".textlintrc";

		return typeof vaultPath === "string"
			? path.resolve(vaultPath, configDir, textlintrcFile)
			: null;
	};

	async onload() {
		await this.loadSettings();

		const app = this.app;
		const nodeModulesPath = this.getNodeModulesAbsolutePath(app);
		const textlintrcPath = this.getTextlintrcAbsolutePath(app);

		if (nodeModulesPath !== null) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			this.textLintEngine = require(path.resolve(
				nodeModulesPath,
				"textlint"
			)).TextLintEngine;
		}

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				const activeFile = this.app.workspace.getActiveFile();
				const vaultPath = this.getVaultAbsolutePath(app);
				if (
					activeFile instanceof TFile &&
					typeof nodeModulesPath === "string" &&
					typeof textlintrcPath === "string" &&
					typeof vaultPath === "string"
				) {
					const filePath = path.join(vaultPath, activeFile.path);
					this.lintFile(
						textlintrcPath,
						nodeModulesPath,
						filePath
					).then((results: TextlintResult[]) => {
						this.updateResultsView(results);
					});
				}

				if (!(activeFile instanceof TFile)) {
					console.log("no activeFile");
					new Notice("no activeFile");
				}
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE_RESULTS,
			(leaf) => (this.resultsView = new ResultsView(leaf))
		);

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_RESULTS);
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

	async activateResultsView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_RESULTS);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_RESULTS,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_RESULTS)[0]
		);
	}

	lintFile(
		textlintrcPath: string,
		nodeModulesPath: string,
		filePath: string
	) {
		const options = {
			configFile: textlintrcPath,
			rulesBaseDirectory: nodeModulesPath,
		};

		const engine = new this.textLintEngine(options);
		const filePathList = [filePath];

		return engine
			.executeOnFiles(filePathList)
			.then((results: TextlintResult[]) => {
				console.log(`results: ${engine.formatResults(results)}`);
				return results;
			});
	}

	updateResultsView(results: TextlintResult[]): void {
		this.activateResultsView().then(() => {
			this.app.workspace
				.getLeavesOfType(VIEW_TYPE_RESULTS)
				.forEach((leaf) => {
					if (leaf.view instanceof ResultsView) {
						this.resultsView.updateView(results);
					}
				});
		});
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
