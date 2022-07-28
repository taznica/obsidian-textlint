import { ItemView, WorkspaceLeaf } from "obsidian";
import { TextlintResult, TextlintRuleSeverityLevel } from "@textlint/types";

export const VIEW_TYPE_RESULTS = "results-view";

export class ResultsView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_RESULTS;
	}

	getDisplayText(): string {
		return "TextLint results view";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
	}

	async onClose() {}

	async updateView(results: TextlintResult[]) {
		const container = this.containerEl.children[1];
		container.empty();
		for (const result of results) {
			for (const message of result.messages) {
				const text = `${this.getSeverityText(message.severity)} [${
					message.loc.start.line
				}:${message.loc.start.column}]: ${message.message} (${
					message.ruleId
				})`;
				container.createEl("div", {
					text: text,
				});
			}
		}
	}

	getSeverityText(severity: TextlintRuleSeverityLevel): string {
		switch (severity) {
			case 0:
				return "info";
			case 1:
				return "warning";
			case 2:
				return "error";
		}
	}
}
