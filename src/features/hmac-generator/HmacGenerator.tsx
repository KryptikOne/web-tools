"use client";

import { useEffect, useState } from "react";
import {
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { hmac, type HmacAlgo } from "@/lib/cryptoUtils";
import { arrayBufferToBase64, arrayBufferToHex } from "@/lib/hashUtils";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./HmacGenerator.module.scss";

const ALGOS: HmacAlgo[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export default function HmacGenerator() {
	const [message, setMessage] = useState("");
	const [key, setKey] = useState("");
	const [algo, setAlgo] = useState<HmacAlgo>("SHA-256");
	const [hex, setHex] = useState("");
	const [b64, setB64] = useState("");
	const [error, setError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		let cancelled = false;
		if (!message && !key) {
			setHex("");
			setB64("");
			setError(null);
			return;
		}
		if (!key) {
			setError("Key is required.");
			setHex("");
			setB64("");
			return;
		}
		(async () => {
			try {
				const out = await hmac(algo, key, message);
				if (cancelled) return;
				setHex(arrayBufferToHex(out));
				setB64(arrayBufferToBase64(out));
				setError(null);
			} catch (err) {
				if (cancelled) return;
				setError(err instanceof Error ? err.message : "HMAC failed.");
				setHex("");
				setB64("");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [algo, key, message]);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>HMAC inputs</h2>

				<label
					className={`block text-sm font-medium mb-2 ${styles.label}`}
					htmlFor="hmac-message"
				>
					Message
				</label>
				<textarea
					id="hmac-message"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder="Text to authenticate"
					className={styles.textarea}
					spellCheck={false}
				/>

				<label
					className={`block text-sm font-medium mb-2 mt-4 ${styles.label}`}
					htmlFor="hmac-key"
				>
					Key
				</label>
				<input
					id="hmac-key"
					type="text"
					value={key}
					onChange={(e) => setKey(e.target.value)}
					placeholder="Shared secret"
					className={styles.inputField}
					autoComplete="off"
				/>

				<label
					className={`block text-sm font-medium mb-2 mt-4 ${styles.label}`}
					htmlFor="hmac-algo"
				>
					Hash algorithm
				</label>
				<select
					id="hmac-algo"
					value={algo}
					onChange={(e) => setAlgo(e.target.value as HmacAlgo)}
					className={styles.select}
				>
					{ALGOS.map((a) => (
						<option key={a} value={a}>
							{a}
						</option>
					))}
				</select>

				{error && (
					<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>{error}</div>
				)}

				<div className="mt-5">
					<div className="flex justify-between items-center mb-2">
						<label className={`text-sm font-medium ${styles.label}`}>Hex</label>
						<button
							onClick={() => copy(hex, "hex")}
							className={`gap-2 ${styles.btnSecondary}`}
							disabled={!hex}
							type="button"
						>
							{isCopied("hex") ? (
								<ClipboardDocumentCheckIcon className="w-4 h-4" />
							) : (
								<ClipboardDocumentIcon className="w-4 h-4" />
							)}
							{isCopied("hex") ? "Copied!" : "Copy"}
						</button>
					</div>
					<code className={styles.output}>{hex || "—"}</code>
				</div>

				<div className="mt-5">
					<div className="flex justify-between items-center mb-2">
						<label className={`text-sm font-medium ${styles.label}`}>Base64</label>
						<button
							onClick={() => copy(b64, "b64")}
							className={`gap-2 ${styles.btnSecondary}`}
							disabled={!b64}
							type="button"
						>
							{isCopied("b64") ? (
								<ClipboardDocumentCheckIcon className="w-4 h-4" />
							) : (
								<ClipboardDocumentIcon className="w-4 h-4" />
							)}
							{isCopied("b64") ? "Copied!" : "Copy"}
						</button>
					</div>
					<code className={styles.output}>{b64 || "—"}</code>
				</div>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>About HMAC</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					HMAC (Hash-based Message Authentication Code) combines a secret key with a cryptographic hash to
					produce a tag that proves both integrity and authenticity. It uses the Web Crypto API and runs
					entirely in your browser. Both message and key are treated as UTF-8.
				</p>
			</div>
		</div>
	);
}
