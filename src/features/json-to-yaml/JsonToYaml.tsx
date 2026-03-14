"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import styles from "./JsonToYaml.module.scss";

type ConversionMode = "json-to-yaml" | "yaml-to-json";
type IndentSize = 2 | 4;

// --- JSON to YAML serializer ---

function jsonToYaml(value: unknown, indent: number, level: number = 0): string {
	const prefix = " ".repeat(indent * level);
	const childPrefix = " ".repeat(indent * (level + 1));

	if (value === null) return "null";
	if (value === undefined) return "null";
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "number") {
		if (Number.isNaN(value)) return ".nan";
		if (!Number.isFinite(value)) return value > 0 ? ".inf" : "-.inf";
		return String(value);
	}
	if (typeof value === "string") {
		// Use quotes if the string contains special characters or could be misinterpreted
		if (
			value === "" ||
			value === "true" ||
			value === "false" ||
			value === "null" ||
			value === "~" ||
			/^[\d.+-]/.test(value) ||
			/[:#\[\]{}&*!|>'"%@`?,]/.test(value) ||
			value.includes("\n") ||
			value.trim() !== value
		) {
			// Use double quotes and escape special characters
			const escaped = value
				.replace(/\\/g, "\\\\")
				.replace(/"/g, '\\"')
				.replace(/\n/g, "\\n")
				.replace(/\t/g, "\\t");
			return `"${escaped}"`;
		}
		return value;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) return "[]";
		const lines = value.map((item) => {
			const serialized = jsonToYaml(item, indent, level + 1);
			if (typeof item === "object" && item !== null && !Array.isArray(item)) {
				// Object items: put first key on same line as dash
				const firstNewline = serialized.indexOf("\n");
				if (firstNewline === -1) {
					return `${prefix}- ${serialized}`;
				}
				// Multi-key object: first key on dash line, rest indented
				const objLines = serialized.split("\n");
				const result = [`${prefix}- ${objLines[0].trimStart()}`];
				for (let i = 1; i < objLines.length; i++) {
					result.push(`${prefix}  ${objLines[i].trimStart()}`);
				}
				return result.join("\n");
			}
			if (Array.isArray(item) && item.length > 0) {
				return `${prefix}-\n${serialized
					.split("\n")
					.map((line) => `${childPrefix}${line.trimStart()}`)
					.join("\n")}`;
			}
			return `${prefix}- ${serialized}`;
		});
		return lines.join("\n");
	}

	if (typeof value === "object") {
		const entries = Object.entries(value);
		if (entries.length === 0) return "{}";
		const lines = entries.map(([key, val]) => {
			// Quote key if necessary
			let yamlKey = key;
			if (
				key === "" ||
				/[:#\[\]{}&*!|>'"%@`?,]/.test(key) ||
				key.trim() !== key ||
				key === "true" ||
				key === "false" ||
				key === "null"
			) {
				yamlKey = `"${key.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
			}

			const serialized = jsonToYaml(val, indent, level + 1);
			if (typeof val === "object" && val !== null && serialized !== "[]" && serialized !== "{}") {
				return `${prefix}${yamlKey}:\n${serialized}`;
			}
			return `${prefix}${yamlKey}: ${serialized}`;
		});
		return lines.join("\n");
	}

	return String(value);
}

function convertJsonToYaml(jsonStr: string, indent: IndentSize): string {
	const parsed = JSON.parse(jsonStr);
	const result = jsonToYaml(parsed, indent, 0);
	return result;
}

// --- YAML to JSON parser ---

interface YamlLine {
	indent: number;
	content: string;
	lineNum: number;
}

function tokenizeYaml(yaml: string): YamlLine[] {
	const lines = yaml.split("\n");
	const result: YamlLine[] = [];
	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		// Skip empty lines and comments
		if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
		const match = raw.match(/^(\s*)/);
		const indent = match ? match[1].length : 0;
		result.push({ indent, content: raw.trim(), lineNum: i + 1 });
	}
	return result;
}

function parseYamlValue(value: string): unknown {
	if (value === "" || value === "~" || value === "null" || value === "Null" || value === "NULL") {
		return null;
	}
	if (value === "true" || value === "True" || value === "TRUE") return true;
	if (value === "false" || value === "False" || value === "FALSE") return false;
	if (value === ".inf" || value === ".Inf") return Infinity;
	if (value === "-.inf" || value === "-.Inf") return -Infinity;
	if (value === ".nan" || value === ".NaN") return NaN;

	// Quoted strings
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		const inner = value.slice(1, -1);
		if (value.startsWith('"')) {
			return inner.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
		}
		return inner.replace(/''/g, "'");
	}

	// Inline array: [a, b, c]
	if (value.startsWith("[") && value.endsWith("]")) {
		const inner = value.slice(1, -1).trim();
		if (inner === "") return [];
		return splitFlowItems(inner).map((item) => parseYamlValue(item.trim()));
	}

	// Inline object: {a: b, c: d}
	if (value.startsWith("{") && value.endsWith("}")) {
		const inner = value.slice(1, -1).trim();
		if (inner === "") return {};
		const obj: Record<string, unknown> = {};
		const pairs = splitFlowItems(inner);
		for (const pair of pairs) {
			const colonIdx = pair.indexOf(":");
			if (colonIdx === -1) continue;
			const k = pair.slice(0, colonIdx).trim();
			const v = pair.slice(colonIdx + 1).trim();
			obj[unquoteKey(k)] = parseYamlValue(v);
		}
		return obj;
	}

	// Numbers
	if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value)) {
		const num = Number(value);
		if (!isNaN(num)) return num;
	}

	// Octal (0o...) and hex (0x...)
	if (/^0x[0-9a-fA-F]+$/.test(value)) return parseInt(value, 16);
	if (/^0o[0-7]+$/.test(value)) return parseInt(value.slice(2), 8);

	return value;
}

function splitFlowItems(str: string): string[] {
	const items: string[] = [];
	let depth = 0;
	let current = "";
	let inQuote: string | null = null;

	for (let i = 0; i < str.length; i++) {
		const ch = str[i];
		if (inQuote) {
			current += ch;
			if (ch === inQuote && str[i - 1] !== "\\") inQuote = null;
			continue;
		}
		if (ch === '"' || ch === "'") {
			inQuote = ch;
			current += ch;
			continue;
		}
		if (ch === "[" || ch === "{") {
			depth++;
			current += ch;
		} else if (ch === "]" || ch === "}") {
			depth--;
			current += ch;
		} else if (ch === "," && depth === 0) {
			items.push(current);
			current = "";
		} else {
			current += ch;
		}
	}
	if (current.trim()) items.push(current);
	return items;
}

function unquoteKey(key: string): string {
	if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
		return key.slice(1, -1);
	}
	return key;
}

function parseYamlBlock(lines: YamlLine[], start: number, parentIndent: number): { value: unknown; nextIndex: number } {
	if (start >= lines.length) return { value: null, nextIndex: start };

	const line = lines[start];

	// List item
	if (line.content.startsWith("- ") || line.content === "-") {
		return parseYamlArray(lines, start, line.indent);
	}

	// Key: value
	const colonMatch = line.content.match(/^([^:]+?):\s*(.*)/);
	if (colonMatch) {
		return parseYamlObject(lines, start, line.indent);
	}

	// Plain scalar
	return { value: parseYamlValue(line.content), nextIndex: start + 1 };
}

function parseYamlArray(lines: YamlLine[], start: number, baseIndent: number): { value: unknown[]; nextIndex: number } {
	const result: unknown[] = [];
	let idx = start;

	while (idx < lines.length) {
		const line = lines[idx];
		if (line.indent < baseIndent) break;
		if (line.indent > baseIndent) break; // Shouldn't happen at array level

		if (line.content.startsWith("- ")) {
			const afterDash = line.content.slice(2).trim();

			// Check if it's "- key: value" (object entry in array)
			const kvMatch = afterDash.match(/^([^:]+?):\s*(.*)/);
			if (kvMatch) {
				// Start of inline object in array
				const obj: Record<string, unknown> = {};
				const key = unquoteKey(kvMatch[1].trim());
				const val = kvMatch[2].trim();

				if (val === "") {
					// Value is nested block
					const nested = parseYamlBlock(lines, idx + 1, baseIndent + 2);
					obj[key] = nested.value;
					idx = nested.nextIndex;
				} else {
					obj[key] = parseYamlValue(val);
					idx++;
				}

				// Gather remaining keys at deeper indent
				while (idx < lines.length && lines[idx].indent > baseIndent) {
					const subLine = lines[idx];
					const subMatch = subLine.content.match(/^([^:]+?):\s*(.*)/);
					if (subMatch) {
						const subKey = unquoteKey(subMatch[1].trim());
						const subVal = subMatch[2].trim();
						if (subVal === "") {
							const nested = parseYamlBlock(lines, idx + 1, subLine.indent + 2);
							obj[subKey] = nested.value;
							idx = nested.nextIndex;
						} else {
							obj[subKey] = parseYamlValue(subVal);
							idx++;
						}
					} else {
						break;
					}
				}

				result.push(obj);
				continue;
			}

			// Simple value after dash
			if (afterDash !== "") {
				result.push(parseYamlValue(afterDash));
				idx++;
			} else {
				// Nested block after bare dash
				if (idx + 1 < lines.length && lines[idx + 1].indent > baseIndent) {
					const nested = parseYamlBlock(lines, idx + 1, baseIndent);
					result.push(nested.value);
					idx = nested.nextIndex;
				} else {
					result.push(null);
					idx++;
				}
			}
		} else if (line.content === "-") {
			// Bare dash
			if (idx + 1 < lines.length && lines[idx + 1].indent > baseIndent) {
				const nested = parseYamlBlock(lines, idx + 1, baseIndent);
				result.push(nested.value);
				idx = nested.nextIndex;
			} else {
				result.push(null);
				idx++;
			}
		} else {
			break;
		}
	}

	return { value: result, nextIndex: idx };
}

function parseYamlObject(lines: YamlLine[], start: number, baseIndent: number): { value: Record<string, unknown>; nextIndex: number } {
	const result: Record<string, unknown> = {};
	let idx = start;

	while (idx < lines.length) {
		const line = lines[idx];
		if (line.indent < baseIndent) break;
		if (line.indent > baseIndent) break;

		const colonMatch = line.content.match(/^([^:]+?):\s*(.*)/);
		if (!colonMatch) break;

		const key = unquoteKey(colonMatch[1].trim());
		const val = colonMatch[2].trim();

		if (val === "") {
			// Value is a nested block
			if (idx + 1 < lines.length && lines[idx + 1].indent > baseIndent) {
				const nested = parseYamlBlock(lines, idx + 1, baseIndent);
				result[key] = nested.value;
				idx = nested.nextIndex;
			} else {
				result[key] = null;
				idx++;
			}
		} else {
			result[key] = parseYamlValue(val);
			idx++;
		}
	}

	return { value: result, nextIndex: idx };
}

function convertYamlToJson(yamlStr: string, indent: IndentSize): string {
	const trimmed = yamlStr.trim();
	if (trimmed === "") return "";

	// Handle document separator
	const content = trimmed.startsWith("---") ? trimmed.replace(/^---\s*\n?/, "") : trimmed;
	if (content.trim() === "") return "";

	const lines = tokenizeYaml(content);
	if (lines.length === 0) return "";

	const { value } = parseYamlBlock(lines, 0, lines[0].indent);
	return JSON.stringify(value, null, indent);
}

// --- Component ---

export default function JsonToYaml() {
	const [mode, setMode] = useState<ConversionMode>("json-to-yaml");
	const [input, setInput] = useState("");
	const [indentSize, setIndentSize] = useState<IndentSize>(2);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const { output, error } = useMemo(() => {
		if (!input.trim()) return { output: "", error: null };

		try {
			if (mode === "json-to-yaml") {
				return { output: convertJsonToYaml(input, indentSize), error: null };
			} else {
				return { output: convertYamlToJson(input, indentSize), error: null };
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : "Invalid input";
			return { output: "", error: message };
		}
	}, [input, mode, indentSize]);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const handleClear = () => {
		setInput("");
	};

	const handleSwap = () => {
		// If current output is valid, use it as new input
		if (output) {
			setInput(output);
		}
		setMode((prev) => (prev === "json-to-yaml" ? "yaml-to-json" : "json-to-yaml"));
	};

	const inputLabel = mode === "json-to-yaml" ? "JSON" : "YAML";
	const outputLabel = mode === "json-to-yaml" ? "YAML" : "JSON";

	return (
		<div className={styles.container}>
			{/* Tab Toggle */}
			<div className={`flex items-center gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => setMode("json-to-yaml")}
					className={`${styles.tab} ${mode === "json-to-yaml" ? styles.tabActive : ""}`}
				>
					JSON to YAML
				</button>
				<button
					onClick={() => setMode("yaml-to-json")}
					className={`${styles.tab} ${mode === "yaml-to-json" ? styles.tabActive : ""}`}
				>
					YAML to JSON
				</button>
			</div>

			{/* Options Bar */}
			<div className={`flex flex-wrap items-center gap-6 px-6 py-4 mb-6 ${styles.optionsBar}`}>
				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>Indent</label>
					<select
						value={indentSize}
						onChange={(e) => setIndentSize(Number(e.target.value) as IndentSize)}
						className={styles.select}
					>
						<option value={2}>2 spaces</option>
						<option value={4}>4 spaces</option>
					</select>
				</div>
			</div>

			{/* Converter Grid */}
			<div className={`grid gap-4 mb-6 items-start ${styles.grid}`}>
				{/* Input Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4 ${styles.cardHeader}`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>{inputLabel} Input</h3>
						<div className={`flex flex-wrap gap-2 ${styles.buttonGroup}`}>
							<button onClick={handleClear} className={styles.btnSecondary} disabled={!input}>
								<TrashIcon className={`w-4 h-4 ${styles.btnIcon}`} />
								Clear
							</button>
						</div>
					</div>

					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder={
							mode === "json-to-yaml"
								? '{"key": "value", "items": [1, 2, 3]}'
								: "key: value\nitems:\n  - 1\n  - 2\n  - 3"
						}
						className={styles.textarea}
						spellCheck={false}
					/>

					{error && (
						<div className={`flex items-center gap-2 mt-3 text-sm ${styles.errorMessage}`}>
							<span>{error}</span>
						</div>
					)}
				</div>

				{/* Swap Button */}
				<div className={`flex items-center justify-center py-4 ${styles.swapContainer}`}>
					<button
						onClick={handleSwap}
						className={`flex items-center justify-center p-3 ${styles.swapButton}`}
						title="Swap conversion direction"
					>
						<ArrowsRightLeftIcon className={`w-6 h-6 ${styles.swapIcon}`} />
					</button>
				</div>

				{/* Output Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4 ${styles.cardHeader}`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>{outputLabel} Output</h3>
						<div className={`flex flex-wrap gap-2 ${styles.buttonGroup}`}>
							<button
								onClick={() => handleCopy(output, "output")}
								className={`${styles.btnPrimary} ${copiedField === "output" ? styles.copied : ""}`}
								disabled={!output}
							>
								{copiedField === "output" ? (
									<>
										<CheckIcon className={`w-4 h-4 ${styles.btnIcon}`} />
										Copied!
									</>
								) : (
									<>
										<ClipboardDocumentIcon className={`w-4 h-4 ${styles.btnIcon}`} />
										Copy
									</>
								)}
							</button>
						</div>
					</div>

					<textarea
						value={output}
						readOnly
						placeholder="Output will appear here..."
						className={`${styles.textarea} ${styles.readOnly}`}
						spellCheck={false}
					/>
				</div>
			</div>

			{/* Info Section */}
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.infoTitle}`}>About JSON & YAML</h3>

				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>JSON</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							JSON (JavaScript Object Notation) is a lightweight data interchange format. It uses curly braces for objects, square brackets for arrays, and supports strings, numbers, booleans, and null.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>YAML</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							YAML (YAML Ain&apos;t Markup Language) is a human-readable data serialization format. It uses indentation for structure, dashes for list items, and colons for key-value pairs.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Common Use Cases</h4>
						<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
							<li>Configuration files (Docker, CI/CD, K8s)</li>
							<li>API request/response debugging</li>
							<li>Data format migration</li>
							<li>Documentation and readability</li>
						</ul>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Limitations</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							This converter handles common YAML patterns: key-value pairs, nested objects, lists, quoted strings, numbers, booleans, and null. Advanced features like anchors, aliases, and multi-line scalars are not supported.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
