"use client";

import { useCallback, useMemo, useState } from "react";
import { ulid, monotonicFactory, decodeTime } from "ulid";
import {
	ArrowPathIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./UlidGenerator.module.scss";

export default function UlidGenerator() {
	const [count, setCount] = useState(5);
	const [monotonic, setMonotonic] = useState(false);
	const [useFixedTime, setUseFixedTime] = useState(false);
	const [fixedTimeIso, setFixedTimeIso] = useState(() =>
		new Date().toISOString().slice(0, 16)
	);
	const [items, setItems] = useState<string[]>([]);
	const [genError, setGenError] = useState<string | null>(null);

	const [decodeInput, setDecodeInput] = useState("");
	const decoded = useMemo(() => {
		const trimmed = decodeInput.trim();
		if (!trimmed) return null;
		try {
			const ms = decodeTime(trimmed);
			return { ms, iso: new Date(ms).toISOString(), error: null as string | null };
		} catch (err) {
			return { ms: 0, iso: "", error: err instanceof Error ? err.message : "Invalid ULID" };
		}
	}, [decodeInput]);

	const monotonicRef = useMemo(() => monotonicFactory(), []);

	const { copy, isCopied } = useClipboard();

	const generate = useCallback(() => {
		setGenError(null);
		const n = Math.max(1, Math.min(1000, count));
		let seed: number | undefined;
		if (useFixedTime) {
			const t = Date.parse(fixedTimeIso);
			if (Number.isNaN(t)) {
				setGenError("Invalid timestamp.");
				return;
			}
			seed = t;
		}
		const out: string[] = [];
		for (let i = 0; i < n; i++) {
			if (monotonic) {
				out.push(monotonicRef(seed));
			} else {
				out.push(ulid(seed));
			}
		}
		setItems(out);
	}, [count, monotonic, useFixedTime, fixedTimeIso, monotonicRef]);

	const handleClear = () => setItems([]);

	return (
		<div className={styles.container}>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Generate ULIDs</h2>

					<div className="flex flex-col gap-4">
						<div>
							<label
								className={`block text-sm font-medium mb-2 ${styles.label}`}
								htmlFor="ulid-count"
							>
								Count (1-1000)
							</label>
							<input
								id="ulid-count"
								type="number"
								min={1}
								max={1000}
								value={count}
								onChange={(e) =>
									setCount(Math.max(1, Math.min(1000, parseInt(e.target.value, 10) || 1)))
								}
								className={styles.inputField}
							/>
						</div>

						<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={monotonic}
								onChange={(e) => setMonotonic(e.target.checked)}
								className={styles.checkbox}
							/>
							Monotonic (strictly ascending within same ms)
						</label>

						<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={useFixedTime}
								onChange={(e) => setUseFixedTime(e.target.checked)}
								className={styles.checkbox}
							/>
							Use fixed timestamp
						</label>

						{useFixedTime && (
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${styles.label}`}
									htmlFor="ulid-fixed-time"
								>
									Timestamp
								</label>
								<input
									id="ulid-fixed-time"
									type="datetime-local"
									value={fixedTimeIso}
									onChange={(e) => setFixedTimeIso(e.target.value)}
									className={styles.inputField}
								/>
							</div>
						)}

						<button onClick={generate} className={`gap-2 ${styles.btnPrimary}`} type="button">
							<ArrowPathIcon className="w-4 h-4" />
							Generate
						</button>

						{genError && (
							<div className={`px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>{genError}</div>
						)}
					</div>
				</div>

				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.cardTitle}`}>Decode ULID timestamp</h2>
					<label
						className={`block text-sm font-medium mb-2 ${styles.label}`}
						htmlFor="ulid-decode"
					>
						ULID
					</label>
					<input
						id="ulid-decode"
						type="text"
						value={decodeInput}
						onChange={(e) => setDecodeInput(e.target.value)}
						placeholder="01ARZ3NDEKTSV4RRFFQ69G5FAV"
						className={styles.inputField}
					/>

					{decoded && (
						<div className="mt-4">
							{decoded.error ? (
								<div className={`px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
									{decoded.error}
								</div>
							) : (
								<div className={`p-4 rounded-md ${styles.decodeBox}`}>
									<div className="flex justify-between text-sm mb-1">
										<span className={styles.label}>ISO</span>
										<code className={styles.value}>{decoded.iso}</code>
									</div>
									<div className="flex justify-between text-sm">
										<span className={styles.label}>Unix ms</span>
										<code className={styles.value}>{decoded.ms}</code>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{items.length > 0 && (
				<div className={`mt-6 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
						<h2 className={styles.cardTitle}>
							Generated <span className={`text-sm font-normal ${styles.cardSubtitle}`}>({items.length})</span>
						</h2>
						<div className="flex gap-2">
							<button
								onClick={() => copy(items.join("\n"), "all")}
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
					<div className={styles.list}>
						{items.map((id, i) => (
							<div key={`${id}-${i}`} className={`flex items-center gap-3 ${styles.row}`}>
								<span className={`text-xs ${styles.rowIndex}`}>{i + 1}</span>
								<code className={`flex-1 text-sm ${styles.idText}`}>{id}</code>
								<button
									onClick={() => copy(id, `i-${i}`)}
									className={styles.copyBtn}
									title="Copy"
									type="button"
								>
									{isCopied(`i-${i}`) ? (
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
				<h2 className={`mb-4 ${styles.cardTitle}`}>About ULIDs</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					A ULID is a 128-bit identifier with a 48-bit millisecond timestamp followed by 80 bits of
					randomness, encoded in Crockford base32 (26 characters). ULIDs sort lexicographically by time.
					Monotonic mode guarantees strictly ascending IDs even when generated within the same
					millisecond.
				</p>
			</div>
		</div>
	);
}
