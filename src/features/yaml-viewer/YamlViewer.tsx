"use client";

import { useState, useMemo } from "react";
import yaml, { YAMLException } from "js-yaml";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./YamlViewer.module.scss";

type IndentChoice = 2 | 4;

export default function YamlViewer() {
	const [input, setInput] = useState("");
	const [indent, setIndent] = useState<IndentChoice>(2);
	const [sortKeys, setSortKeys] = useState(false);
	const [outputMode, setOutputMode] = useState<"yaml" | "json">("yaml");

	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) return { output: "", error: null as string | null };
		try {
			const loaded = yaml.load(input);
			let output: string;
			if (outputMode === "json") {
				output = JSON.stringify(loaded, null, indent);
			} else {
				output = yaml.dump(loaded, {
					indent,
					sortKeys,
					lineWidth: -1,
					noRefs: true,
				});
			}
			return { output, error: null };
		} catch (err) {
			if (err instanceof YAMLException) {
				const mark = err.mark;
				const loc = mark ? ` (line ${mark.line + 1}, column ${mark.column + 1})` : "";
				return { output: "", error: `${err.reason || err.message}${loc}` };
			}
			return {
				output: "",
				error: err instanceof Error ? err.message : "Parse error",
			};
		}
	}, [input, indent, sortKeys, outputMode]);

	return (
		<div className={styles.container}>
			<div className={`flex flex-wrap gap-6 mb-6 p-4 ${styles.optionsBar}`}>
				<label className={`flex items-center gap-2 text-sm ${styles.optionLabel}`}>
					Output
					<select
						value={outputMode}
						onChange={(e) => setOutputMode(e.target.value as "yaml" | "json")}
						className={styles.select}
						aria-label="Output format"
					>
						<option value="yaml">Normalized YAML</option>
						<option value="json">JSON</option>
					</select>
				</label>

				<label className={`flex items-center gap-2 text-sm ${styles.optionLabel}`}>
					Indent
					<select
						value={indent}
						onChange={(e) => setIndent(Number(e.target.value) as IndentChoice)}
						className={styles.select}
						aria-label="Indent width"
					>
						<option value={2}>2 spaces</option>
						<option value={4}>4 spaces</option>
					</select>
				</label>

				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.optionLabel}`}>
					<input
						type="checkbox"
						checked={sortKeys}
						onChange={(e) => setSortKeys(e.target.checked)}
						className={styles.checkbox}
					/>
					Sort keys
				</label>
			</div>

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>YAML input</h3>
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
				<label htmlFor="yaml-input" className="sr-only">YAML input</label>
				<textarea
					id="yaml-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={"name: my-app\nversion: 1.0.0\n"}
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{outputMode === "yaml" ? "Normalized YAML" : "JSON output"}
					</h3>
					<button
						type="button"
						onClick={() => copy(result.output, "yaml")}
						className={`${styles.btnPrimary} ${isCopied("yaml") ? styles.copied : ""}`}
						disabled={!result.output}
					>
						{isCopied("yaml") ? (
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
				<label htmlFor="yaml-output" className="sr-only">Normalized output</label>
				<textarea
					id="yaml-output"
					value={result.output}
					readOnly
					placeholder="Normalized output will appear here"
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
			</div>
		</div>
	);
}
