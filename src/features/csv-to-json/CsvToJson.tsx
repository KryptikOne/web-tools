"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowDownTrayIcon,
	ArrowUpTrayIcon,
	TrashIcon,
	TableCellsIcon,
} from "@heroicons/react/24/outline";
import styles from "./CsvToJson.module.scss";

type DelimiterOption = "comma" | "semicolon" | "tab" | "pipe" | "custom";

const DELIMITER_MAP: Record<Exclude<DelimiterOption, "custom">, string> = {
	comma: ",",
	semicolon: ";",
	tab: "\t",
	pipe: "|",
};

interface ParseResult {
	data: string[][] | Record<string, string>[];
	rows: number;
	columns: number;
	headers: string[];
	error: string | null;
}

function parseCSV(
	input: string,
	delimiter: string,
	firstRowAsHeaders: boolean,
	trimWhitespace: boolean,
	skipEmptyRows: boolean
): ParseResult {
	if (!input.trim()) {
		return { data: [], rows: 0, columns: 0, headers: [], error: null };
	}

	try {
		const rows: string[][] = [];
		let currentRow: string[] = [];
		let currentField = "";
		let inQuotes = false;
		let i = 0;

		while (i < input.length) {
			const char = input[i];

			if (inQuotes) {
				if (char === '"') {
					if (i + 1 < input.length && input[i + 1] === '"') {
						// Escaped quote
						currentField += '"';
						i += 2;
						continue;
					} else {
						// End of quoted field
						inQuotes = false;
						i++;
						continue;
					}
				} else {
					currentField += char;
					i++;
					continue;
				}
			}

			if (char === '"') {
				inQuotes = true;
				i++;
				continue;
			}

			if (char === delimiter || (delimiter === "\t" && char === "\t")) {
				const field = trimWhitespace ? currentField.trim() : currentField;
				currentRow.push(field);
				currentField = "";
				i++;
				continue;
			}

			if (char === "\r") {
				if (i + 1 < input.length && input[i + 1] === "\n") {
					i++; // Skip \r, \n will be handled next
				}
				const field = trimWhitespace ? currentField.trim() : currentField;
				currentRow.push(field);
				currentField = "";
				rows.push(currentRow);
				currentRow = [];
				i++;
				continue;
			}

			if (char === "\n") {
				const field = trimWhitespace ? currentField.trim() : currentField;
				currentRow.push(field);
				currentField = "";
				rows.push(currentRow);
				currentRow = [];
				i++;
				continue;
			}

			currentField += char;
			i++;
		}

		// Push last field and row
		if (currentField || currentRow.length > 0) {
			const field = trimWhitespace ? currentField.trim() : currentField;
			currentRow.push(field);
			rows.push(currentRow);
		}

		// Filter empty rows
		const filteredRows = skipEmptyRows
			? rows.filter((row) => row.some((field) => field.length > 0))
			: rows;

		if (filteredRows.length === 0) {
			return { data: [], rows: 0, columns: 0, headers: [], error: null };
		}

		const maxColumns = Math.max(...filteredRows.map((r) => r.length));

		// Normalize row lengths
		const normalizedRows = filteredRows.map((row) => {
			while (row.length < maxColumns) {
				row.push("");
			}
			return row;
		});

		if (firstRowAsHeaders) {
			const headers = normalizedRows[0];
			const dataRows = normalizedRows.slice(1);
			const objects = dataRows.map((row) => {
				const obj: Record<string, string> = {};
				headers.forEach((header, idx) => {
					const key = header || `column_${idx + 1}`;
					obj[key] = row[idx] ?? "";
				});
				return obj;
			});

			return {
				data: objects,
				rows: dataRows.length,
				columns: maxColumns,
				headers,
				error: null,
			};
		} else {
			return {
				data: normalizedRows,
				rows: normalizedRows.length,
				columns: maxColumns,
				headers: [],
				error: null,
			};
		}
	} catch {
		return {
			data: [],
			rows: 0,
			columns: 0,
			headers: [],
			error: "Failed to parse CSV. Check your input and delimiter settings.",
		};
	}
}

