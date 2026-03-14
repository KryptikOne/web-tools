"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowDownTrayIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./JsonToCsv.module.scss";

type Delimiter = "comma" | "semicolon" | "tab" | "pipe";

interface ConversionOptions {
	delimiter: Delimiter;
	includeHeaders: boolean;
	quoteAll: boolean;
	flattenNested: boolean;
}

const DELIMITER_MAP: Record<Delimiter, string> = {
	comma: ",",
	semicolon: ";",
	tab: "\t",
	pipe: "|",
};

const DELIMITER_LABELS: Record<Delimiter, string> = {
	comma: "Comma (,)",
	semicolon: "Semicolon (;)",
	tab: "Tab",
	pipe: "Pipe (|)",
};

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const key of Object.keys(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];

		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
		} else {
			result[fullKey] = value;
		}
	}

	return result;
}

function escapeCSVValue(value: unknown, delimChar: string, quoteAll: boolean): string {
	if (value === null || value === undefined) return "";

	const str = typeof value === "object" ? JSON.stringify(value) : String(value);

	const needsQuoting =
		quoteAll ||
		str.includes(delimChar) ||
		str.includes('"') ||
		str.includes("\n") ||
		str.includes("\r");

	if (needsQuoting) {
		return `"${str.replace(/"/g, '""')}"`;
	}

	return str;
}

