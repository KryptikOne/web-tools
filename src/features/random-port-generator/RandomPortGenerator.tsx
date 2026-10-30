"use client";

import { useCallback, useMemo, useState } from "react";
import {
	ArrowPathIcon,
	ClipboardDocumentIcon,
	ClipboardDocumentCheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { getRandomInt } from "@/lib/randomUtils";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./RandomPortGenerator.module.scss";

type RangeKey = "registered" | "ephemeral" | "custom";

const RANGES: Record<Exclude<RangeKey, "custom">, { low: number; high: number; label: string; description: string }> = {
	registered: {
		low: 1024,
		high: 49151,
		label: "Registered (1024–49151)",
		description: "User ports assigned by IANA for specific services.",
	},
	ephemeral: {
		low: 49152,
		high: 65535,
		label: "Ephemeral (49152–65535)",
		description: "Dynamic / private ports for short-lived client connections.",
	},
};

const MAX_COUNT = 500;
const MAX_ATTEMPTS_FACTOR = 50;

function parseExcludeList(raw: string): Set<number> {
	const result = new Set<number>();
	if (!raw.trim()) return result;
	const tokens = raw.split(/[\s,]+/).filter(Boolean);
	for (const token of tokens) {
		const n = Number(token);
		if (Number.isInteger(n) && n >= 0 && n <= 65535) {
			result.add(n);
		}
	}
	return result;
}

interface GenerateArgs {
	low: number;
	high: number;
	count: number;
	excluded: Set<number>;
}

function generatePorts({ low, high, count, excluded }: GenerateArgs): number[] {
	const span = high - low + 1;
	const pool = span - excluded.size;
	if (pool <= 0) {
		throw new Error("Every port in the selected range is excluded.");
	}
	if (count > pool) {
		throw new Error(`Cannot generate ${count} unique ports — only ${pool} available after exclusions.`);
	}

	const seen = new Set<number>();
	const result: number[] = [];
	const maxAttempts = count * MAX_ATTEMPTS_FACTOR + 100;
	let attempts = 0;

	while (result.length < count) {
		if (attempts++ > maxAttempts) {
			throw new Error("Could not produce enough unique ports — try widening the range.");
		}
		const candidate = low + getRandomInt(span);
		if (excluded.has(candidate) || seen.has(candidate)) continue;
		seen.add(candidate);
		result.push(candidate);
	}

	return result;
}

export default function RandomPortGenerator() {
	const [rangeKey, setRangeKey] = useState<RangeKey>("ephemeral");
	const [customLow, setCustomLow] = useState("1024");
	const [customHigh, setCustomHigh] = useState("65535");
	const [count, setCount] = useState(1);
	const [excludeText, setExcludeText] = useState("");
	const [ports, setPorts] = useState<number[]>([]);
	const [error, setError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	const activeRange = useMemo(() => {
		if (rangeKey === "custom") {
			const low = Number.parseInt(customLow, 10);
			const high = Number.parseInt(customHigh, 10);
			return { low, high };
		}
		return RANGES[rangeKey];
	}, [rangeKey, customLow, customHigh]);

	const excluded = useMemo(() => parseExcludeList(excludeText), [excludeText]);

	const handleGenerate = useCallback(() => {
		setError(null);
		try {
			const { low, high } = activeRange;
			if (!Number.isInteger(low) || !Number.isInteger(high)) {
				throw new Error("Custom range must be whole numbers.");
			}
			if (low < 0 || high > 65535) {
				throw new Error("Ports must be between 0 and 65535.");
			}
			if (low > high) {
				throw new Error("Low port must be less than or equal to high port.");
			}
			const safeCount = Math.max(1, Math.min(MAX_COUNT, Math.floor(count)));
			const next = generatePorts({ low, high, count: safeCount, excluded });
			setPorts(next);
		} catch (err) {
			setPorts([]);
			setError(err instanceof Error ? err.message : "Failed to generate ports.");
		}
	}, [activeRange, count, excluded]);

	const handleClear = useCallback(() => {
		setPorts([]);
		setError(null);
	}, []);

	const handleCopyAll = useCallback(() => {
		if (!ports.length) return;
		copy(ports.join("\n"), "all");
	}, [ports, copy]);

	return (
		<div className={styles.container}>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className={`lg:col-span-1 ${styles.glassCard}`}>
					<h2 className={`text-lg font-semibold mb-4 ${styles.cardTitle}`}>Options</h2>

					<div className="mb-5">
						<label className={`block mb-2 text-sm font-medium ${styles.label}`} htmlFor="rpg-range">
							Range
						</label>
						<select
							id="rpg-range"
							value={rangeKey}
							onChange={(e) => setRangeKey(e.target.value as RangeKey)}
							className={styles.select}
						>
							<option value="registered">{RANGES.registered.label}</option>
							<option value="ephemeral">{RANGES.ephemeral.label}</option>
							<option value="custom">Custom range</option>
						</select>
						{rangeKey !== "custom" && (
							<p className={`mt-2 text-xs ${styles.helpText}`}>{RANGES[rangeKey].description}</p>
						)}
					</div>

					{rangeKey === "custom" && (
						<div className="grid grid-cols-2 gap-3 mb-5">
							<div>
								<label className={`block mb-2 text-sm font-medium ${styles.label}`} htmlFor="rpg-low">
									Low
								</label>
								<input
									id="rpg-low"
									type="number"
									min={0}
									max={65535}
									value={customLow}
									onChange={(e) => setCustomLow(e.target.value)}
									className={styles.input}
								/>
							</div>
							<div>
								<label className={`block mb-2 text-sm font-medium ${styles.label}`} htmlFor="rpg-high">
									High
								</label>
								<input
									id="rpg-high"
									type="number"
									min={0}
									max={65535}
									value={customHigh}
									onChange={(e) => setCustomHigh(e.target.value)}
									className={styles.input}
								/>
							</div>
						</div>
					)}

					<div className="mb-5">
						<label className={`block mb-2 text-sm font-medium ${styles.label}`} htmlFor="rpg-count">
							Count (1–{MAX_COUNT})
						</label>
						<input
							id="rpg-count"
							type="number"
							min={1}
							max={MAX_COUNT}
							value={count}
							onChange={(e) => {
								const n = Number.parseInt(e.target.value, 10);
								setCount(Number.isNaN(n) ? 1 : Math.max(1, Math.min(MAX_COUNT, n)));
							}}
							className={styles.input}
						/>
					</div>

					<div className="mb-5">
						<label className={`block mb-2 text-sm font-medium ${styles.label}`} htmlFor="rpg-exclude">
							Exclude ports (optional)
						</label>
						<textarea
							id="rpg-exclude"
							value={excludeText}
							onChange={(e) => setExcludeText(e.target.value)}
							placeholder="e.g. 3000, 5432, 8080"
							className={styles.textarea}
							spellCheck={false}
						/>
						<p className={`mt-1 text-xs ${styles.helpText}`}>
							Comma- or newline-separated. {excluded.size} valid port{excluded.size === 1 ? "" : "s"} parsed.
						</p>
					</div>

					<button onClick={handleGenerate} className={`w-full ${styles.btnPrimary}`}>
						<ArrowPathIcon className="w-4 h-4" />
						Generate
					</button>
				</div>

				<div className={`lg:col-span-2 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
						<div>
							<h2 className={`text-lg font-semibold ${styles.cardTitle}`}>
								Generated Ports{" "}
								{ports.length > 0 && <span className={styles.countBadge}>({ports.length})</span>}
							</h2>
							<p className={`text-xs mt-1 ${styles.cardSubtitle}`}>
								Cryptographically random via <code>crypto.getRandomValues</code>.
							</p>
						</div>
						<div className="flex gap-2">
							<button
								onClick={handleCopyAll}
								disabled={!ports.length}
								className={`${styles.btnSecondary} ${isCopied("all") ? styles.copied : ""}`}
							>
								{isCopied("all") ? (
									<>
										<ClipboardDocumentCheckIcon className="w-4 h-4" />
										Copied
									</>
								) : (
									<>
										<ClipboardDocumentIcon className="w-4 h-4" />
										Copy all
									</>
								)}
							</button>
							<button onClick={handleClear} disabled={!ports.length} className={styles.btnSecondary}>
								<TrashIcon className="w-4 h-4" />
								Clear
							</button>
						</div>
					</div>

					{error && <div className={`px-4 py-3 text-sm mb-4 ${styles.errorBox}`}>{error}</div>}

					{ports.length === 0 && !error ? (
						<div className={styles.emptyState}>Press Generate to produce random ports.</div>
					) : (
						<div className={styles.portGrid}>
							{ports.map((port, i) => {
								const fieldId = `port-${i}`;
								return (
									<button
										key={`${port}-${i}`}
										onClick={() => copy(String(port), fieldId)}
										className={`${styles.portChip} ${isCopied(fieldId) ? styles.portChipCopied : ""}`}
										title="Click to copy"
									>
										<span className={styles.portValue}>{port}</span>
										{isCopied(fieldId) ? (
											<ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
										) : (
											<ClipboardDocumentIcon className="w-3.5 h-3.5" />
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 ${styles.cardTitle}`}>About port ranges</h3>
				<div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Well-known (0–1023)</h4>
						<p className={`text-sm m-0 ${styles.infoText}`}>
							Reserved for system services such as HTTP (80), HTTPS (443), and SSH (22). Excluded here by default — avoid binding random ports here.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Registered (1024–49151)</h4>
						<p className={`text-sm m-0 ${styles.infoText}`}>
							Assigned by IANA to specific applications (Postgres 5432, MySQL 3306, etc.). Safe for application servers, but watch for collisions.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Ephemeral (49152–65535)</h4>
						<p className={`text-sm m-0 ${styles.infoText}`}>
							Dynamic / private range. The OS picks from here for outgoing connections. Best choice for one-off local dev ports.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
