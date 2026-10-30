"use client";

import { useState, useMemo } from "react";
import formatXml from "xml-formatter";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./XmlFormatter.module.scss";

type IndentChoice = "2" | "4" | "tab";

function indentValue(choice: IndentChoice): string {
	if (choice === "tab") return "\t";
	return " ".repeat(Number(choice));
}

function validateWithDomParser(xml: string): string | null {
	if (typeof window === "undefined") return null;
	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(xml, "application/xml");
		const errorNode = doc.querySelector("parsererror");
		if (errorNode) {
			// Strip nested header/source noise — return text content
			return errorNode.textContent?.trim() || "Malformed XML";
		}
		return null;
	} catch (err) {
		return err instanceof Error ? err.message : "Parse error";
	}
}

export default function XmlFormatter() {
	const [input, setInput] = useState("");
	const [indent, setIndent] = useState<IndentChoice>("2");
	const [collapseContent, setCollapseContent] = useState(true);

	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) return { output: "", error: null as string | null };

		const parseError = validateWithDomParser(input);
		if (parseError) {
			return { output: "", error: parseError };
		}

		try {
			const output = formatXml(input, {
				indentation: indentValue(indent),
				collapseContent,
				lineSeparator: "\n",
				throwOnFailure: true,
			});
			return { output, error: null };
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Format error",
			};
		}
	}, [input, indent, collapseContent]);

	return (
		<div className={styles.container}>
			<div className={`flex flex-wrap gap-6 mb-6 p-4 ${styles.optionsBar}`}>
				<label className={`flex items-center gap-2 text-sm ${styles.optionLabel}`}>
					Indent
					<select
						value={indent}
						onChange={(e) => setIndent(e.target.value as IndentChoice)}
						className={styles.select}
						aria-label="Indent size"
					>
						<option value="2">2 spaces</option>
						<option value="4">4 spaces</option>
						<option value="tab">Tab</option>
					</select>
				</label>
				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.optionLabel}`}>
					<input
						type="checkbox"
						checked={collapseContent}
						onChange={(e) => setCollapseContent(e.target.checked)}
						className={styles.checkbox}
					/>
					Keep text on same line when possible
				</label>
			</div>

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>XML input</h3>
					<button
						type="button"
						onClick={() => setInput("")}
						className={styles.btnSecondary}
						disabled={!input}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
				<label htmlFor="xml-input" className="sr-only">XML to format</label>
				<textarea
					id="xml-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder='<root><item id="1">Hello</item></root>'
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					<pre className={styles.errorPre}>{result.error}</pre>
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Formatted XML</h3>
					<button
						type="button"
						onClick={() => copy(result.output, "xml")}
						className={`${styles.btnPrimary} ${isCopied("xml") ? styles.copied : ""}`}
						disabled={!result.output}
					>
						{isCopied("xml") ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="w-4 h-4" />
								Copy
							</>
						)}
					</button>
				</div>
				<label htmlFor="xml-output" className="sr-only">Formatted XML</label>
				<textarea
					id="xml-output"
					value={result.output}
					readOnly
					placeholder="Formatted XML will appear here"
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
			</div>
		</div>
	);
}
