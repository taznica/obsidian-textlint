import type { TextlintMessage, TextlintResult } from "@textlint/types";

// ref: https://github.com/textlint/textlint/blob/master/packages/%40textlint/linter-formatter/src/formatters/stylish.ts
const pluralize = (word: string, count: number): string => {
	return count === 1 ? word : word + "s";
};

export const formatAsDetail = (results: TextlintResult[]): HTMLDivElement => {
	const resultsContainer = createDiv({ cls: "textlint-results-container" });

	results.forEach((result: TextlintResult) => {
		const resultContainer = resultsContainer.createDiv({
			cls: "result-container",
		});
		const messages = result.messages;

		if (messages.length === 0) {
			resultContainer.createDiv({ cls: "result" }).createSpan({
				cls: "result-message",
				text: "All passed.",
			});
			return;
		}

		messages.forEach((message: TextlintMessage) => {
			let severityLabel = "";
			switch (message.severity) {
				case 0:
					severityLabel = "info";
					break;
				case 1:
					severityLabel = "warning";
					break;
				case 2:
					severityLabel = "error";
					break;
			}

			const result = resultContainer.createDiv({ cls: "result" });

			const resultPrimary = result.createDiv({
				cls: "result-primary",
			});
			resultPrimary.createSpan({
				cls: "result-severity",
				text: `${severityLabel.toString()} `,
			});
			resultPrimary.createSpan({
				cls: "result-message",
				text: `${message.message}`,
			});

			const resultSecondary = result.createDiv({
				cls: "result-secondary",
			});
			resultSecondary.createSpan({
				cls: "result-ruleId",
				text: `(${message.ruleId})`,
			});
			resultSecondary.createSpan({
				cls: "result-loc",
				text: `[${message.loc.start.line.toString()}:${message.loc.start.column.toString()}] `,
			});
		});
	});

	return resultsContainer;
};

export const formatAsSummary = (results: TextlintResult[]): HTMLDivElement => {
	let total = 0;
	let errors = 0;
	let warnings = 0;
	const container: HTMLDivElement = createDiv({
		cls: "textlint-summary-container",
	});

	results.forEach((result: TextlintResult) => {
		const messages = result.messages;

		total += messages.length;

		messages.forEach((message: TextlintMessage) => {
			switch (message.severity) {
				case 0:
					break;
				case 1:
					warnings++;
					break;
				case 2:
					errors++;
					break;
			}
		});
	});

	container.createSpan({
		cls: "summary",
		text: `textlint: ${total} ${pluralize(
			"problem",
			total
		)} (${errors} ${pluralize("error", errors)}, ${warnings} ${pluralize(
			"warning",
			warnings
		)})`,
	});

	return container;
};
