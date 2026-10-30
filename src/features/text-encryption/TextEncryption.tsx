"use client";

import { useCallback, useState } from "react";
import {
	ArrowPathIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { encryptText, decryptText } from "@/lib/cryptoUtils";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./TextEncryption.module.scss";

type Mode = "encrypt" | "decrypt";

export default function TextEncryption() {
	const [mode, setMode] = useState<Mode>("encrypt");
	const [input, setInput] = useState("");
	const [passphrase, setPassphrase] = useState("");
	const [output, setOutput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [showPass, setShowPass] = useState(false);
	const { copy, isCopied } = useClipboard();

	const handleRun = useCallback(async () => {
		setError(null);
		setOutput("");
		if (!input) {
			setError("Provide some text.");
			return;
		}
		if (!passphrase) {
			setError("Provide a passphrase.");
			return;
		}
		setBusy(true);
		try {
			if (mode === "encrypt") {
				const result = await encryptText(input, passphrase);
				setOutput(result);
			} else {
				const result = await decryptText(input.trim(), passphrase);
				setOutput(result);
			}
		} catch (err) {
			setError(
				mode === "decrypt"
					? "Wrong passphrase or corrupt data."
					: err instanceof Error
						? err.message
						: "Encryption failed."
			);
		} finally {
			setBusy(false);
		}
	}, [mode, input, passphrase]);

	const switchMode = (next: Mode) => {
		setMode(next);
		setInput("");
		setOutput("");
		setError(null);
	};

	return (
		<div className={styles.container}>
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => switchMode("encrypt")}
					className={`${styles.tab} ${mode === "encrypt" ? styles.activeTab : ""}`}
					type="button"
				>
					Encrypt
				</button>
				<button
					onClick={() => switchMode("decrypt")}
					className={`${styles.tab} ${mode === "decrypt" ? styles.activeTab : ""}`}
					type="button"
				>
					Decrypt
				</button>
			</div>

			<div className={styles.glassCard}>
				<label
					className={`block text-sm font-medium mb-2 ${styles.label}`}
					htmlFor="encryption-input"
				>
					{mode === "encrypt" ? "Plaintext" : "Ciphertext (base64)"}
				</label>
				<textarea
					id="encryption-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={mode === "encrypt" ? "Type or paste text…" : "Paste base64 ciphertext…"}
					className={styles.textarea}
					spellCheck={false}
				/>

				<label
					className={`block text-sm font-medium mt-4 mb-2 ${styles.label}`}
					htmlFor="encryption-pass"
				>
					Passphrase
				</label>
				<div className={styles.passWrapper}>
					<input
						id="encryption-pass"
						type={showPass ? "text" : "password"}
						value={passphrase}
						onChange={(e) => setPassphrase(e.target.value)}
						placeholder="Strong passphrase"
						className={styles.passInput}
						autoComplete="off"
					/>
					<button
						onClick={() => setShowPass((s) => !s)}
						className={styles.passToggle}
						type="button"
						aria-label={showPass ? "Hide passphrase" : "Show passphrase"}
					>
						{showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
					</button>
				</div>

				<button
					onClick={handleRun}
					disabled={busy}
					className={`mt-5 gap-2 ${styles.btnPrimary}`}
					type="button"
				>
					{busy ? (
						<>
							<span className={styles.spinner} aria-hidden="true" />
							{mode === "encrypt" ? "Encrypting…" : "Decrypting…"}
						</>
					) : (
						<>
							<ArrowPathIcon className="w-4 h-4" />
							{mode === "encrypt" ? "Encrypt" : "Decrypt"}
						</>
					)}
				</button>

				{error && (
					<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>{error}</div>
				)}

				{output && (
					<div className="mt-5">
						<div className="flex justify-between items-center mb-2">
							<label className={`text-sm font-medium ${styles.label}`}>
								{mode === "encrypt" ? "Ciphertext (base64)" : "Plaintext"}
							</label>
							<button
								onClick={() => copy(output, "out")}
								className={`gap-2 ${styles.btnSecondary}`}
								type="button"
							>
								{isCopied("out") ? (
									<ClipboardDocumentCheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
								{isCopied("out") ? "Copied!" : "Copy"}
							</button>
						</div>
						<textarea
							value={output}
							readOnly
							className={`${styles.textarea} ${styles.readOnly}`}
							spellCheck={false}
						/>
					</div>
				)}
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>About</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					Encryption uses AES-GCM (256-bit, authenticated) with a key derived from your passphrase via
					PBKDF2-SHA-256 (150,000 iterations). The output is base64 of <code>salt(16) ‖ iv(12) ‖ ciphertext+tag</code>.
					All cryptography runs locally — your text and passphrase never leave the browser.
				</p>
			</div>
		</div>
	);
}