export default function JsonToCsv() {
	const [jsonInput, setJsonInput] = useState("");
	const [options, setOptions] = useState<ConversionOptions>({
		delimiter: "comma",
		includeHeaders: true,
		quoteAll: false,
		flattenNested: true,
	});
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const updateOption = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) => {
		setOptions((prev) => ({ ...prev, [key]: value }));
	};

	// Parse JSON and convert to CSV
	const { csvOutput, headers, rows, error } = useMemo(() => {
		if (!jsonInput.trim()) {
			return { csvOutput: "", headers: [] as string[], rows: [] as string[][], error: null };
		}

		try {
			const parsed = JSON.parse(jsonInput);

			if (!Array.isArray(parsed)) {
				return {
					csvOutput: "",
					headers: [] as string[],
					rows: [] as string[][],
					error: "Input must be a JSON array of objects. Example: [{ \"name\": \"Alice\" }, { \"name\": \"Bob\" }]",
				};
			}

			if (parsed.length === 0) {
				return { csvOutput: "", headers: [] as string[], rows: [] as string[][], error: "Array is empty." };
			}

			// Process objects (flatten if enabled)
			const processedRows: Record<string, unknown>[] = parsed.map((item) => {
				if (item === null || typeof item !== "object" || Array.isArray(item)) {
					return { value: item };
				}
				return options.flattenNested
					? flattenObject(item as Record<string, unknown>)
					: (item as Record<string, unknown>);
			});

			// Collect all unique headers across all rows
			const headerSet = new Set<string>();
			for (const row of processedRows) {
				for (const key of Object.keys(row)) {
					headerSet.add(key);
				}
			}
			const allHeaders = Array.from(headerSet);

			const delimChar = DELIMITER_MAP[options.delimiter];

			// Build CSV rows
			const csvRows: string[] = [];

			if (options.includeHeaders) {
				csvRows.push(
					allHeaders.map((h) => escapeCSVValue(h, delimChar, options.quoteAll)).join(delimChar)
				);
			}

			const dataRows: string[][] = [];

			for (const row of processedRows) {
				const values = allHeaders.map((header) => {
					const raw = row[header];
					return escapeCSVValue(raw, delimChar, options.quoteAll);
				});
				csvRows.push(values.join(delimChar));
				dataRows.push(allHeaders.map((header) => {
					const raw = row[header];
					if (raw === null || raw === undefined) return "";
					return typeof raw === "object" ? JSON.stringify(raw) : String(raw);
				}));
			}

			return {
				csvOutput: csvRows.join("\n"),
				headers: allHeaders,
				rows: dataRows,
				error: null,
			};
		} catch (e) {
			return {
				csvOutput: "",
				headers: [] as string[],
				rows: [] as string[][],
				error: e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : "Failed to parse JSON input.",
			};
		}
	}, [jsonInput, options]);

	// Copy to clipboard
	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	// Download as .csv
	const handleDownload = useCallback(() => {
		if (!csvOutput) return;

		const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "data.csv";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [csvOutput]);

	// Clear input
	const handleClear = () => {
		setJsonInput("");
	};

	// Stats
	const rowCount = rows.length;
	const colCount = headers.length;

	return (
		<div className={styles.container}>
			{/* Options Bar */}
			<div className={`flex flex-wrap items-center gap-6 px-6 py-4 mb-6 ${styles.optionsBar}`}>
				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>
						Delimiter
					</label>
					<select
						value={options.delimiter}
						onChange={(e) => updateOption("delimiter", e.target.value as Delimiter)}
						className={styles.select}
					>
						{Object.entries(DELIMITER_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</div>

				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={options.includeHeaders}
							onChange={(e) => updateOption("includeHeaders", e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Include Headers
					</label>
				</div>

				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={options.quoteAll}
							onChange={(e) => updateOption("quoteAll", e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Quote All Values
					</label>
				</div>

				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={options.flattenNested}
							onChange={(e) => updateOption("flattenNested", e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Flatten Nested Objects
					</label>
				</div>
			</div>

			{/* Main Grid */}
			<div className={`grid gap-6 mb-6 ${styles.grid}`}>
				{/* JSON Input Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>JSON Input</h3>
						<div className="flex flex-wrap gap-2">
							<button onClick={handleClear} className={styles.btnSecondary} disabled={!jsonInput}>
								<TrashIcon className="w-4 h-4" />
								Clear
							</button>
						</div>
					</div>

					<textarea
						value={jsonInput}
						onChange={(e) => setJsonInput(e.target.value)}
						placeholder={'[\n  { "name": "Alice", "age": 30, "city": "NYC" },\n  { "name": "Bob", "age": 25, "city": "LA" }\n]'}
						className={styles.textarea}
						spellCheck={false}
					/>

					{error && (
						<div className={`mt-3 ${styles.errorMessage}`}>
							{error}
						</div>
					)}

					{!error && jsonInput.trim() && (
						<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
							<span>{rowCount} rows &middot; {colCount} columns</span>
						</div>
					)}
				</div>

				{/* CSV Output Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>CSV Output</h3>
						<div className="flex flex-wrap gap-2">
							<button
								onClick={() => handleCopy(csvOutput, "csv")}
								className={`${styles.btnPrimary} ${copiedField === "csv" ? styles.copied : ""}`}
								disabled={!csvOutput}
							>
								{copiedField === "csv" ? (
									<>
										<CheckIcon className="w-4 h-4" />
										Copied!
									</>
								) : (
									<>
										<ClipboardDocumentIcon className="w-4 h-4" />
										Copy CSV
									</>
								)}
							</button>
							<button
								onClick={handleDownload}
								className={styles.btnSecondary}
								disabled={!csvOutput}
							>
								<ArrowDownTrayIcon className="w-4 h-4" />
								Download .csv
							</button>
						</div>
					</div>

					<pre className={styles.codeBlock}>
						<code>{csvOutput || "CSV output will appear here..."}</code>
					</pre>

					{csvOutput && (
						<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
							<span>{rowCount} rows &middot; {colCount} columns</span>
						</div>
					)}
				</div>
			</div>

			{/* Preview Table */}
			{headers.length > 0 && rows.length > 0 && (
				<div className={`mb-6 ${styles.glassCard}`}>
					<h3 className={styles.sectionTitle}>Data Preview</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.previewTable}>
							<thead>
								<tr>
									{headers.map((header) => (
										<th key={header}>{header}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{rows.slice(0, 50).map((row, rowIndex) => (
									<tr key={rowIndex}>
										{row.map((cell, cellIndex) => (
											<td key={cellIndex}>{cell}</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
						{rows.length > 50 && (
							<div className={`text-sm text-center py-3 ${styles.truncatedNotice}`}>
								Showing 50 of {rows.length} rows
							</div>
						)}
					</div>
				</div>
			)}

			{/* Info Section */}
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.infoTitle}`}>About JSON to CSV</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Expected Input</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Provide a JSON array of objects. Each object becomes a row, and each unique key becomes a column header. Missing keys in some objects will result in empty cells.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Nested Objects</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							When &quot;Flatten Nested Objects&quot; is enabled, nested keys are joined with dots (e.g., <code className={styles.codeExample}>address.city</code>). Arrays are serialized as JSON strings.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Quoting Rules</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Values containing the delimiter, double quotes, or newlines are automatically quoted. Enable &quot;Quote All Values&quot; to wrap every value in double quotes.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Delimiters</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Choose between comma (standard CSV), semicolon (common in European locales), tab (TSV), or pipe for your preferred format.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
