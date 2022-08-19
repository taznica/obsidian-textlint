import type { TextlintMessage, TextlintResult } from "@textlint/types";

// ref: https://github.com/textlint/textlint/blob/master/packages/%40textlint/linter-formatter/src/formatters/stylish.ts
const pluralize = (word: string, count: number): string => {
	return count === 1 ? word : word + "s";
};

export const formatAsDetail: (results: TextlintResult[]) => HTMLDivElement = (
	results: TextlintResult[]
) => {
	const resultsContainer = createDiv({ cls: "results-container" });

	results.forEach((result: TextlintResult) => {
		const resultContainer = resultsContainer.createDiv({
			cls: "result-container",
		});
		const messages = result.messages;

		if (messages.length === 0) {
			resultContainer.createDiv({ cls: "detail" }).createSpan({
				cls: "detail-pass",
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

			resultContainer
				.createDiv({ cls: "detail" })
				.createSpan({
					cls: "detail-loc",
					text: `[${message.loc.start.line.toString()}:${message.loc.start.column.toString()}] `,
				})
				.createSpan({
					cls: "detail-severity",
					text: `${severityLabel.toString()} `,
				})
				.createSpan({
					cls: "detail-message",
					text: `${message.message} `,
				})
				.createSpan({
					cls: "detail-ruleId",
					text: `${message.ruleId} \n`,
				});
		});
	});

	return resultsContainer;
};

export const formatAsSummary: (results: TextlintResult[]) => HTMLDivElement = (
	results: TextlintResult[]
) => {
	let total = 0;
	let errors = 0;
	let warnings = 0;
	const container: HTMLDivElement = createDiv({ cls: "summary-container" });

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
