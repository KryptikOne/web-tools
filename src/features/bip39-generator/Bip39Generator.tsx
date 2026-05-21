"use client";

import { useCallback, useState } from "react";
import {
	generateMnemonic,
	mnemonicToEntropy,
	mnemonicToSeed,
	validateMnemonic,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import {
	ArrowPathIcon,
	CheckCircleIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./Bip39Generator.module.scss";

type Strength = 128 | 160 | 192 | 224 | 256;
type Mode = "generate" | "validate";

const STRENGTHS: { value: Strength; words: number }[] = [
	{ value: 128, words: 12 },
	{ value: 160, words: 15 },
	{ value: 192, words: 18 },
	{ value: 224, words: 21 },
	{ value: 256, words: 24 },
];

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export default function Bip39Generator() {
	const [mode, setMode] = useState<Mode>("generate");
	const [strength, setStrength] = useState<Strength>(128);
	const [mnemonic, setMnemonic] = useState("");
	const [busy, setBusy] = useState(false);

	const [validateInput, setValidateInput] = useState("");
	const [validation, setValidation] = useState<{
		valid: boolean;
		entropy?: string;
		seed?: string;
		error?: string;
	} | null>(null);

	const { copy, isCopied } = useClipboard();

	const handleGenerate = useCallback(() => {
		const m = generateMnemonic(wordlist, strength);
		setMnemonic(m);
	}, [strength]);

	const handleValidate = useCallback(async () => {
		const cleaned = validateInput.trim().replace(/\s+/g, " ").toLowerCase();
		if (!cleaned) {
			setValidation(null);
			return;
		}
		const ok = validateMnemonic(cleaned, wordlist);
		if (!ok) {
			setValidation({ valid: false, error: "Invalid mnemonic (bad checksum or unknown word)." });
			return;
		}
		setBusy(true);
		try {
			const entropy = mnemonicToEntropy(cleaned, wordlist);
			const seed = await mnemonicToSeed(cleaned);
			setValidation({
				valid: true,
				entropy: bytesToHex(entropy),
				seed: bytesToHex(seed),
			});
		} catch (err) {
			setValidation({
				valid: false,
				error: err instanceof Error ? err.message : "Failed to derive seed.",
			});
		} finally {
			setBusy(false);
		}
	}, [validateInput]);

	const words = mnemonic ? mnemonic.split(" ") : [];

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
					onClick={() => setMode("validate")}
					className={`${styles.tab} ${mode === "validate" ? styles.activeTab : ""}`}
					type="button"
				>
					Validate
				</button>
			</div>

			{mode === "generate" && (
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Generate mnemonic</h2>

					<label
						className={`block text-sm font-medium mb-2 ${styles.label}`}
						htmlFor="bip39-strength"
					>
						Entropy strength
					</label>
					<select
						id="bip39-strength"
						value={strength}
						onChange={(e) => setStrength(parseInt(e.target.value, 10) as Strength)}
						className={styles.select}
					>
						{STRENGTHS.map((s) => (
							<option key={s.value} value={s.value}>
								{s.value} bits — {s.words} words
							</option>
						))}
					</select>

					<button
						onClick={handleGenerate}
						className={`mt-5 gap-2 ${styles.btnPrimary}`}
						type="button"
					>
						<ArrowPathIcon className="w-4 h-4" />
						Generate
					</button>

					{mnemonic && (
						<div className="mt-5">
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.label}`}>Mnemonic</label>
								<button
									onClick={() => copy(mnemonic, "mnemonic")}
									className={`gap-2 ${styles.btnSecondary}`}
									type="button"
								>
									{isCopied("mnemonic") ? (
										<ClipboardDocumentCheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
									{isCopied("mnemonic") ? "Copied!" : "Copy"}
								</button>
							</div>
							<div className={styles.wordGrid}>
								{words.map((w, i) => (
									<div key={`${w}-${i}`} className={styles.wordChip}>
										<span className={styles.wordIndex}>{i + 1}</span>
										<span className={styles.wordText}>{w}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{mode === "validate" && (
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Validate mnemonic</h2>

					<label
						className={`block text-sm font-medium mb-2 ${styles.label}`}
						htmlFor="bip39-validate"
					>
						Mnemonic
					</label>
					<textarea
						id="bip39-validate"
						value={validateInput}
						onChange={(e) => setValidateInput(e.target.value)}
						placeholder="word1 word2 word3 …"
						className={styles.textarea}
						spellCheck={false}
					/>

					<button
						onClick={handleValidate}
						disabled={busy}
						className={`mt-4 gap-2 ${styles.btnPrimary}`}
						type="button"
					>
						{busy ? (
							<>
								<span className={styles.spinner} aria-hidden="true" />
								Validating…
							</>
						) : (
							"Validate"
						)}
					</button>

					{validation && (
						<>
							{validation.valid ? (
								<div className={`mt-4 p-4 ${styles.resultBox} ${styles.match}`}>
									<div className="flex items-center gap-3 mb-3">
										<CheckCircleIcon className="w-6 h-6" />
										<p className="font-semibold">Valid mnemonic</p>
									</div>
									<div className="mt-3">
										<div className="flex justify-between items-center mb-1">
											<span className={`text-sm ${styles.label}`}>Entropy (hex)</span>
											<button
												onClick={() => copy(validation.entropy ?? "", "entropy")}
												className={`gap-2 ${styles.btnSecondary}`}
												type="button"
											>
												{isCopied("entropy") ? (
													<ClipboardDocumentCheckIcon className="w-4 h-4" />
												) : (
													<ClipboardDocumentIcon className="w-4 h-4" />
												)}
												{isCopied("entropy") ? "Copied!" : "Copy"}
											</button>
										</div>
										<code className={styles.codeBlock}>{validation.entropy}</code>
									</div>
									<div className="mt-3">
										<div className="flex justify-between items-center mb-1">
											<span className={`text-sm ${styles.label}`}>Seed (hex, 64 bytes)</span>
											<button
												onClick={() => copy(validation.seed ?? "", "seed")}
												className={`gap-2 ${styles.btnSecondary}`}
												type="button"
											>
												{isCopied("seed") ? (
													<ClipboardDocumentCheckIcon className="w-4 h-4" />
												) : (
													<ClipboardDocumentIcon className="w-4 h-4" />
												)}
												{isCopied("seed") ? "Copied!" : "Copy"}
											</button>
										</div>
										<code className={styles.codeBlock}>{validation.seed}</code>
									</div>
								</div>
							) : (
								<div className={`mt-4 flex items-center gap-3 p-4 ${styles.resultBox} ${styles.noMatch}`}>
									<XCircleIcon className="w-6 h-6 flex-shrink-0" />
									<div>
										<p className="font-semibold">Invalid mnemonic</p>
										<p className="text-sm opacity-80">{validation.error}</p>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>About BIP39</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					BIP39 specifies how to encode random entropy as a human-readable mnemonic from a fixed list of
					2048 English words, with a built-in checksum. The mnemonic plus an optional passphrase derives a
					512-bit seed used to generate hierarchical deterministic wallets (BIP32). All operations run
					locally — never share your mnemonic.
				</p>
			</div>
		</div>
	);
}
