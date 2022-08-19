import { App, FileSystemAdapter, Notice, Plugin, TFile } from "obsidian";
import * as path from "path";
import { TextLintEngine as devTextLintEngine } from "textlint";
import { ResultsView, VIEW_TYPE_RESULTS } from "./results-view";
import { TextlintResult } from "@textlint/types";
import { formatAsSummary } from "./format";

export default class TextlintPlugin extends Plugin {
	resultsView: ResultsView;
	textLintEngine: typeof devTextLintEngine;

	onload = async () => {
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

		const resultsBarItem = this.addStatusBarItem();
		this.updateResultsBarItem(resultsBarItem, []);

		this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			const activeFile = this.app.workspace.getActiveFile();
			const vaultPath = this.getVaultAbsolutePath(app);
			if (
				activeFile instanceof TFile &&
				typeof nodeModulesPath === "string" &&
				typeof textlintrcPath === "string" &&
				typeof vaultPath === "string"
			) {
				const filePath = path.join(vaultPath, activeFile.path);
				this.lintFile(textlintrcPath, nodeModulesPath, filePath).then(
					(results: TextlintResult[]) => {
						this.updateResultsView(results);
						this.updateResultsBarItem(resultsBarItem, results);
					}
				);
			}

			if (!(activeFile instanceof TFile)) {
				console.log("no activeFile");
				new Notice("no activeFile");
			}
		});

		this.registerView(
			VIEW_TYPE_RESULTS,
			(leaf) => (this.resultsView = new ResultsView(leaf))
		);
	};

	onunload = (): void => {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_RESULTS);
	};

	getVaultAbsolutePath = (app: App): string | null => {
		// TODO: app.vault.adapter.getBasePath() -> app.vault.getResourcePath()
		return app.vault.adapter instanceof FileSystemAdapter
			? app.vault.adapter.getBasePath()
			: null;
	};

	getNodeModulesAbsolutePath = (app: App): string | null => {
		const vaultPath = this.getVaultAbsolutePath(app);
		const configDir = app.vault.configDir;
		const nodeModulesDir = "node_modules";

		return typeof vaultPath === "string"
			? path.resolve(vaultPath, configDir, nodeModulesDir)
			: null;
	};

	getTextlintrcAbsolutePath = (app: App): string | null => {
		const vaultPath = this.getVaultAbsolutePath(app);
		const configDir = app.vault.configDir;
		const textlintrcFile = ".textlintrc";

		return typeof vaultPath === "string"
			? path.resolve(vaultPath, configDir, textlintrcFile)
			: null;
	};

	lintFile = (
		textlintrcPath: string,
		nodeModulesPath: string,
		filePath: string
	): Promise<TextlintResult[]> => {
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
	};

	activateResultsView = async (): Promise<void> => {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_RESULTS);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_RESULTS,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_RESULTS)[0]
		);
	};

	updateResultsView = (results: TextlintResult[]): void => {
		this.activateResultsView().then(() => {
			this.app.workspace
				.getLeavesOfType(VIEW_TYPE_RESULTS)
				.forEach((leaf) => {
					if (leaf.view instanceof ResultsView) {
						this.resultsView.updateView(results);
					}
				});
		});
	};

	updateResultsBarItem = (
		resultsBarItem: HTMLElement,
		results: TextlintResult[]
	): void => {
		resultsBarItem.empty();
		resultsBarItem.appendChild(formatAsSummary(results));
	};
}
