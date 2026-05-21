"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	PlayIcon,
	PauseIcon,
	FlagIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./Chronometer.module.scss";

type Lap = {
	number: number;
	lapMs: number;
	totalMs: number;
};

function pad(n: number, width: number): string {
	const s = String(n);
	if (s.length >= width) return s;
	return "0".repeat(width - s.length) + s;
}

function formatElapsed(ms: number): string {
	const total = Math.max(0, Math.floor(ms));
	const millis = total % 1000;
	const totalSeconds = Math.floor(total / 1000);
	const seconds = totalSeconds % 60;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const minutes = totalMinutes % 60;
	const hours = Math.floor(totalMinutes / 60);
	return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}

export default function Chronometer() {
	const [running, setRunning] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [laps, setLaps] = useState<Lap[]>([]);

	const startTimeRef = useRef<number | null>(null);
	const baseElapsedRef = useRef(0);
	const elapsedRef = useRef(0);
	const rafRef = useRef<number | null>(null);

	const tick = useCallback(() => {
		if (startTimeRef.current === null) return;
		const now = performance.now();
		const ms = baseElapsedRef.current + (now - startTimeRef.current);
		elapsedRef.current = ms;
		setElapsed(ms);
		rafRef.current = requestAnimationFrame(tick);
	}, []);

	const handleStart = useCallback(() => {
		if (running) return;
		startTimeRef.current = performance.now();
		setRunning(true);
		rafRef.current = requestAnimationFrame(tick);
	}, [running, tick]);

	const handleStop = useCallback(() => {
		if (!running) return;
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		if (startTimeRef.current !== null) {
			baseElapsedRef.current += performance.now() - startTimeRef.current;
			startTimeRef.current = null;
			elapsedRef.current = baseElapsedRef.current;
			setElapsed(baseElapsedRef.current);
		}
		setRunning(false);
	}, [running]);

	const handleLap = useCallback(() => {
		const total = elapsedRef.current;
		setLaps((prev) => {
			const lastTotal = prev.length > 0 ? prev[0].totalMs : 0;
			const lap: Lap = {
				number: prev.length + 1,
				lapMs: Math.max(0, total - lastTotal),
				totalMs: total,
			};
			return [lap, ...prev];
		});
	}, []);

	const handleReset = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		startTimeRef.current = null;
		baseElapsedRef.current = 0;
		elapsedRef.current = 0;
		setElapsed(0);
		setLaps([]);
		setRunning(false);
	}, []);

	useEffect(() => {
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	const display = formatElapsed(elapsed);
	const hasActivity = elapsed > 0 || laps.length > 0 || running;

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<div className={styles.displayBlock} aria-live="polite">
					<span className={styles.displayText}>{display}</span>
				</div>

				<div className={styles.controls}>
					{!running ? (
						<button
							onClick={handleStart}
							className={`${styles.btnAction} ${styles.btnStart}`}
							aria-label="Start stopwatch"
						>
							<PlayIcon className="w-5 h-5" />
							Start
						</button>
					) : (
						<button
							onClick={handleStop}
							className={`${styles.btnAction} ${styles.btnStop}`}
							aria-label="Stop stopwatch"
						>
							<PauseIcon className="w-5 h-5" />
							Stop
						</button>
					)}
					<button
						onClick={handleLap}
						className={styles.btnAction}
						disabled={!running}
						aria-label="Record lap"
					>
						<FlagIcon className="w-5 h-5" />
						Lap
					</button>
					<button
						onClick={handleReset}
						className={styles.btnAction}
						disabled={!hasActivity}
						aria-label="Reset stopwatch"
					>
						<ArrowPathIcon className="w-5 h-5" />
						Reset
					</button>
				</div>
			</div>

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-3 flex-wrap gap-3">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Laps
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Newest at the top. Lap time is measured since the previous lap.
						</p>
					</div>
				</div>

				{laps.length === 0 ? (
					<p className={`text-sm m-0 ${styles.cardSubtitle}`}>
						No laps recorded yet.
					</p>
				) : (
					<div className={styles.tableWrap}>
						<table className={styles.lapTable}>
							<thead>
								<tr>
									<th scope="col">#</th>
									<th scope="col">Lap</th>
									<th scope="col">Total</th>
								</tr>
							</thead>
							<tbody>
								{laps.map((lap) => (
									<tr key={lap.number}>
										<td>{lap.number}</td>
										<td className={styles.mono}>{formatElapsed(lap.lapMs)}</td>
										<td className={styles.mono}>
											{formatElapsed(lap.totalMs)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					Notes
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Timing uses <code>performance.now()</code> for sub-millisecond
					precision and <code>requestAnimationFrame</code> for the display
					loop. Nothing is persisted — refreshing the page clears the
					stopwatch.
				</p>
			</div>
		</div>
	);
}
