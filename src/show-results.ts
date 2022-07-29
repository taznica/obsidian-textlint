import type { TextlintResult } from "@textlint/types";

type outputType = "detail" | "summary";

// ref: https://github.com/textlint/textlint/blob/master/packages/%40textlint/linter-formatter/src/formatters/stylish.ts
function pluralize(word: string, count: number): string {
	return count === 1 ? word : word + "s";
}

export function showResults(
	outputType: outputType,
	results: TextlintResult[],
	node: Element
) {
	let total = 0;
	let errors = 0;
	let warnings = 0;

	results.forEach(function (result) {
		const messages = result.messages;

		if (messages.length === 0 && outputType === "detail") {
			node.createDiv({ cls: "detail" }).createSpan({
				cls: "detail-pass",
				text: "All passed.",
			});
			return;
		}

		total += messages.length;

		messages.forEach(function (message) {
			let severityLabel = "";
			switch (message.severity) {
				case 0:
					severityLabel = "info";
					break;
				case 1:
					severityLabel = "warning";
					warnings++;
					break;
				case 2:
					severityLabel = "error";
					errors++;
					break;
			}

			if (outputType === "detail") {
				const detail = node.createDiv({ cls: "detail" });
				detail.createSpan({
					cls: "detail-loc",
					text: `[${message.loc.start.line.toString()}:${message.loc.start.column.toString()}] `,
				});
				detail.createSpan({
					cls: "detail-severity",
					text: `${severityLabel.toString()} `,
				});
				detail.createSpan({
					cls: "detail-message",
					text: `${message.message} `,
				});
				detail.createSpan({
					cls: "detail-ruleId",
					text: `${message.ruleId} \n`,
				});
			}
		});
	});

	if (outputType === "summary") {
		const summary = node.createDiv({ cls: "summary" });
		summary.createSpan({
			cls: "summary-content",
			text: `${total} ${pluralize(
				"problem",
				total
			)} (${errors} ${pluralize(
				"error",
				errors
			)}, ${warnings} ${pluralize("warning", warnings)})`,
		});
	}
}
