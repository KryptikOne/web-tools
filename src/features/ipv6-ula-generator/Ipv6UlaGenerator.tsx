"use client";

import { useCallback, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./Ipv6UlaGenerator.module.scss";
import { getRandomBytes } from "@/lib/randomUtils";
import { useClipboard } from "@/hooks/useClipboard";

interface UlaResult {
	globalId: string;
	subnetId: string;
	prefix48: string;
	prefix64: string;
}

function bytesToHex(bytes: Uint8Array): string {
	let h = "";
	for (const b of bytes) h += b.toString(16).padStart(2, "0");
	return h;
}

function formatPrefix48(globalIdHex10: string): string {
	const g = globalIdHex10.toLowerCase();
	return `fd${g.slice(0, 2)}:${g.slice(2, 6)}:${g.slice(6, 10)}::/48`;
}

function formatPrefix64(globalIdHex10: string, subnetIdHex4: string): string {
	const g = globalIdHex10.toLowerCase();
	const s = subnetIdHex4.toLowerCase();
	return `fd${g.slice(0, 2)}:${g.slice(2, 6)}:${g.slice(6, 10)}:${s}::/64`;
}

function randomHex(byteCount: number): string {
	return bytesToHex(getRandomBytes(byteCount));
}

function validateHex(s: string, length: number, label: string): string {
	const cleaned = s.trim().replace(/:/g, "").toLowerCase();
	if (cleaned.length !== length || !/^[0-9a-f]+$/.test(cleaned)) {
		throw new Error(`${label} must be exactly ${length} hex characters`);
	}
	return cleaned;
}

export default function Ipv6UlaGenerator() {
	const [useExplicitGlobalId, setUseExplicitGlobalId] = useState(false);
	const [globalIdInput, setGlobalIdInput] = useState("");
	const [subnetIdInput, setSubnetIdInput] = useState("0001");
	const [result, setResult] = useState<UlaResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	const handleGenerate = useCallback(() => {
		setError(null);
		try {
			const globalId = useExplicitGlobalId
				? validateHex(globalIdInput, 10, "Global ID")
				: randomHex(5);
			const subnetId = subnetIdInput.trim()
				? validateHex(subnetIdInput, 4, "Subnet ID")
				: "0000";
			setResult({
				globalId,
				subnetId,
				prefix48: formatPrefix48(globalId),
				prefix64: formatPrefix64(globalId, subnetId),
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate");
			setResult(null);
		}
	}, [useExplicitGlobalId, globalIdInput, subnetIdInput]);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>ULA Options</h3>

				<div className={`flex flex-wrap gap-6 mb-4 p-4 ${styles.optionsBar}`}>
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={useExplicitGlobalId}
							onChange={(e) => setUseExplicitGlobalId(e.target.checked)}
							className={styles.checkbox}
						/>
						Use explicit Global ID (instead of random)
					</label>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="global-id" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							Global ID (10 hex chars, 40 bits)
						</label>
						<input
							id="global-id"
							type="text"
							value={globalIdInput}
							onChange={(e) => setGlobalIdInput(e.target.value)}
							placeholder="random 40-bit value"
							disabled={!useExplicitGlobalId}
							className={styles.input}
							spellCheck={false}
						/>
					</div>
					<div>
						<label htmlFor="subnet-id" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							Subnet ID (4 hex chars, 16 bits)
						</label>
						<input
							id="subnet-id"
							type="text"
							value={subnetIdInput}
							onChange={(e) => setSubnetIdInput(e.target.value)}
							placeholder="0001"
							className={styles.input}
							spellCheck={false}
						/>
					</div>
				</div>

				<div className="mt-4">
					<button onClick={handleGenerate} className={styles.btnPrimary}>
						<ArrowPathIcon className="w-4 h-4" />
						Generate ULA
					</button>
				</div>
			</div>

			{error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>{error}</div>
			)}

			{result && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Generated ULA</h3>
					<div className={styles.resultGrid}>
						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>/48 Prefix</span>
							<div className={styles.resultValueWrap}>
								<code className={`${styles.resultValue} ${styles.highlight}`}>{result.prefix48}</code>
								<button
									onClick={() => copy(result.prefix48, "p48")}
									className={`${styles.copyBtn} ${isCopied("p48") ? styles.copied : ""}`}
									aria-label="Copy /48 prefix"
									title="Copy"
								>
									{isCopied("p48") ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>/64 Subnet</span>
							<div className={styles.resultValueWrap}>
								<code className={`${styles.resultValue} ${styles.highlight}`}>{result.prefix64}</code>
								<button
									onClick={() => copy(result.prefix64, "p64")}
									className={`${styles.copyBtn} ${isCopied("p64") ? styles.copied : ""}`}
									aria-label="Copy /64 subnet"
									title="Copy"
								>
									{isCopied("p64") ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>Global ID</span>
							<div className={styles.resultValueWrap}>
								<code className={styles.resultValue}>{result.globalId}</code>
								<button
									onClick={() => copy(result.globalId, "gid")}
									className={`${styles.copyBtn} ${isCopied("gid") ? styles.copied : ""}`}
									aria-label="Copy Global ID"
									title="Copy"
								>
									{isCopied("gid") ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>Subnet ID</span>
							<div className={styles.resultValueWrap}>
								<code className={styles.resultValue}>{result.subnetId}</code>
								<button
									onClick={() => copy(result.subnetId, "sid")}
									className={`${styles.copyBtn} ${isCopied("sid") ? styles.copied : ""}`}
									aria-label="Copy Subnet ID"
									title="Copy"
								>
									{isCopied("sid") ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About IPv6 ULAs (RFC 4193)</h3>
				<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>What is a ULA?</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							A Unique Local Address is an IPv6 address (<code>fc00::/7</code>) intended for local communications within a site, similar in spirit to RFC 1918 private IPv4 ranges. The <code>fd00::/8</code> half is for locally-assigned IDs.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Structure</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							<code>fd</code> (8 bits) + random Global ID (40 bits) + Subnet ID (16 bits) + Interface ID (64 bits) = 128-bit address. The random Global ID provides probabilistic uniqueness — RFC 4193 recommends generating it randomly so independent sites don&apos;t collide when merged.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
