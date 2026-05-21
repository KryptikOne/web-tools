"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./XmlJsonConverter.module.scss";

type Direction = "xml-to-json" | "json-to-xml";

const XML_PLACEHOLDER = `<library>\n  <book id="1">\n    <title>The Pragmatic Programmer</title>\n    <author>Andy Hunt</author>\n  </book>\n  <book id="2">\n    <title>Refactoring</title>\n    <author>Martin Fowler</author>\n  </book>\n</library>`;

const JSON_PLACEHOLDER = `{\n  "library": {\n    "book": [\n      { "@_id": "1", "title": "The Pragmatic Programmer", "author": "Andy Hunt" },\n      { "@_id": "2", "title": "Refactoring", "author": "Martin Fowler" }\n    ]\n  }\n}`;

export default function XmlJsonConverter() {
	const [direction, setDirection] = useState<Direction>("xml-to-json");
	const [input, setInput] = useState("");
	const [attributePrefix, setAttributePrefix] = useState("@_");
	const [alwaysArray, setAlwaysArray] = useState(false);
	const [indent, setIndent] = useState(2);
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) return { output: "", error: null as string | null };

		try {
			if (direction === "xml-to-json") {
				const parser = new XMLParser({
					ignoreAttributes: false,
					attributeNamePrefix: attributePrefix,
					isArray: alwaysArray ? () => true : undefined,
					parseAttributeValue: true,
					trimValues: true,
				});
				const parsed: unknown = parser.parse(input);
				return { output: JSON.stringify(parsed, null, indent), error: null };
			}

			const parsed: unknown = JSON.parse(input);
			const builder = new XMLBuilder({
				ignoreAttributes: false,
				attributeNamePrefix: attributePrefix,
				format: true,
				indentBy: " ".repeat(Math.max(0, indent)),
				suppressEmptyNode: false,
			});
			return { output: builder.build(parsed) as string, error: null };
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Conversion failed",
			};
		}
	}, [input, direction, attributePrefix, alwaysArray, indent]);

	const swapDirection = () => {
		setDirection((d) => (d === "xml-to-json" ? "json-to-xml" : "xml-to-json"));
		setInput(result.output || "");
	};

	const sourceLabel = direction === "xml-to-json" ? "XML" : "JSON";
	const targetLabel = direction === "xml-to-json" ? "JSON" : "XML";
	const placeholder = direction === "xml-to-json" ? XML_PLACEHOLDER : JSON_PLACEHOLDER;

	return (
		<div className={styles.container}>
			{/* Direction toggle */}
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => setDirection("xml-to-json")}
					className={`${styles.tab} ${direction === "xml-to-json" ? styles.activeTab : ""}`}
				>
					XML → JSON
				</button>
				<button
					onClick={() => setDirection("json-to-xml")}
					className={`${styles.tab} ${direction === "json-to-xml" ? styles.activeTab : ""}`}
				>
					JSON → XML
				</button>
			</div>

			{/* Options */}
			<div className={`flex flex-wrap gap-4 items-end mb-6 p-4 ${styles.optionsBar}`}>
				<div className="flex flex-col gap-1">
					<label htmlFor="xml-attr-prefix" className={`text-xs font-medium ${styles.cardSubtitle}`}>
						Attribute prefix
					</label>
					<input
						id="xml-attr-prefix"
						type="text"
						value={attributePrefix}
						onChange={(e) => setAttributePrefix(e.target.value)}
						className={styles.input}
						spellCheck={false}
					/>
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="xml-indent" className={`text-xs font-medium ${styles.cardSubtitle}`}>
						Indent
					</label>
					<input
						id="xml-indent"
						type="number"
						min={0}
						max={8}
						value={indent}
						onChange={(e) => setIndent(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
						className={styles.input}
					/>
				</div>

				{direction === "xml-to-json" && (
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={alwaysArray}
							onChange={(e) => setAlwaysArray(e.target.checked)}
							className={styles.checkbox}
						/>
						Always treat children as arrays
					</label>
				)}

				<button
					type="button"
					onClick={swapDirection}
					className={`ml-auto ${styles.btnSecondary}`}
					title="Swap direction (input becomes output)"
				>
					<ArrowsRightLeftIcon className="w-4 h-4" />
					Swap
				</button>
			</div>

			{/* Input */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{sourceLabel} Input
					</h3>
					<button
						onClick={() => setInput("")}
						className={styles.btnSecondary}
						disabled={!input}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>

				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={placeholder}
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{/* Output */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{targetLabel} Output
					</h3>
					<button
						onClick={() => copy(result.output, "output")}
						className={`${styles.btnPrimary} ${isCopied("output") ? styles.copied : ""}`}
						disabled={!result.output}
					>
						{isCopied("output") ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied!
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="w-4 h-4" />
								Copy
							</>
						)}
					</button>
				</div>

				<textarea
					value={result.output}
					readOnly
					placeholder="Converted output will appear here..."
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About the conversion
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					XML attributes are surfaced in JSON with the configured prefix (default <code>@_</code>) — e.g. <code>&lt;book id=&quot;1&quot;/&gt;</code> becomes <code>{"{ \"@_id\": \"1\" }"}</code>.
					By default, repeated elements become arrays only when seen more than once; enable <em>Always treat children as arrays</em> for predictable JSON shapes.
					When going JSON → XML, the same prefix is used to identify which properties should be emitted as XML attributes.
				</p>
			</div>
		</div>
	);
}
