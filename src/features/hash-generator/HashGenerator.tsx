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

// ─── Pure-JS MD5 Implementation ─────────────────────────────────────────────
// Web Crypto API does not support MD5, so we implement it directly.

function md5(input: Uint8Array): string {
	function leftRotate(x: number, c: number): number {
		return (x << c) | (x >>> (32 - c));
	}

	const s: number[] = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
		5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
		4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
		6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
	];

	const K: number[] = [
		0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
		0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
		0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
		0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
		0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
		0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
		0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
		0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
		0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
		0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
		0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
		0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
		0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
		0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
		0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
		0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
	];

	// Pre-processing: adding padding bits
	const originalLength = input.length;
	const bitLength = originalLength * 8;

	// Append 0x80 byte, then pad to 56 mod 64, then append 8-byte length
	let paddedLength = originalLength + 1;
	while (paddedLength % 64 !== 56) {
		paddedLength++;
	}
	paddedLength += 8;

	const padded = new Uint8Array(paddedLength);
	padded.set(input);
	padded[originalLength] = 0x80;

	// Append original length in bits as 64-bit little-endian
	const view = new DataView(padded.buffer);
	view.setUint32(paddedLength - 8, bitLength & 0xffffffff, true);
	view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

	// Initialize hash values
	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	// Process each 512-bit chunk
	for (let offset = 0; offset < paddedLength; offset += 64) {
		const M = new Uint32Array(16);
		for (let j = 0; j < 16; j++) {
			M[j] = view.getUint32(offset + j * 4, true);
		}

		let A = a0;
		let B = b0;
		let C = c0;
		let D = d0;

		for (let i = 0; i < 64; i++) {
			let F: number;
			let g: number;

			if (i < 16) {
				F = (B & C) | (~B & D);
				g = i;
			} else if (i < 32) {
				F = (D & B) | (~D & C);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				F = B ^ C ^ D;
				g = (3 * i + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = (7 * i) % 16;
			}

			F = (F + A + K[i] + M[g]) | 0;
			A = D;
			D = C;
			C = B;
			B = (B + leftRotate(F, s[i])) | 0;
		}

		a0 = (a0 + A) | 0;
		b0 = (b0 + B) | 0;
		c0 = (c0 + C) | 0;
		d0 = (d0 + D) | 0;
	}

	// Output as little-endian hex
	const result = new Uint8Array(16);
	const out = new DataView(result.buffer);
	out.setUint32(0, a0, true);
	out.setUint32(4, b0, true);
	out.setUint32(8, c0, true);
	out.setUint32(12, d0, true);

	return Array.from(result)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

// ─── Types ──────────────────────────────────────────────────────────────────

type OutputFormat = "hex" | "base64";

interface HashResult {
	algorithm: string;
	hash: string;
}

const ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function arrayBufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

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
