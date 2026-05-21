"use client";

import { useCallback, useMemo, useState } from "react";
import {
	ArrowPathIcon,
	ClipboardDocumentIcon,
	ClipboardDocumentCheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import {
	CHARSETS,
	entropyBits,
	randomFromCharset,
	randomFromCharsetNoRepeats,
} from "@/lib/randomUtils";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./TokenPasswordGenerator.module.scss";

type Options = {
	length: number;
	lowercase: boolean;
	uppercase: boolean;
	digits: boolean;
	symbols: boolean;
	excludeAmbiguous: boolean;
	noRepeats: boolean;
	count: number;
};

const DEFAULTS: Options = {
	length: 24,
	lowercase: true,
	uppercase: true,
	digits: true,
	symbols: true,
	excludeAmbiguous: true,
	noRepeats: false,
	count: 1,
};

function buildCharset(opts: Options): string {
	let charset = "";
	if (opts.lowercase) charset += CHARSETS.lowercase;
	if (opts.uppercase) charset += CHARSETS.uppercase;
	if (opts.digits) charset += CHARSETS.digits;
	if (opts.symbols) charset += CHARSETS.symbols;
	if (opts.excludeAmbiguous) {
		const ambiguous = new Set(CHARSETS.ambiguous);
		charset = Array.from(charset)
			.filter((c) => !ambiguous.has(c))
			.join("");
	}
	return charset;
}

function strengthLabel(bits: number): { label: string; tone: "weak" | "fair" | "good" | "strong" } {
	if (bits < 40) return { label: "Weak", tone: "weak" };
	if (bits < 60) return { label: "Fair", tone: "fair" };
	if (bits < 90) return { label: "Good", tone: "good" };
	return { label: "Strong", tone: "strong" };
}

export default function TokenPasswordGenerator() {
	const [opts, setOpts] = useState<Options>(DEFAULTS);
	const [tokens, setTokens] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	const charset = useMemo(() => buildCharset(opts), [opts]);
	const bits = useMemo(() => entropyBits(opts.length, charset.length), [opts.length, charset.length]);
	const strength = strengthLabel(bits);

	const generate = useCallback(
		(count: number) => {
			setError(null);
			if (!charset) {
				setError("Select at least one character set.");
				setTokens([]);
				return;
			}
			if (opts.noRepeats && charset.length < 2 && opts.length > 1) {
				setError("Need at least 2 distinct characters in the charset for no-repeats.");
				setTokens([]);
				return;
			}
			const n = Math.max(1, Math.min(500, count));
			try {
				const fn = opts.noRepeats ? randomFromCharsetNoRepeats : randomFromCharset;
				const out: string[] = [];
				for (let i = 0; i < n; i++) out.push(fn(opts.length, charset));
				setTokens(out);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to generate tokens.");
				setTokens([]);
			}
		},
		[charset, opts.length, opts.noRepeats]
	);

	const handleGenerateSingle = () => generate(1);
	const handleGenerateBulk = () => generate(opts.count);
	const handleClear = () => setTokens([]);

	const update = <K extends keyof Options>(key: K, value: Options[K]) => {
		setOpts((prev) => ({ ...prev, [key]: value }));
	};

	return (
		<div className={styles.container}>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Options panel */}
				<div className={`lg:col-span-2 ${styles.glassCard}`}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Options</h2>

					<div className="mb-6">
						<div className="flex justify-between items-center mb-2">
							<label className={`text-sm font-medium ${styles.label}`} htmlFor="token-length">
								Length
							</label>
							<span className={`font-mono text-sm ${styles.value}`}>{opts.length}</span>
						</div>
						<input
							id="token-length"
							type="range"
							min={4}
							max={128}
							value={opts.length}
							onChange={(e) => update("length", parseInt(e.target.value, 10) || 4)}
							className={styles.slider}
							aria-label="Token length"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3 mb-6">
						{(
							[
								["lowercase", "Lowercase (a-z)"],
								["uppercase", "Uppercase (A-Z)"],
								["digits", "Digits (0-9)"],
								["symbols", "Symbols (!@#…)"],
								["excludeAmbiguous", "Exclude ambiguous (Il1O0o)"],
								["noRepeats", "No adjacent repeats"],
							] as const
						).map(([key, label]) => (
							<label
								key={key}
								className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}
							>
								<input
									type="checkbox"
									checked={opts[key]}
									onChange={(e) => update(key, e.target.checked)}
									className={styles.checkbox}
								/>
								{label}
							</label>
						))}
					</div>

					<div className="flex flex-wrap gap-3 items-end">
						<button
							onClick={handleGenerateSingle}
							className={`gap-2 ${styles.btnPrimary}`}
							type="button"
						>
							<ArrowPathIcon className="w-4 h-4" />
							Generate
						</button>
						<div className="flex items-end gap-2">
							<div className="flex flex-col">
								<label
									htmlFor="bulk-count"
									className={`text-xs mb-1 ${styles.label}`}
								>
									Bulk count
								</label>
								<input
									id="bulk-count"
									type="number"
									min={1}
									max={500}
									value={opts.count}
									onChange={(e) =>
										update(
											"count",
											Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1))
										)
									}
									className={styles.numberInput}
								/>
							</div>
							<button
								onClick={handleGenerateBulk}
								className={`gap-2 ${styles.btnSecondary}`}
								type="button"
							>
								Bulk generate
							</button>
						</div>
					</div>
				</div>

				{/* Entropy panel */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Entropy</h2>
					<div className="mb-2 flex items-baseline gap-2">
						<span className={`text-3xl font-mono ${styles.entropyValue}`}>{bits.toFixed(1)}</span>
						<span className={`text-sm ${styles.cardSubtitle}`}>bits</span>
					</div>
					<div className={`text-sm mb-3 ${styles.cardSubtitle}`}>
						Charset size: <span className="font-mono">{charset.length}</span>
					</div>
					<div className={`${styles.strengthBadge} ${styles[`tone_${strength.tone}`]}`}>
						{strength.label}
					</div>
					<p className={`mt-4 text-xs leading-relaxed ${styles.cardSubtitle}`}>
						Entropy estimate = length × log<sub>2</sub>(charset size). 80+ bits is recommended for most secrets.
					</p>
				</div>
			</div>

			{error && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>{error}</div>
			)}

			{tokens.length > 0 && (
				<div className={`mt-6 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
						<h2 className={styles.cardTitle}>
							Generated <span className={`text-sm font-normal ${styles.cardSubtitle}`}>({tokens.length})</span>
						</h2>
						<div className="flex gap-2">
							<button
								onClick={() => copy(tokens.join("\n"), "all")}
								className={`gap-2 ${styles.btnSecondary}`}
								type="button"
							>
								{isCopied("all") ? (
									<ClipboardDocumentCheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
								{isCopied("all") ? "Copied!" : "Copy all"}
							</button>
							<button onClick={handleClear} className={`gap-2 ${styles.btnGhost}`} type="button">
								<TrashIcon className="w-4 h-4" />
								Clear
							</button>
						</div>
					</div>
					<div className={styles.tokenList}>
						{tokens.map((token, i) => (
							<div key={`${token}-${i}`} className={`flex items-center gap-3 ${styles.tokenRow}`}>
								<span className={`text-xs ${styles.rowIndex}`}>{i + 1}</span>
								<code className={`flex-1 text-sm ${styles.tokenText}`}>{token}</code>
								<button
									onClick={() => copy(token, `t-${i}`)}
									className={styles.copyBtn}
									title="Copy"
									type="button"
								>
									{isCopied(`t-${i}`) ? (
										<ClipboardDocumentCheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>About</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					All tokens are generated locally using <code>crypto.getRandomValues</code> via rejection sampling
					to avoid modulo bias. Nothing is ever sent over the network.
				</p>
			</div>
		</div>
	);
}
