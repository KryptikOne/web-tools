"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowsRightLeftIcon,
	TrashIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import styles from "./AsciiToHex.module.scss";

type Delimiter = "space" | "colon" | "dash" | "none" | "0x";
type HexCase = "upper" | "lower";

// Generate ASCII table data for characters 0-127
const ASCII_TABLE = Array.from({ length: 128 }, (_, i) => {
	let displayChar: string;
	if (i === 0) displayChar = "NUL";
	else if (i === 1) displayChar = "SOH";
	else if (i === 2) displayChar = "STX";
	else if (i === 3) displayChar = "ETX";
	else if (i === 4) displayChar = "EOT";
	else if (i === 5) displayChar = "ENQ";
	else if (i === 6) displayChar = "ACK";
	else if (i === 7) displayChar = "BEL";
	else if (i === 8) displayChar = "BS";
	else if (i === 9) displayChar = "TAB";
	else if (i === 10) displayChar = "LF";
	else if (i === 11) displayChar = "VT";
	else if (i === 12) displayChar = "FF";
	else if (i === 13) displayChar = "CR";
	else if (i === 14) displayChar = "SO";
	else if (i === 15) displayChar = "SI";
	else if (i === 16) displayChar = "DLE";
	else if (i === 17) displayChar = "DC1";
	else if (i === 18) displayChar = "DC2";
	else if (i === 19) displayChar = "DC3";
	else if (i === 20) displayChar = "DC4";
	else if (i === 21) displayChar = "NAK";
	else if (i === 22) displayChar = "SYN";
	else if (i === 23) displayChar = "ETB";
	else if (i === 24) displayChar = "CAN";
	else if (i === 25) displayChar = "EM";
	else if (i === 26) displayChar = "SUB";
	else if (i === 27) displayChar = "ESC";
	else if (i === 28) displayChar = "FS";
	else if (i === 29) displayChar = "GS";
	else if (i === 30) displayChar = "RS";
	else if (i === 31) displayChar = "US";
	else if (i === 32) displayChar = "SP";
	else if (i === 127) displayChar = "DEL";
	else displayChar = String.fromCharCode(i);

	return {
		decimal: i,
		hex: i.toString(16).toUpperCase().padStart(2, "0"),
		octal: i.toString(8).padStart(3, "0"),
		char: displayChar,
		isControl: i < 33 || i === 127,
	};
});

