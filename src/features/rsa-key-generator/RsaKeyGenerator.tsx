"use client";

import { useCallback, useState } from "react";
import {
	ArrowPathIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { generateRsaKeyPair, type RsaKeyUse } from "@/lib/cryptoUtils";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./RsaKeyGenerator.module.scss";

type Bits = 2048 | 3072 | 4096;

export default function RsaKeyGenerator() {
	const [bits, setBits] = useState<Bits>(2048);
	const [use, setUse] = useState<RsaKeyUse>("signing");
	const [busy, setBusy] = useState(false);
	const [publicKey, setPublicKey] = useState("");
	const [privateKey, setPrivateKey] = useState("");
	const [error, setError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	const handleGenerate = useCallback(async () => {
		setError(null);
		setPublicKey("");
		setPrivateKey("");
		setBusy(true);
		try {
			const pair = await generateRsaKeyPair(bits, use);
			setPublicKey(pair.publicKeyPem);
			setPrivateKey(pair.privateKeyPem);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate key pair.");
		} finally {
			setBusy(false);
		}
	}, [bits, use]);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>Options</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label
							className={`block text-sm font-medium mb-2 ${styles.label}`}
							htmlFor="rsa-bits"
						>
							Modulus length
						</label>
						<select
							id="rsa-bits"
							value={bits}
							onChange={(e) => setBits(parseInt(e.target.value, 10) as Bits)}
							className={styles.select}
						>
							<option value={2048}>2048 bits (recommended)</option>
							<option value={3072}>3072 bits</option>
							<option value={4096}>4096 bits (slow)</option>
						</select>
					</div>

					<div>
						<label
							className={`block text-sm font-medium mb-2 ${styles.label}`}
							htmlFor="rsa-use"
						>
							Key use
						</label>
						<select
							id="rsa-use"
							value={use}
							onChange={(e) => setUse(e.target.value as RsaKeyUse)}
							className={styles.select}
						>
							<option value="signing">Signing (RSASSA-PKCS1-v1_5, SHA-256)</option>
							<option value="encryption">Encryption (RSA-OAEP, SHA-256)</option>
						</select>
					</div>
				</div>

				{bits === 4096 && (
					<div className={`mt-3 flex items-start gap-2 text-xs ${styles.warningInline}`}>
						<ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<span>4096-bit generation can take several seconds.</span>
					</div>
				)}

				<button
					onClick={handleGenerate}
					disabled={busy}
					className={`mt-5 gap-2 ${styles.btnPrimary}`}
					type="button"
				>
					{busy ? (
						<>
							<span className={styles.spinner} aria-hidden="true" />
							Generating…
						</>
					) : (
						<>
							<ArrowPathIcon className="w-4 h-4" />
							Generate key pair
						</>
					)}
				</button>

				{error && (
					<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>{error}</div>
				)}
			</div>

			{(publicKey || privateKey) && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
					<div className={styles.glassCard}>
						<div className="flex justify-between items-center mb-3">
							<h3 className={styles.cardTitle}>Public key</h3>
							<button
								onClick={() => copy(publicKey, "pub")}
								className={`gap-2 ${styles.btnSecondary}`}
								type="button"
							>
								{isCopied("pub") ? (
									<ClipboardDocumentCheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
								{isCopied("pub") ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre className={styles.pemBlock}>{publicKey}</pre>
					</div>

					<div className={styles.glassCard}>
						<div className="flex justify-between items-center mb-3">
							<h3 className={styles.cardTitle}>Private key</h3>
							<button
								onClick={() => copy(privateKey, "priv")}
								className={`gap-2 ${styles.btnSecondary}`}
								type="button"
							>
								{isCopied("priv") ? (
									<ClipboardDocumentCheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
								{isCopied("priv") ? "Copied!" : "Copy"}
							</button>
						</div>
						<pre className={styles.pemBlock}>{privateKey}</pre>
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>About</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					Keys are generated locally with the Web Crypto API and exported as PEM (SPKI public, PKCS#8
					private). Choose signing for RSASSA-PKCS1-v1_5 signatures or encryption for RSA-OAEP. Never
					share your private key — treat it like a password.
				</p>
			</div>
		</div>
	);
}
