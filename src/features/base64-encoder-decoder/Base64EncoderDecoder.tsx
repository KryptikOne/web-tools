"use client";

import { useState, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./Base64EncoderDecoder.module.scss";
import { encodeToBase64, decodeFromBase64 } from "@/lib/base64Utils";

type Mode = "encode" | "decode";

export default function Base64EncoderDecoder() {
	const [mode, setMode] = useState<Mode>("encode");
	const [inputText, setInputText] = useState("");
	const [urlSafe, setUrlSafe] = useState(false);
	const [lineBreaks, setLineBreaks] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const result = useMemo(() => {
		if (!inputText) return { output: "", error: null };

		try {
			if (mode === "encode") {
				return { output: encodeToBase64(inputText, urlSafe, lineBreaks), error: null };
			} else {
				return { output: decodeFromBase64(inputText, urlSafe), error: null };
			}
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Invalid input",
			};
		}
	}, [inputText, mode, urlSafe, lineBreaks]);

	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleClear = () => {
		setInputText("");
	};

	return (
		<div className={styles.container}>
			{/* Mode Tabs */}
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => { setMode("encode"); setInputText(""); }}
					className={`${styles.tab} ${mode === "encode" ? styles.activeTab : ""}`}
				>
					Encode
				</button>
				<button
					onClick={() => { setMode("decode"); setInputText(""); }}
					className={`${styles.tab} ${mode === "decode" ? styles.activeTab : ""}`}
				>
					Decode
				</button>
			</div>

			{/* Options */}
			<div className={`flex flex-wrap gap-6 mb-6 p-4 ${styles.optionsBar}`}>
				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
					<input
						type="checkbox"
						checked={urlSafe}
						onChange={(e) => setUrlSafe(e.target.checked)}
						className={styles.checkbox}
					/>
					URL-safe Base64
				</label>
				{mode === "encode" && (
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={lineBreaks}
							onChange={(e) => setLineBreaks(e.target.checked)}
							className={styles.checkbox}
						/>
						MIME line breaks (76 chars)
					</label>
				)}
			</div>

			{/* Input Panel */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
					</h3>
					<div className="flex gap-2">
						<button
							onClick={handleClear}
							className={styles.btnSecondary}
							disabled={!inputText}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				</div>

				<textarea
					value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					placeholder={
						mode === "encode"
							? "Enter text to encode to Base64..."
							: "Enter Base64 string to decode..."
					}
					className={styles.textarea}
					spellCheck={false}
				/>

				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{inputText.length} characters</span>
				</div>
			</div>

			{/* Error Display */}
			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{/* Output Panel */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							{mode === "encode" ? "Base64 Output" : "Decoded Text"}
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							{mode === "encode"
								? urlSafe
									? "URL-safe Base64 encoded (uses - and _ instead of + and /)"
									: "Standard Base64 encoded with UTF-8 support"
								: urlSafe
									? "Decoded from URL-safe Base64"
									: "Decoded from standard Base64 with UTF-8 support"}
						</p>
					</div>
					<button
						onClick={() => handleCopy(result.output, "output")}
						className={`${styles.btnPrimary} ${copiedField === "output" ? styles.copied : ""}`}
						disabled={!result.output}
					>
						{copiedField === "output" ? (
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
					placeholder="Output will appear here..."
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>

				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{result.output.length} characters</span>
				</div>
			</div>

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About Base64 Encoding
				</h3>

				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>What is Base64?</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Base64 is a binary-to-text encoding scheme that represents binary data as an ASCII string.
							It uses 64 characters (<code>A-Z</code>, <code>a-z</code>, <code>0-9</code>, <code>+</code>, <code>/</code>)
							plus <code>=</code> for padding. It&apos;s commonly used to embed data in text-based formats like JSON, XML, or HTML.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>URL-safe Base64</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							URL-safe Base64 replaces <code>+</code> with <code>-</code> and <code>/</code> with <code>_</code>,
							and omits padding <code>=</code> characters. This variant is safe to use directly in URLs and filenames
							without additional percent-encoding.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Common Use Cases</h4>
						<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
							<li>Embedding data in JSON or XML</li>
							<li>Encoding email attachments (MIME)</li>
							<li>Data URIs in HTML/CSS</li>
							<li>Storing binary data in text fields</li>
							<li>HTTP Basic Authentication headers</li>
						</ul>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>UTF-8 Support</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							This tool uses <code>TextEncoder</code> and <code>TextDecoder</code> to properly handle
							multi-byte UTF-8 characters (emoji, CJK characters, accented letters, etc.)
							that the native <code>btoa()</code> and <code>atob()</code> functions cannot handle alone.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
