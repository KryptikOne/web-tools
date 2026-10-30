"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./EtaCalculator.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type EtaResult =
	| {
			ok: true;
			percent: number;
			remainingItems: number;
			rate: number;
			remainingSeconds: number;
			etaDate: Date;
	  }
	| { ok: false; reason: string };

function clampNonNeg(n: number): number {
	if (!Number.isFinite(n) || n < 0) return 0;
	return n;
}

function formatDuration(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0s";
	const t = Math.round(totalSeconds);
	const days = Math.floor(t / 86400);
	const hours = Math.floor((t % 86400) / 3600);
	const minutes = Math.floor((t % 3600) / 60);
	const seconds = t % 60;
	const parts: string[] = [];
	if (days) parts.push(`${days}d`);
	if (hours) parts.push(`${hours}h`);
	if (minutes) parts.push(`${minutes}m`);
	if (seconds || parts.length === 0) parts.push(`${seconds}s`);
	return parts.join(" ");
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "medium",
});

export default function EtaCalculator() {
	const [total, setTotal] = useState<string>("1000");
	const [completed, setCompleted] = useState<string>("250");
	const [hours, setHours] = useState<string>("0");
	const [minutes, setMinutes] = useState<string>("5");
	const [seconds, setSeconds] = useState<string>("0");
	const { copy, isCopied } = useClipboard();

	const result = useMemo<EtaResult>(() => {
		const totalN = Number(total);
		const completedN = Number(completed);
		const elapsedSeconds =
			clampNonNeg(Number(hours)) * 3600 +
			clampNonNeg(Number(minutes)) * 60 +
			clampNonNeg(Number(seconds));

		if (!Number.isFinite(totalN) || totalN <= 0) {
			return { ok: false, reason: "Enter a total greater than 0." };
		}
		if (!Number.isFinite(completedN) || completedN < 0) {
			return { ok: false, reason: "Completed must be 0 or more." };
		}
		if (completedN > totalN) {
			return { ok: false, reason: "Completed cannot exceed total." };
		}
		if (elapsedSeconds <= 0) {
			return { ok: false, reason: "Enter an elapsed time greater than zero." };
		}
		if (completedN === 0) {
			return {
				ok: false,
				reason: "Cannot estimate — no items have been completed yet.",
			};
		}

		const rate = completedN / elapsedSeconds;
		const remainingItems = totalN - completedN;
		if (rate === 0) {
			return { ok: false, reason: "Cannot estimate — rate is zero." };
		}
		const remainingSeconds = remainingItems / rate;
		const etaDate = new Date(Date.now() + remainingSeconds * 1000);
		const percent = (completedN / totalN) * 100;

		return {
			ok: true,
			percent,
			remainingItems,
			rate,
			remainingSeconds,
			etaDate,
		};
	}, [total, completed, hours, minutes, seconds]);

	const etaString = result.ok ? dateFormatter.format(result.etaDate) : "";

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					Inputs
				</h3>

				<div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4`}>
					<div className={styles.inputGroup}>
						<label htmlFor="eta-total" className={styles.label}>
							Total items
						</label>
						<input
							id="eta-total"
							type="number"
							min={0}
							value={total}
							onChange={(e) => setTotal(e.target.value)}
							className={styles.input}
							inputMode="numeric"
						/>
					</div>
					<div className={styles.inputGroup}>
						<label htmlFor="eta-completed" className={styles.label}>
							Completed items
						</label>
						<input
							id="eta-completed"
							type="number"
							min={0}
							value={completed}
							onChange={(e) => setCompleted(e.target.value)}
							className={styles.input}
							inputMode="numeric"
						/>
					</div>
				</div>

				<p className={`text-sm mb-2 m-0 ${styles.label}`}>Elapsed time</p>
				<div className={`grid grid-cols-3 gap-3`}>
					<div className={styles.inputGroup}>
						<label htmlFor="eta-hours" className={styles.subLabel}>
							Hours
						</label>
						<input
							id="eta-hours"
							type="number"
							min={0}
							value={hours}
							onChange={(e) => setHours(e.target.value)}
							className={styles.input}
							inputMode="numeric"
						/>
					</div>
					<div className={styles.inputGroup}>
						<label htmlFor="eta-minutes" className={styles.subLabel}>
							Minutes
						</label>
						<input
							id="eta-minutes"
							type="number"
							min={0}
							value={minutes}
							onChange={(e) => setMinutes(e.target.value)}
							className={styles.input}
							inputMode="numeric"
						/>
					</div>
					<div className={styles.inputGroup}>
						<label htmlFor="eta-seconds" className={styles.subLabel}>
							Seconds
						</label>
						<input
							id="eta-seconds"
							type="number"
							min={0}
							value={seconds}
							onChange={(e) => setSeconds(e.target.value)}
							className={styles.input}
							inputMode="numeric"
						/>
					</div>
				</div>
			</div>

			{!result.ok ? (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.infoBox}`}>
					{result.reason}
				</div>
			) : (
				<div className={`mt-4 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Estimate
						</h3>
						<button
							onClick={() => copy(etaString, "eta")}
							className={`${styles.btnPrimary} ${isCopied("eta") ? styles.copied : ""}`}
						>
							{isCopied("eta") ? (
								<>
									<CheckIcon className="w-4 h-4" />
									Copied!
								</>
							) : (
								<>
									<ClipboardDocumentIcon className="w-4 h-4" />
									Copy ETA
								</>
							)}
						</button>
					</div>

					<div className={styles.progressTrack}>
						<div
							className={styles.progressFill}
							style={{ width: `${Math.min(100, result.percent).toFixed(2)}%` }}
						/>
					</div>
					<p className={`text-sm mt-2 m-0 ${styles.cardSubtitle}`}>
						{result.percent.toFixed(2)}% complete
					</p>

					<div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-5`}>
						<Stat
							label="Items remaining"
							value={result.remainingItems.toLocaleString()}
						/>
						<Stat
							label="Processing rate"
							value={`${result.rate < 1
								? result.rate.toFixed(4)
								: result.rate.toFixed(2)} items/sec`}
						/>
						<Stat
							label="Time remaining"
							value={formatDuration(result.remainingSeconds)}
						/>
						<Stat label="Estimated completion" value={etaString} mono />
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					How it works
				</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							The math
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Rate is <code>completed / elapsed</code>. Remaining time is{" "}
							<code>(total − completed) / rate</code>. ETA is the current
							timestamp plus the remaining time.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							Caveats
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							This assumes a constant throughput. Real work often speeds up
							or slows down, so refresh the inputs periodically for a more
							accurate estimate.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function Stat({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className={styles.statBox}>
			<div className={styles.statLabel}>{label}</div>
			<div className={mono ? styles.statValueMono : styles.statValue}>
				{value}
			</div>
		</div>
	);
}
