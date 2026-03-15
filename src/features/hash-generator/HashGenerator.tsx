"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
	DocumentArrowUpIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./HashGenerator.module.scss";
import { md5, arrayBufferToHex, arrayBufferToBase64, hexToBytes } from "@/lib/hashUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

type OutputFormat = "hex" | "base64";

interface HashResult {
	algorithm: string;
	hash: string;
}

const ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

// ─── Component ──────────────────────────────────────────────────────────────

export default function HashGenerator() {
	const [inputText, setInputText] = useState("");
	const [hashes, setHashes] = useState<HashResult[]>([]);
	const [outputFormat, setOutputFormat] = useState<OutputFormat>("hex");
	const [uppercase, setUppercase] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Generate hashes for given bytes
	const generateHashes = useCallback(
		async (data: Uint8Array): Promise<HashResult[]> => {
			const results: HashResult[] = [];

			// MD5 (pure JS)
			const md5Hex = md5(data);
			if (outputFormat === "base64") {
				results.push({ algorithm: "MD5", hash: arrayBufferToBase64(hexToBytes(md5Hex).buffer as ArrayBuffer) });
			} else {
				results.push({ algorithm: "MD5", hash: uppercase ? md5Hex.toUpperCase() : md5Hex });
			}

			// Web Crypto algorithms
			const webCryptoAlgos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
			for (const algo of webCryptoAlgos) {
				try {
					const hashBuffer = await crypto.subtle.digest(algo, new Uint8Array(data));
					if (outputFormat === "base64") {
						results.push({ algorithm: algo, hash: arrayBufferToBase64(hashBuffer) });
					} else {
						const hex = arrayBufferToHex(hashBuffer);
						results.push({ algorithm: algo, hash: uppercase ? hex.toUpperCase() : hex });
					}
				} catch {
					results.push({ algorithm: algo, hash: "Error computing hash" });
				}
			}

			return results;
		},
		[outputFormat, uppercase]
	);

	// Recompute hashes whenever input, format, or case changes
	useEffect(() => {
		let cancelled = false;

		const source = fileBytes ?? new TextEncoder().encode(inputText);
		if (source.length === 0 && !fileBytes) {
			setHashes([]);
			return;
		}

		setIsProcessing(true);

		generateHashes(source).then((results) => {
			if (!cancelled) {
				setHashes(results);
				setIsProcessing(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [inputText, fileBytes, generateHashes]);

	// File upload handler
	const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setFileName(file.name);
		setInputText("");

		const reader = new FileReader();
		reader.onload = () => {
			const arrayBuffer = reader.result as ArrayBuffer;
			setFileBytes(new Uint8Array(arrayBuffer));
		};
		reader.readAsArrayBuffer(file);
	}, []);

	// Clear file
	const clearFile = useCallback(() => {
		setFileName(null);
		setFileBytes(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, []);

	// Clear everything
	const handleClear = useCallback(() => {
		setInputText("");
		setHashes([]);
		clearFile();
	}, [clearFile]);

	// Copy hash to clipboard
	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const hasInput = inputText.length > 0 || fileBytes !== null;

	return (
		<div className={styles.container}>
			{/* Options Bar */}
			<div className={`flex flex-wrap items-center gap-6 px-6 py-4 mb-6 ${styles.optionsBar}`}>
				<div className="flex items-center gap-2">
					<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>Format</label>
					<div className="flex gap-1">
						<button
							onClick={() => setOutputFormat("hex")}
							className={`${styles.btnPreset} ${outputFormat === "hex" ? styles.active : ""}`}
						>
							Hex
						</button>
						<button
							onClick={() => setOutputFormat("base64")}
							className={`${styles.btnPreset} ${outputFormat === "base64" ? styles.active : ""}`}
						>
							Base64
						</button>
					</div>
				</div>

				{outputFormat === "hex" && (
					<div className="flex items-center gap-2">
						<label className={`text-sm font-medium whitespace-nowrap ${styles.optionLabel}`}>Case</label>
						<div className="flex gap-1">
							<button
								onClick={() => setUppercase(false)}
								className={`${styles.btnPreset} ${!uppercase ? styles.active : ""}`}
							>
								lowercase
							</button>
							<button
								onClick={() => setUppercase(true)}
								className={`${styles.btnPreset} ${uppercase ? styles.active : ""}`}
							>
								UPPERCASE
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Input Section */}
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between mb-4 flex-wrap gap-4">
					<h2 className={styles.sectionTitle} style={{ margin: 0 }}>
						Input
					</h2>
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => fileInputRef.current?.click()}
							className={styles.btnPrimary}
						>
							<DocumentArrowUpIcon className="w-4 h-4" />
							Upload File
						</button>
						{hasInput && (
							<button onClick={handleClear} className={styles.btnSecondary}>
								<TrashIcon className="w-4 h-4" />
								Clear
							</button>
						)}
					</div>
					<input
						ref={fileInputRef}
						type="file"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload file to hash"
					/>
				</div>

				{fileName ? (
					<div className={`flex items-center gap-3 p-4 ${styles.fileIndicator}`}>
						<DocumentArrowUpIcon className="w-5 h-5 flex-shrink-0" />
						<span className="text-sm font-medium truncate">{fileName}</span>
						<button
							onClick={clearFile}
							className={`ml-auto ${styles.btnSecondary}`}
							style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
						>
							Remove
						</button>
					</div>
				) : (
					<textarea
						value={inputText}
						onChange={(e) => {
							setInputText(e.target.value);
							clearFile();
						}}
						placeholder="Enter text to hash, or upload a file..."
						className={styles.textarea}
						spellCheck={false}
					/>
				)}
			</div>

			{/* Hash Results */}
			{hasInput && (
				<div className={`mt-6 ${styles.glassCard}`}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={styles.sectionTitle} style={{ margin: 0 }}>
							Hash Results
						</h2>
						{isProcessing && (
							<ArrowPathIcon className={`w-5 h-5 ${styles.spinner}`} />
						)}
					</div>

					<div className="flex flex-col gap-3">
						{ALGORITHMS.map((algo) => {
							const result = hashes.find((h) => h.algorithm === algo);
							const hashValue = result?.hash ?? "Computing...";

							return (
								<div key={algo} className={styles.hashRow}>
									<div className={`flex items-center justify-between gap-4 ${styles.hashRowInner}`}>
										<span className={styles.hashLabel}>{algo}</span>
										<div className="flex items-center gap-2 min-w-0 flex-1">
											<code className={`text-sm truncate flex-1 text-right ${styles.hashValue}`}>
												{hashValue}
											</code>
											<button
												onClick={() => handleCopy(hashValue, algo)}
												className={`${styles.copyBtn} ${copiedField === algo ? styles.copied : ""}`}
												title={`Copy ${algo} hash`}
												disabled={!result}
											>
												{copiedField === algo ? (
													<CheckIcon className={styles.copyIcon} />
												) : (
													<ClipboardDocumentIcon className={styles.copyIcon} />
												)}
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>About Hash Functions</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>What is Hashing?</h3>
						<p className={styles.infoText}>
							A hash function takes an input of any size and produces a fixed-size output (the hash or digest). The same input always produces the same hash, but even a small change in the input results in a completely different hash.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>MD5</h3>
						<p className={styles.infoText}>
							MD5 produces a 128-bit (16-byte) hash. It is fast but considered cryptographically broken. Still commonly used for checksums and non-security file integrity verification.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>SHA Family</h3>
						<p className={styles.infoText}>
							SHA-1 (160-bit) is deprecated for security use. SHA-256 and SHA-512 (from the SHA-2 family) are widely used in TLS, digital signatures, and blockchain. SHA-384 is a truncated variant of SHA-512.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Output Formats</h3>
						<p className={styles.infoText}>
							<code>Hexadecimal</code> is the most common representation, using characters 0-9 and a-f. <code>Base64</code> encodes the same bytes more compactly using A-Z, a-z, 0-9, +, and /.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
