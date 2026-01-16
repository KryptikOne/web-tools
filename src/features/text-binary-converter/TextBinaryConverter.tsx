"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowsRightLeftIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./TextBinaryConverter.module.scss";

type ConversionMode = "text-to-binary" | "binary-to-text";
type Encoding = "ascii" | "utf8";
type Delimiter = "space" | "comma" | "none";

export default function TextBinaryConverter() {
	const [mode, setMode] = useState<ConversionMode>("text-to-binary");
	const [inputText, setInputText] = useState("");
	const [encoding, setEncoding] = useState<Encoding>("ascii");
	const [delimiter, setDelimiter] = useState<Delimiter>("space");
	const [padBytes, setPadBytes] = useState(true);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Get delimiter character
	const getDelimiter = useCallback((delim: Delimiter): string => {
		switch (delim) {
			case "space":
				return " ";
			case "comma":
				return ",";
			case "none":
				return "";
		}
	}, []);

	// Convert text to binary
	const textToBinary = useCallback(
		(text: string): string => {
			if (!text) return "";

			const delimiterChar = getDelimiter(delimiter);

			if (encoding === "ascii") {
				return text
					.split("")
					.map((char) => {
						const code = char.charCodeAt(0);
						let binary = code.toString(2);
						if (padBytes) {
							binary = binary.padStart(8, "0");
						}
						return binary;
					})
					.join(delimiterChar);
			} else {
				// UTF-8 encoding
				const encoder = new TextEncoder();
				const bytes = encoder.encode(text);
				return Array.from(bytes)
					.map((byte) => {
						let binary = byte.toString(2);
						if (padBytes) {
							binary = binary.padStart(8, "0");
						}
						return binary;
					})
					.join(delimiterChar);
			}
		},
		[encoding, delimiter, padBytes, getDelimiter]
	);

	// Convert binary to text
	const binaryToText = useCallback(
		(binary: string): string => {
			if (!binary) return "";

			try {
				// Clean input: remove all non-binary characters except delimiters
				const cleaned = binary.replace(/[^01\s,]/g, "");

				// Split by any whitespace or comma
				const binaryStrings = cleaned.split(/[\s,]+/).filter((s) => s.length > 0);

				if (binaryStrings.length === 0) return "";

				if (encoding === "ascii") {
					return binaryStrings
						.map((bin) => {
							const code = parseInt(bin, 2);
							if (isNaN(code) || code > 127) return "?";
							return String.fromCharCode(code);
						})
						.join("");
				} else {
					// UTF-8 decoding
					const bytes = new Uint8Array(binaryStrings.map((bin) => parseInt(bin, 2)));
					const decoder = new TextDecoder("utf-8");
					return decoder.decode(bytes);
				}
			} catch {
				return "[Invalid binary input]";
			}
		},
		[encoding]
	);

	// Compute output based on mode
	const outputText = useMemo(() => {
		if (mode === "text-to-binary") {
			return textToBinary(inputText);
		} else {
			return binaryToText(inputText);
		}
	}, [mode, inputText, textToBinary, binaryToText]);

	// Swap mode
	const handleSwap = () => {
		const newMode = mode === "text-to-binary" ? "binary-to-text" : "text-to-binary";
		setMode(newMode);
		// Optionally swap input/output
		setInputText(outputText);
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

	// Clear input
	const handleClear = () => {
		setInputText("");
	};

	// Stats
	const stats = useMemo(() => {
		if (mode === "text-to-binary") {
			const charCount = inputText.length;
			const byteCount = new TextEncoder().encode(inputText).length;
			return { charCount, byteCount };
		} else {
			const binaryStrings = inputText.split(/[\s,]+/).filter((s) => /^[01]+$/.test(s));
			return { byteCount: binaryStrings.length, charCount: outputText.length };
		}
	}, [mode, inputText, outputText]);

	return (
		<div className={styles.container}>
			{/* Options Bar */}
			<div className={styles.optionsBar}>
				<div className={styles.optionGroup}>
					<label className={styles.optionLabel}>Encoding</label>
					<select value={encoding} onChange={(e) => setEncoding(e.target.value as Encoding)} className={styles.select}>
						<option value="ascii">ASCII</option>
						<option value="utf8">UTF-8</option>
					</select>
				</div>

				<div className={styles.optionGroup}>
					<label className={styles.optionLabel}>Delimiter</label>
					<select value={delimiter} onChange={(e) => setDelimiter(e.target.value as Delimiter)} className={styles.select}>
						<option value="space">Space</option>
						<option value="comma">Comma</option>
						<option value="none">None</option>
					</select>
				</div>

				<div className={styles.optionGroup}>
					<label className={styles.checkboxLabel}>
						<input type="checkbox" checked={padBytes} onChange={(e) => setPadBytes(e.target.checked)} className={styles.checkbox} />
						8-bit padding
					</label>
				</div>
			</div>

			{/* Converter Grid */}
			<div className={styles.grid}>
				{/* Input Panel */}
				<div className={styles.glassCard}>
					<div className={styles.cardHeader}>
						<h3 className={styles.cardTitle}>{mode === "text-to-binary" ? "Text Input" : "Binary Input"}</h3>
						<div className={styles.buttonGroup}>
							<button onClick={handleClear} className={styles.btnSecondary} disabled={!inputText}>
								<TrashIcon className={styles.btnIcon} />
								Clear
							</button>
						</div>
					</div>

					<textarea
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						placeholder={mode === "text-to-binary" ? "Enter text to convert to binary..." : "Enter binary to convert to text (e.g., 01001000 01101001)..."}
						className={styles.textarea}
						spellCheck={false}
					/>

					<div className={styles.cardFooter}>
						<span>
							{mode === "text-to-binary" ? `${stats.charCount} characters` : `${stats.byteCount} bytes`}
						</span>
					</div>
				</div>

				{/* Swap Button */}
				<div className={styles.swapContainer}>
					<button onClick={handleSwap} className={styles.swapButton} title="Swap conversion direction">
						<ArrowsRightLeftIcon className={styles.swapIcon} />
					</button>
				</div>

				{/* Output Panel */}
				<div className={styles.glassCard}>
					<div className={styles.cardHeader}>
						<h3 className={styles.cardTitle}>{mode === "text-to-binary" ? "Binary Output" : "Text Output"}</h3>
						<div className={styles.buttonGroup}>
							<button
								onClick={() => handleCopy(outputText, "output")}
								className={`${styles.btnPrimary} ${copiedField === "output" ? styles.copied : ""}`}
								disabled={!outputText}
							>
								{copiedField === "output" ? (
									<>
										<CheckIcon className={styles.btnIcon} />
										Copied!
									</>
								) : (
									<>
										<ClipboardDocumentIcon className={styles.btnIcon} />
										Copy
									</>
								)}
							</button>
						</div>
					</div>

					<textarea value={outputText} readOnly placeholder="Output will appear here..." className={`${styles.textarea} ${styles.readOnly}`} spellCheck={false} />

					<div className={styles.cardFooter}>
						<span>
							{mode === "text-to-binary" ? `${stats.byteCount} bytes` : `${stats.charCount} characters`}
						</span>
					</div>
				</div>
			</div>

			{/* Info Section */}
			<div className={styles.glassCard}>
				<h3 className={styles.infoTitle}>About Binary Encoding</h3>

				<div className={styles.infoGrid}>
					<div>
						<h4 className={styles.infoSubtitle}>What is Binary?</h4>
						<p className={styles.infoText}>
							Binary is the fundamental language of computers, using only two digits: 0 and 1. Each character in text is represented by a sequence of these bits, typically 8 bits (1 byte) for ASCII characters.
						</p>
					</div>
					<div>
						<h4 className={styles.infoSubtitle}>ASCII vs UTF-8</h4>
						<p className={styles.infoText}>
							ASCII uses 7 bits to represent 128 characters (English letters, digits, symbols). UTF-8 extends this to support all Unicode characters, using 1-4 bytes per character for international text and emojis.
						</p>
					</div>
					<div>
						<h4 className={styles.infoSubtitle}>Common Use Cases</h4>
						<ul className={styles.infoList}>
							<li>Learning how computers store data</li>
							<li>Debugging and data analysis</li>
							<li>Encoding messages for fun</li>
							<li>Understanding network protocols</li>
						</ul>
					</div>
					<div>
						<h4 className={styles.infoSubtitle}>Example</h4>
						<p className={styles.infoText}>
							The word &quot;Hi&quot; in binary:
							<br />
							<code className={styles.codeExample}>H = 01001000</code>
							<br />
							<code className={styles.codeExample}>i = 01101001</code>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
