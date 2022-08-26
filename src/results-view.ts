import { ItemView, WorkspaceLeaf } from "obsidian";
import { TextlintResult } from "@textlint/types";
import { formatAsDetail } from "./format";

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
		container.appendChild(formatAsDetail(results));

		const resultElements = container.findAll(".result");
		resultElements.forEach((result: HTMLElement) => {
			result.addEventListener("click", (event: MouseEvent) => {
				resultElements.forEach((_result: HTMLElement) => {
					_result.toggleClass("result-selected", false);
				});

				const target = event.currentTarget as HTMLElement;
				target.toggleClass("result-selected", true);
			});
		});
	}
}