export default function CsvToJson() {
	const [csvInput, setCsvInput] = useState("");
	const [delimiterOption, setDelimiterOption] = useState<DelimiterOption>("comma");
	const [customDelimiter, setCustomDelimiter] = useState(",");
	const [firstRowAsHeaders, setFirstRowAsHeaders] = useState(true);
	const [trimWhitespace, setTrimWhitespace] = useState(true);
	const [skipEmptyRows, setSkipEmptyRows] = useState(true);
	const [showPreview, setShowPreview] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const delimiter = useMemo(() => {
		if (delimiterOption === "custom") return customDelimiter;
		return DELIMITER_MAP[delimiterOption];
	}, [delimiterOption, customDelimiter]);

	const parseResult = useMemo<ParseResult>(() => {
		return parseCSV(csvInput, delimiter, firstRowAsHeaders, trimWhitespace, skipEmptyRows);
	}, [csvInput, delimiter, firstRowAsHeaders, trimWhitespace, skipEmptyRows]);

	const jsonOutput = useMemo(() => {
		if (parseResult.error || parseResult.rows === 0) return "";
		try {
			return JSON.stringify(parseResult.data, null, 2);
		} catch {
			return "";
		}
	}, [parseResult]);

	// File upload handler
	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				const text = event.target?.result;
				if (typeof text === "string") {
					setCsvInput(text);
				}
			};
			reader.onerror = () => {
				setCsvInput("");
			};
			reader.readAsText(file);

			// Reset input so same file can be re-uploaded
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[]
	);

	// Copy JSON to clipboard
	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Download JSON file
	const handleDownload = useCallback(() => {
		if (!jsonOutput) return;
		const blob = new Blob([jsonOutput], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "data.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [jsonOutput]);

	// Clear input
	const handleClear = () => {
		setCsvInput("");
	};

	// Preview table data
	const previewData = useMemo(() => {
		if (!csvInput.trim()) return { headers: [] as string[], rows: [] as string[][] };

		// Always parse as arrays for the preview table
		const raw = parseCSV(csvInput, delimiter, false, trimWhitespace, skipEmptyRows);
		if (raw.error || (raw.data as string[][]).length === 0) {
			return { headers: [] as string[], rows: [] as string[][] };
		}

		const allRows = raw.data as string[][];

		if (firstRowAsHeaders && allRows.length > 0) {
			return {
				headers: allRows[0],
				rows: allRows.slice(1),
			};
		}

		// Generate column headers
		const colCount = allRows.length > 0 ? allRows[0].length : 0;
		const headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
		return { headers, rows: allRows };
	}, [csvInput, delimiter, firstRowAsHeaders, trimWhitespace, skipEmptyRows]);

	return (
		<div className={styles.container}>
			{/* Options Bar */}
			<div className={`flex flex-wrap items-center gap-6 px-6 py-4 mb-6 ${styles.optionsBar}`}>
				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>Delimiter</label>
					<select
						value={delimiterOption}
						onChange={(e) => setDelimiterOption(e.target.value as DelimiterOption)}
						className={styles.select}
					>
						<option value="comma">Comma (,)</option>
						<option value="semicolon">Semicolon (;)</option>
						<option value="tab">Tab</option>
						<option value="pipe">Pipe (|)</option>
						<option value="custom">Custom</option>
					</select>
					{delimiterOption === "custom" && (
						<input
							type="text"
							value={customDelimiter}
							onChange={(e) => setCustomDelimiter(e.target.value)}
							className={styles.customDelimiterInput}
							maxLength={5}
							placeholder="e.g. :"
						/>
					)}
				</div>

				<div className={`flex items-center gap-4 ${styles.optionGroup}`}>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={firstRowAsHeaders}
							onChange={(e) => setFirstRowAsHeaders(e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						First row as headers
					</label>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={trimWhitespace}
							onChange={(e) => setTrimWhitespace(e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Trim whitespace
					</label>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={skipEmptyRows}
							onChange={(e) => setSkipEmptyRows(e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Skip empty rows
					</label>
				</div>
			</div>

			{/* Converter Grid */}
			<div className={`grid gap-6 mb-6 ${styles.grid}`}>
				{/* CSV Input Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>CSV Input</h3>
						<div className={`flex flex-wrap gap-2`}>
							<button
								onClick={() => fileInputRef.current?.click()}
								className={styles.btnPreset}
							>
								<ArrowUpTrayIcon className="w-4 h-4" />
								Upload .csv
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv,text/csv"
								onChange={handleFileUpload}
								className="hidden"
							/>
							<button onClick={handleClear} className={styles.btnSecondary} disabled={!csvInput}>
								<TrashIcon className="w-4 h-4" />
								Clear
							</button>
						</div>
					</div>

					<textarea
						value={csvInput}
						onChange={(e) => setCsvInput(e.target.value)}
						placeholder={"Paste CSV data here or upload a file...\n\nExample:\nname,email,age\nJohn,john@example.com,30\nJane,jane@example.com,25"}
						className={styles.textarea}
						spellCheck={false}
					/>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						{parseResult.error ? (
							<span className={styles.errorText}>{parseResult.error}</span>
						) : (
							<span>
								{parseResult.rows} row{parseResult.rows !== 1 ? "s" : ""} &middot;{" "}
								{parseResult.columns} column{parseResult.columns !== 1 ? "s" : ""}
							</span>
						)}
					</div>
				</div>

				{/* JSON Output Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>JSON Output</h3>
						<div className={`flex flex-wrap gap-2`}>
							<button
								onClick={() => setShowPreview(!showPreview)}
								className={`${styles.btnPreset} ${showPreview ? styles.active : ""}`}
							>
								<TableCellsIcon className="w-4 h-4" />
								{showPreview ? "Show JSON" : "Preview Table"}
							</button>
							<button
								onClick={() => handleCopy(jsonOutput, "json")}
								className={`${styles.btnPrimary} ${copiedField === "json" ? styles.copied : ""}`}
								disabled={!jsonOutput}
							>
								{copiedField === "json" ? (
									<>
										<CheckIcon className="w-4 h-4" />
										Copied!
									</>
								) : (
									<>
										<ClipboardDocumentIcon className="w-4 h-4" />
										Copy JSON
									</>
								)}
							</button>
							<button
								onClick={handleDownload}
								className={styles.btnSecondary}
								disabled={!jsonOutput}
							>
								<ArrowDownTrayIcon className="w-4 h-4" />
								Download .json
							</button>
						</div>
					</div>

					{showPreview ? (
						<div className={styles.tableWrapper}>
							{previewData.rows.length > 0 ? (
								<table className={styles.previewTable}>
									<thead>
										<tr>
											{previewData.headers.map((header, idx) => (
												<th key={idx}>{header}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{previewData.rows.map((row, rowIdx) => (
											<tr key={rowIdx}>
												{row.map((cell, cellIdx) => (
													<td key={cellIdx}>{cell}</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							) : (
								<div className={styles.emptyPreview}>
									No data to preview
								</div>
							)}
						</div>
					) : (
						<pre className={styles.codeBlock}>
							<code>{jsonOutput || "JSON output will appear here..."}</code>
						</pre>
					)}

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>
							{jsonOutput
								? `${jsonOutput.length.toLocaleString()} characters`
								: "No output"}
						</span>
					</div>
				</div>
			</div>

			{/* Info Section */}
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.infoTitle}`}>About CSV to JSON</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>How It Works</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							CSV (Comma-Separated Values) data is parsed row by row. When &quot;First row as headers&quot; is enabled, the
							output is an array of objects keyed by header names. Otherwise, it produces an array of arrays.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Quoted Fields</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Fields containing delimiters, newlines, or double quotes can be wrapped in double quotes. Escaped quotes
							within a field use two consecutive double quotes (<code className={styles.codeExample}>&quot;&quot;</code>).
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Common Delimiters</h4>
						<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
							<li>Comma &mdash; most common (RFC 4180)</li>
							<li>Semicolon &mdash; common in European locales</li>
							<li>Tab &mdash; TSV files</li>
							<li>Pipe &mdash; used in some data exports</li>
						</ul>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Tips</h4>
						<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
							<li>Use the preview table to verify parsing</li>
							<li>Toggle &quot;First row as headers&quot; to switch between object and array output</li>
							<li>Upload .csv files directly or paste from a spreadsheet</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
