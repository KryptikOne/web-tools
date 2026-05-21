"use client";

import { useCallback, useState } from "react";
import bcrypt from "bcryptjs";
import {
	ArrowPathIcon,
	CheckCircleIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
	ExclamationTriangleIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./BcryptTool.module.scss";

type Mode = "generate" | "verify";

export default function BcryptTool() {
	const [mode, setMode] = useState<Mode>("generate");

	// Generate state
	const [genInput, setGenInput] = useState("");
	const [cost, setCost] = useState(10);
	const [genHash, setGenHash] = useState("");
	const [genBusy, setGenBusy] = useState(false);
	const [genError, setGenError] = useState<string | null>(null);

	// Verify state
	const [verInput, setVerInput] = useState("");
	const [verHash, setVerHash] = useState("");
	const [verBusy, setVerBusy] = useState(false);
	const [verResult, setVerResult] = useState<"match" | "no-match" | null>(null);
	const [verError, setVerError] = useState<string | null>(null);

	const { copy, isCopied } = useClipboard();

	const handleGenerate = useCallback(async () => {
		setGenError(null);
		setGenHash("");
		if (!genInput) {
			setGenError("Enter text to hash.");
			return;
		}
		setGenBusy(true);
		try {
			const salt = await bcrypt.genSalt(cost);
			const hash = await bcrypt.hash(genInput, salt);
			setGenHash(hash);
		} catch (err) {
			setGenError(err instanceof Error ? err.message : "Failed to hash input.");
		} finally {
			setGenBusy(false);
		}
	}, [genInput, cost]);

	const handleVerify = useCallback(async () => {
		setVerError(null);
		setVerResult(null);
		if (!verInput || !verHash) {
			setVerError("Provide both text and hash.");
			return;
		}
		setVerBusy(true);
		try {
			const ok = await bcrypt.compare(verInput, verHash);
			setVerResult(ok ? "match" : "no-match");
		} catch {
			setVerError("Invalid bcrypt hash format.");
		} finally {
			setVerBusy(false);
		}
	}, [verInput, verHash]);

	return (
		<div className={styles.container}>
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => setMode("generate")}
					className={`${styles.tab} ${mode === "generate" ? styles.activeTab : ""}`}
					type="button"
				>
					Generate
				</button>
				<button
					onClick={() => setMode("verify")}
					className={`${styles.tab} ${mode === "verify" ? styles.activeTab : ""}`}
					type="button"
				>
					Verify
				</button>
			</div>

			{mode === "generate" && (
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Generate bcrypt hash</h2>

					<label className={`block text-sm font-medium mb-2 ${styles.label}`} htmlFor="bcrypt-input">
						Plaintext
					</label>
					<input
						id="bcrypt-input"
						type="text"
						value={genInput}
						onChange={(e) => setGenInput(e.target.value)}
						placeholder="Text to hash"
						className={styles.inputField}
					/>

					<div className="mt-4">
						<div className="flex justify-between items-center mb-2">
							<label className={`text-sm font-medium ${styles.label}`} htmlFor="bcrypt-cost">
								Cost factor
							</label>
							<span className={`font-mono text-sm ${styles.value}`}>{cost}</span>
						</div>
						<input
							id="bcrypt-cost"
							type="range"
							min={4}
							max={15}
							value={cost}
							onChange={(e) => setCost(parseInt(e.target.value, 10))}
							className={styles.slider}
							aria-label="bcrypt cost factor"
						/>
					</div>

					{cost >= 13 && (
						<div className={`mt-3 flex items-start gap-2 text-xs ${styles.warningInline}`}>
							<ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
							<span>
								Cost {cost} can take several seconds and will block this tab during generation.
							</span>
						</div>
					)}

					<button
						onClick={handleGenerate}
						disabled={genBusy}
						className={`mt-5 gap-2 ${styles.btnPrimary}`}
						type="button"
					>
						{genBusy ? (
							<>
								<span className={styles.spinner} aria-hidden="true" />
								Hashing…
							</>
						) : (
							<>
								<ArrowPathIcon className="w-4 h-4" />
								Generate hash
							</>
						)}
					</button>

					{genError && (
						<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>{genError}</div>
					)}

					{genHash && (
						<div className="mt-5">
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.label}`}>Hash</label>
								<button
									onClick={() => copy(genHash, "hash")}
									className={`gap-2 ${styles.btnSecondary}`}
									type="button"
								>
									{isCopied("hash") ? (
										<ClipboardDocumentCheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
									{isCopied("hash") ? "Copied!" : "Copy"}
								</button>
							</div>
							<code className={styles.hashOutput}>{genHash}</code>
						</div>
					)}
				</div>
			)}

			{mode === "verify" && (
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Verify bcrypt hash</h2>

					<label className={`block text-sm font-medium mb-2 ${styles.label}`} htmlFor="bcrypt-verify-input">
						Plaintext
					</label>
					<input
						id="bcrypt-verify-input"
						type="text"
						value={verInput}
						onChange={(e) => setVerInput(e.target.value)}
						placeholder="Text to verify"
						className={styles.inputField}
					/>

					<label className={`block text-sm font-medium mb-2 mt-4 ${styles.label}`} htmlFor="bcrypt-verify-hash">
						Existing hash
					</label>
					<textarea
						id="bcrypt-verify-hash"
						value={verHash}
						onChange={(e) => setVerHash(e.target.value)}
						placeholder="$2a$10$..."
						className={styles.textarea}
						spellCheck={false}
					/>

					<button
						onClick={handleVerify}
						disabled={verBusy}
						className={`mt-5 gap-2 ${styles.btnPrimary}`}
						type="button"
					>
						{verBusy ? (
							<>
								<span className={styles.spinner} aria-hidden="true" />
								Verifying…
							</>
						) : (
							"Verify"
						)}
					</button>

					{verError && (
						<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>{verError}</div>
					)}

					{verResult === "match" && (
						<div className={`mt-4 flex items-center gap-3 p-4 ${styles.resultBox} ${styles.match}`}>
							<CheckCircleIcon className="w-6 h-6" />
							<div>
								<p className="font-semibold">Match</p>
								<p className="text-sm opacity-80">The plaintext matches the given hash.</p>
							</div>
						</div>
					)}

					{verResult === "no-match" && (
						<div className={`mt-4 flex items-center gap-3 p-4 ${styles.resultBox} ${styles.noMatch}`}>
							<XCircleIcon className="w-6 h-6" />
							<div>
								<p className="font-semibold">No match</p>
								<p className="text-sm opacity-80">The plaintext does not match the given hash.</p>
							</div>
						</div>
					)}
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>About bcrypt</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					bcrypt is an adaptive password-hashing function based on Blowfish. The cost factor controls how
					many internal rounds are performed — doubling it doubles the work. Higher costs are more resistant
					to brute force but take noticeably longer to compute. Hashing runs locally; your input never leaves
					the browser.
				</p>
			</div>
		</div>
	);
}
