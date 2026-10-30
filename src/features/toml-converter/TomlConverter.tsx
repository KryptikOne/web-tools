"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import yaml from "js-yaml";
import { parse as tomlParse, stringify as tomlStringify } from "smol-toml";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./TomlConverter.module.scss";

type Format = "json" | "yaml" | "toml";

const FORMATS: { value: Format; label: string }[] = [
	{ value: "json", label: "JSON" },
	{ value: "yaml", label: "YAML" },
	{ value: "toml", label: "TOML" },
];

const PLACEHOLDERS: Record<Format, string> = {
	json: `{\n  "name": "bittbott",\n  "tools": ["json", "yaml", "toml"]\n}`,
	yaml: `name: bittbott\ntools:\n  - json\n  - yaml\n  - toml`,
	toml: `name = "bittbott"\ntools = ["json", "yaml", "toml"]`,
};

function parseInput(text: string, format: Format): unknown {
	switch (format) {
		case "json":
			return JSON.parse(text);
		case "yaml":
			return yaml.load(text);
		case "toml":
			return tomlParse(text);
	}
}

function stringifyOutput(data: unknown, format: Format): string {
	switch (format) {
		case "json":
			return JSON.stringify(data, null, 2);
		case "yaml":
			return yaml.dump(data, { indent: 2, lineWidth: -1 });
		case "toml": {
			if (data === null || typeof data !== "object" || Array.isArray(data)) {
				throw new Error("TOML output requires a top-level object (table).");
			}
			return tomlStringify(data as Record<string, unknown>);
		}
	}
}

export default function TomlConverter() {
	const [source, setSource] = useState<Format>("json");
	const [target, setTarget] = useState<Format>("toml");
	const [input, setInput] = useState("");
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) return { output: "", error: null as string | null };
		try {
			const parsed = parseInput(input, source);
			if (source === target) {
				return { output: stringifyOutput(parsed, target), error: null };
			}
			return { output: stringifyOutput(parsed, target), error: null };
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Conversion failed",
			};
		}
	}, [input, source, target]);

	const swapDirection = () => {
		setSource(target);
		setTarget(source);
		setInput(result.output || "");
	};

	return (
		<div className={styles.container}>
			{/* Format selectors */}
			<div className={`flex flex-wrap items-end gap-4 mb-6 p-4 ${styles.optionsBar}`}>
				<div className="flex flex-col gap-1">
					<label htmlFor="toml-source-format" className={`text-xs font-medium ${styles.cardSubtitle}`}>
						Source format
					</label>
					<select
						id="toml-source-format"
						value={source}
						onChange={(e) => setSource(e.target.value as Format)}
						className={styles.select}
					>
						{FORMATS.map((f) => (
							<option key={f.value} value={f.value}>
								{f.label}
							</option>
						))}
					</select>
				</div>

				<button
					type="button"
					onClick={swapDirection}
					className={styles.btnSecondary}
					title="Swap source and target"
				>
					<ArrowsRightLeftIcon className="w-4 h-4" />
					Swap
				</button>

				<div className="flex flex-col gap-1">
					<label htmlFor="toml-target-format" className={`text-xs font-medium ${styles.cardSubtitle}`}>
						Target format
					</label>
					<select
						id="toml-target-format"
						value={target}
						onChange={(e) => setTarget(e.target.value as Format)}
						className={styles.select}
					>
						{FORMATS.map((f) => (
							<option key={f.value} value={f.value}>
								{f.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Input */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{FORMATS.find((f) => f.value === source)?.label} Input
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
					placeholder={PLACEHOLDERS[source]}
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{/* Output */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{FORMATS.find((f) => f.value === target)?.label} Output
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
					About this converter
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Convert between <code>JSON</code>, <code>YAML</code>, and <code>TOML</code> by round-tripping through a JavaScript object.
					Comments are not preserved (none of the three formats round-trip them through a generic object model).
					TOML output requires a top-level object — arrays or primitives at the root cannot be expressed as TOML.
				</p>
			</div>
		</div>
	);
}
