"use client";

import { useState, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./UrlEncoderDecoder.module.scss";

type Mode = "encode" | "decode";

interface EncodingReference {
	char: string;
	encoded: string;
	description: string;
}

const COMMON_ENCODINGS: EncodingReference[] = [
	{ char: " ", encoded: "%20", description: "Space" },
	{ char: "!", encoded: "%21", description: "Exclamation mark" },
	{ char: "#", encoded: "%23", description: "Hash" },
	{ char: "$", encoded: "%24", description: "Dollar sign" },
	{ char: "&", encoded: "%26", description: "Ampersand" },
	{ char: "'", encoded: "%27", description: "Single quote" },
	{ char: "(", encoded: "%28", description: "Open parenthesis" },
	{ char: ")", encoded: "%29", description: "Close parenthesis" },
	{ char: "*", encoded: "%2A", description: "Asterisk" },
	{ char: "+", encoded: "%2B", description: "Plus sign" },
	{ char: ",", encoded: "%2C", description: "Comma" },
	{ char: "/", encoded: "%2F", description: "Forward slash" },
	{ char: ":", encoded: "%3A", description: "Colon" },
	{ char: ";", encoded: "%3B", description: "Semicolon" },
	{ char: "=", encoded: "%3D", description: "Equals sign" },
	{ char: "?", encoded: "%3F", description: "Question mark" },
	{ char: "@", encoded: "%40", description: "At sign" },
	{ char: "[", encoded: "%5B", description: "Open bracket" },
	{ char: "]", encoded: "%5D", description: "Close bracket" },
	{ char: "{", encoded: "%7B", description: "Open brace" },
	{ char: "}", encoded: "%7D", description: "Close brace" },
];

export default function UrlEncoderDecoder() {
	const [mode, setMode] = useState<Mode>("encode");
	const [inputText, setInputText] = useState("");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Encode results
	const encodeResults = useMemo(() => {
		if (mode !== "encode" || !inputText) {
			return { component: "", full: "", error: null };
		}
		try {
			return {
				component: encodeURIComponent(inputText),
				full: encodeURI(inputText),
				error: null,
			};
		} catch (err) {
			return {
				component: "",
				full: "",
				error: `Encoding error: ${err instanceof Error ? err.message : "Unknown error"}`,
			};
		}
	}, [mode, inputText]);

	// Decode results
	const decodeResults = useMemo(() => {
		if (mode !== "decode" || !inputText) {
			return { component: "", full: "", error: null };
		}
		let component = "";
		let full = "";
		let error: string | null = null;

		try {
			component = decodeURIComponent(inputText);
		} catch (err) {
			component = "";
			error = `decodeURIComponent error: ${err instanceof Error ? err.message : "Malformed URI component"}`;
		}

		try {
			full = decodeURI(inputText);
		} catch (err) {
			full = "";
			if (!error) {
				error = `decodeURI error: ${err instanceof Error ? err.message : "Malformed URI"}`;
			}
		}

		return { component, full, error };
	}, [mode, inputText]);

	const results = mode === "encode" ? encodeResults : decodeResults;

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

			{/* Input Panel */}
			<div className={styles.glassCard}>
				<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{mode === "encode" ? "Text to Encode" : "URL-Encoded Input"}
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
							? "Enter text to URL encode (e.g., Hello World! foo@bar.com?name=value)..."
							: "Enter URL-encoded string to decode (e.g., Hello%20World%21)..."
					}
					className={styles.textarea}
					spellCheck={false}
				/>

				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{inputText.length} characters</span>
				</div>
			</div>

			{/* Error Display */}
			{results.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{results.error}
				</div>
			)}

			{/* Output Panels */}
			<div className={`grid gap-4 mt-4 ${styles.outputGrid}`}>
				{/* encodeURIComponent / decodeURIComponent result */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<div>
							<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
								{mode === "encode" ? "encodeURIComponent()" : "decodeURIComponent()"}
							</h3>
							<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
								{mode === "encode"
									? "Encodes all special characters including :, /, ?, #, &, =, +, etc."
									: "Decodes a fully encoded URI component."}
							</p>
						</div>
						<button
							onClick={() => handleCopy(results.component, "component")}
							className={`${styles.btnPrimary} ${copiedField === "component" ? styles.copied : ""}`}
							disabled={!results.component}
						>
							{copiedField === "component" ? (
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
						value={results.component}
						readOnly
						placeholder="Output will appear here..."
						className={`${styles.textarea} ${styles.readOnly}`}
						spellCheck={false}
					/>
				</div>

				{/* encodeURI / decodeURI result */}
				<div className={styles.glassCard}>
					<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
						<div>
							<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
								{mode === "encode" ? "encodeURI()" : "decodeURI()"}
							</h3>
							<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
								{mode === "encode"
									? "Preserves URI-safe characters like :, /, ?, #, &, =, +, @, etc."
									: "Decodes a URI, preserving characters that don't need decoding."}
							</p>
						</div>
						<button
							onClick={() => handleCopy(results.full, "full")}
							className={`${styles.btnPrimary} ${copiedField === "full" ? styles.copied : ""}`}
							disabled={!results.full}
						>
							{copiedField === "full" ? (
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
						value={results.full}
						readOnly
						placeholder="Output will appear here..."
						className={`${styles.textarea} ${styles.readOnly}`}
						spellCheck={false}
					/>
				</div>
			</div>

			{/* Reference Table */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					Common URL Encoding Reference
				</h3>

				<div className={styles.referenceTableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th className="text-left text-xs font-semibold">Character</th>
								<th className="text-left text-xs font-semibold">Encoded</th>
								<th className="text-left text-xs font-semibold">Description</th>
							</tr>
						</thead>
						<tbody>
							{COMMON_ENCODINGS.map((ref) => (
								<tr key={ref.encoded}>
									<td>
										<code className={styles.codeSnippet}>{ref.char}</code>
									</td>
									<td>
										<code className={styles.codeSnippet}>{ref.encoded}</code>
									</td>
									<td className={`text-sm ${styles.descriptionCell}`}>{ref.description}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About URL Encoding
				</h3>

				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>What is URL Encoding?</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							URL encoding (percent-encoding) replaces unsafe characters in URLs with a <code>%</code> followed by two hexadecimal digits representing the character&apos;s ASCII value. This ensures URLs are transmitted correctly across the internet.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>encodeURI vs encodeURIComponent</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							<code>encodeURI()</code> encodes a full URI but preserves characters like <code>:</code>, <code>/</code>, <code>?</code>, and <code>#</code> that have special meaning in URLs. <code>encodeURIComponent()</code> encodes everything, making it ideal for query parameter values.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>When to Use Which</h4>
						<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
							<li>Use <code>encodeURIComponent()</code> for query parameter values</li>
							<li>Use <code>encodeURI()</code> for encoding a full URL string</li>
							<li>Use <code>decodeURIComponent()</code> to decode individual values</li>
							<li>Use <code>decodeURI()</code> to decode a complete URL</li>
						</ul>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Example</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Input: <code>https://example.com/path?q=hello world&lang=en</code>
							<br />
							<code className={`inline-block mt-1 ${styles.codeExample}`}>
								encodeURI: https://example.com/path?q=hello%20world&lang=en
							</code>
							<br />
							<code className={`inline-block mt-1 ${styles.codeExample}`}>
								encodeURIComponent: https%3A%2F%2Fexample.com%2Fpath%3Fq%3Dhello%20world%26lang%3Den
							</code>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