export default function AsciiToHex() {
	const [asciiInput, setAsciiInput] = useState("");
	const [hexInput, setHexInput] = useState("");
	const [delimiter, setDelimiter] = useState<Delimiter>("space");
	const [hexCase, setHexCase] = useState<HexCase>("upper");
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [tableSearch, setTableSearch] = useState("");

	// Get delimiter string
	const getDelimiterStr = useCallback((delim: Delimiter): string => {
		switch (delim) {
			case "space": return " ";
			case "colon": return ":";
			case "dash": return "-";
			case "none": return "";
			case "0x": return " 0x";
		}
	}, []);

	// Format a single byte as hex
	const formatHexByte = useCallback((byte: number): string => {
		const hex = byte.toString(16).padStart(2, "0");
		return hexCase === "upper" ? hex.toUpperCase() : hex.toLowerCase();
	}, [hexCase]);

	// ASCII to Hex conversion
	const hexOutput = useMemo(() => {
		if (!asciiInput) return "";
		const delimStr = getDelimiterStr(delimiter);
		const prefix = delimiter === "0x" ? "0x" : "";

		return asciiInput
			.split("")
			.map((char) => {
				const code = char.charCodeAt(0);
				return prefix + formatHexByte(code);
			})
			.join(delimStr);
	}, [asciiInput, delimiter, hexCase, getDelimiterStr, formatHexByte]);

	// Hex to ASCII conversion
	const asciiOutput = useMemo(() => {
		if (!hexInput) return "";
		try {
			// Strip common prefixes and delimiters, extract hex pairs
			const cleaned = hexInput.replace(/0x/gi, "").replace(/[^0-9a-fA-F]/g, "");
			if (cleaned.length === 0) return "";
			if (cleaned.length % 2 !== 0) return "[Incomplete hex byte]";

			const bytes: string[] = [];
			for (let i = 0; i < cleaned.length; i += 2) {
				bytes.push(cleaned.substring(i, i + 2));
			}

			return bytes
				.map((hex) => {
					const code = parseInt(hex, 16);
					if (isNaN(code)) return "?";
					return String.fromCharCode(code);
				})
				.join("");
		} catch {
			return "[Invalid hex input]";
		}
	}, [hexInput]);

	// Swap: move output of one panel into input of the other
	const handleSwap = () => {
		const currentHexOutput = hexOutput;
		const currentAsciiOutput = asciiOutput;
		setAsciiInput(currentAsciiOutput || "");
		setHexInput(currentHexOutput || "");
	};

	// Copy to clipboard
	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Clear all
	const handleClear = () => {
		setAsciiInput("");
		setHexInput("");
	};

	// Stats
	const asciiStats = useMemo(() => ({
		chars: asciiInput.length,
		bytes: new TextEncoder().encode(asciiInput).length,
	}), [asciiInput]);

	const hexStats = useMemo(() => {
		const cleaned = hexInput.replace(/0x/gi, "").replace(/[^0-9a-fA-F]/g, "");
		return { bytes: Math.floor(cleaned.length / 2) };
	}, [hexInput]);

	// Filtered ASCII table
	const filteredTable = useMemo(() => {
		if (!tableSearch.trim()) return ASCII_TABLE;
		const q = tableSearch.toLowerCase().trim();
		return ASCII_TABLE.filter((entry) =>
			entry.decimal.toString().includes(q) ||
			entry.hex.toLowerCase().includes(q) ||
			entry.octal.includes(q) ||
			entry.char.toLowerCase().includes(q)
		);
	}, [tableSearch]);

	return (
		<div className={styles.container}>
			{/* Options Bar */}
			<div className={`flex flex-wrap items-center gap-6 px-6 py-4 mb-6 ${styles.optionsBar}`}>
				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>Delimiter</label>
					<select
						value={delimiter}
						onChange={(e) => setDelimiter(e.target.value as Delimiter)}
						className={styles.select}
					>
						<option value="space">Space</option>
						<option value="colon">Colon (:)</option>
						<option value="dash">Dash (-)</option>
						<option value="none">None</option>
						<option value="0x">0x Prefix</option>
					</select>
				</div>

				<div className={`flex items-center gap-2 ${styles.optionGroup}`}>
					<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>Hex Case</label>
					<select
						value={hexCase}
						onChange={(e) => setHexCase(e.target.value as HexCase)}
						className={styles.select}
					>
						<option value="upper">UPPERCASE</option>
						<option value="lower">lowercase</option>
					</select>
				</div>

				<div className="ml-auto">
					<button onClick={handleClear} className={styles.btnSecondary} disabled={!asciiInput && !hexInput}>
						<TrashIcon className="w-4 h-4" />
						Clear All
					</button>
				</div>
			</div>

			{/* Converter Grid */}
			<div className={`grid gap-4 mb-6 items-start ${styles.grid}`}>
				{/* ASCII Input Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>ASCII Text</h3>
						<div className="flex gap-2">
							<button
								onClick={() => handleCopy(hexOutput, "hexOutput")}
								className={`${styles.btnPrimary} ${copiedField === "hexOutput" ? styles.copied : ""}`}
								disabled={!hexOutput}
							>
								{copiedField === "hexOutput" ? (
									<>
										<CheckIcon className="w-4 h-4" />
										Copied Hex!
									</>
								) : (
									<>
										<ClipboardDocumentIcon className="w-4 h-4" />
										Copy Hex
									</>
								)}
							</button>
						</div>
					</div>

					<textarea
						value={asciiInput}
						onChange={(e) => setAsciiInput(e.target.value)}
						placeholder="Enter ASCII text to convert to hex..."
						className={styles.textarea}
						spellCheck={false}
					/>

					<div className={`mt-3 ${styles.outputBlock}`}>
						<label className={`text-xs font-medium mb-1 block ${styles.outputLabel}`}>Hex Output</label>
						<div className={styles.outputDisplay}>
							{hexOutput || <span className={styles.placeholder}>Hex output will appear here...</span>}
						</div>
					</div>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>{asciiStats.chars} characters, {asciiStats.bytes} bytes</span>
					</div>
				</div>

				{/* Swap Button */}
				<div className={`flex items-center justify-center py-4 ${styles.swapContainer}`}>
					<button
						onClick={handleSwap}
						className={`flex items-center justify-center p-3 ${styles.swapButton}`}
						title="Swap conversion values"
					>
						<ArrowsRightLeftIcon className="w-6 h-6" />
					</button>
				</div>

				{/* Hex Input Panel */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Hex Input</h3>
						<div className="flex gap-2">
							<button
								onClick={() => handleCopy(asciiOutput, "asciiOutput")}
								className={`${styles.btnPrimary} ${copiedField === "asciiOutput" ? styles.copied : ""}`}
								disabled={!asciiOutput}
							>
								{copiedField === "asciiOutput" ? (
									<>
										<CheckIcon className="w-4 h-4" />
										Copied ASCII!
									</>
								) : (
									<>
										<ClipboardDocumentIcon className="w-4 h-4" />
										Copy ASCII
									</>
								)}
							</button>
						</div>
					</div>

					<textarea
						value={hexInput}
						onChange={(e) => setHexInput(e.target.value)}
						placeholder="Enter hex values to convert to ASCII (e.g., 48 65 6C 6C 6F)..."
						className={styles.textarea}
						spellCheck={false}
					/>

					<div className={`mt-3 ${styles.outputBlock}`}>
						<label className={`text-xs font-medium mb-1 block ${styles.outputLabel}`}>ASCII Output</label>
						<div className={styles.outputDisplay}>
							{asciiOutput || <span className={styles.placeholder}>ASCII output will appear here...</span>}
						</div>
					</div>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>{hexStats.bytes} hex bytes</span>
					</div>
				</div>
			</div>

			{/* ASCII Table */}
			<div className={styles.glassCard}>
				<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
					<h3 className={`text-lg font-semibold m-0 ${styles.sectionTitle}`}>ASCII Character Table (0-127)</h3>
					<div className={`${styles.tableSearchWrapper}`}>
						<MagnifyingGlassIcon className={styles.tableSearchIcon} />
						<input
							type="text"
							value={tableSearch}
							onChange={(e) => setTableSearch(e.target.value)}
							placeholder="Search table..."
							className={styles.tableSearchInput}
						/>
					</div>
				</div>

				<div className={styles.tableWrapper}>
					<table className={styles.asciiTable}>
						<thead>
							<tr>
								<th className="text-left">Dec</th>
								<th className="text-left">Hex</th>
								<th className="text-left">Oct</th>
								<th className="text-left">Char</th>
							</tr>
						</thead>
						<tbody>
							{filteredTable.map((entry) => (
								<tr key={entry.decimal} className={entry.isControl ? styles.controlChar : ""}>
									<td>{entry.decimal}</td>
									<td className={styles.monoCell}>{entry.hex}</td>
									<td className={styles.monoCell}>{entry.octal}</td>
									<td className={`${styles.monoCell} ${entry.isControl ? styles.controlLabel : ""}`}>
										{entry.char}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{filteredTable.length === 0 && (
					<div className={`text-center py-8 ${styles.noResults}`}>
						<p className="m-0">No characters found matching &quot;{tableSearch}&quot;</p>
					</div>
				)}
			</div>
		</div>
	);
}
