"use client";

import { useEffect, useRef, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import styles from "./PasswordStrengthAnalyzer.module.scss";

type CrackTimes = {
	online_throttling_100_per_hour: string | number;
	online_no_throttling_10_per_second: string | number;
	offline_slow_hashing_1e4_per_second: string | number;
	offline_fast_hashing_1e10_per_second: string | number;
};

type ZxResult = {
	score: 0 | 1 | 2 | 3 | 4;
	guesses: number;
	crack_times_display: CrackTimes;
	feedback: { warning: string; suggestions: string[] };
};

type ZxFn = (password: string) => ZxResult | Promise<ZxResult>;

const SCORE_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;

export default function PasswordStrengthAnalyzer() {
	const [password, setPassword] = useState("");
	const [reveal, setReveal] = useState(false);
	const [result, setResult] = useState<ZxResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const zxRef = useRef<ZxFn | null>(null);
	const reqIdRef = useRef(0);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const { zxcvbnOptions, zxcvbn } = await import("@zxcvbn-ts/core");
				const common = await import("@zxcvbn-ts/language-common");
				const en = await import("@zxcvbn-ts/language-en");
				if (cancelled) return;
				zxcvbnOptions.setOptions({
					dictionary: { ...common.dictionary, ...en.dictionary },
					graphs: common.adjacencyGraphs,
					translations: en.translations,
				});
				zxRef.current = zxcvbn as unknown as ZxFn;
				setLoading(false);
			} catch (err) {
				if (cancelled) return;
				setLoadError(err instanceof Error ? err.message : "Failed to load strength engine.");
				setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!zxRef.current) {
			setResult(null);
			return;
		}
		if (!password) {
			setResult(null);
			return;
		}
		const id = ++reqIdRef.current;
		Promise.resolve(zxRef.current(password)).then((r) => {
			if (id === reqIdRef.current) setResult(r as ZxResult);
		});
	}, [password]);

	const score = result?.score ?? 0;
	const filled = password ? score + 1 : 0;

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>Password</h2>

				<label className={`block text-sm font-medium mb-2 ${styles.label}`} htmlFor="pwd-input">
					Enter a password
				</label>
				<div className={styles.passWrapper}>
					<input
						id="pwd-input"
						type={reveal ? "text" : "password"}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Type a password to analyse"
						className={styles.passInput}
						autoComplete="new-password"
					/>
					<button
						onClick={() => setReveal((r) => !r)}
						className={styles.passToggle}
						type="button"
						aria-label={reveal ? "Hide password" : "Reveal password"}
					>
						{reveal ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
					</button>
				</div>

				{loading && !zxRef.current && (
					<p className={`mt-3 text-sm ${styles.cardSubtitle}`}>Loading strength engine…</p>
				)}

				{loadError && (
					<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>{loadError}</div>
				)}

				<div className="mt-5">
					<div className="flex justify-between items-center mb-2">
						<span className={`text-sm ${styles.label}`}>Strength</span>
						{password && result && (
							<span className={`text-sm font-semibold ${styles[`scoreLabel_${score}`]}`}>
								{SCORE_LABELS[score]}
							</span>
						)}
					</div>
					<div className={styles.barTrack}>
						{[0, 1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className={`${styles.barSeg} ${i < filled ? styles[`barFill_${score}`] : ""}`}
							/>
						))}
					</div>
				</div>

				{password && result && (
					<div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className={styles.statCard}>
							<div className={styles.statLabel}>Estimated guesses</div>
							<div className={styles.statValue}>{result.guesses.toLocaleString()}</div>
						</div>
						<div className={styles.statCard}>
							<div className={styles.statLabel}>Score</div>
							<div className={styles.statValue}>{score} / 4</div>
						</div>
					</div>
				)}

				{password && result && (
					<div className={`mt-5 ${styles.crackBox}`}>
						<h3 className={`text-sm font-semibold mb-3 ${styles.label}`}>Crack-time estimates</h3>
						<dl className={styles.crackList}>
							<div>
								<dt>Online (throttled, 100/hr)</dt>
								<dd>{String(result.crack_times_display.online_throttling_100_per_hour)}</dd>
							</div>
							<div>
								<dt>Online (no throttle, 10/s)</dt>
								<dd>{String(result.crack_times_display.online_no_throttling_10_per_second)}</dd>
							</div>
							<div>
								<dt>Offline (slow hash, 10⁴/s)</dt>
								<dd>{String(result.crack_times_display.offline_slow_hashing_1e4_per_second)}</dd>
							</div>
							<div>
								<dt>Offline (fast hash, 10¹⁰/s)</dt>
								<dd>{String(result.crack_times_display.offline_fast_hashing_1e10_per_second)}</dd>
							</div>
						</dl>
					</div>
				)}

				{password && result && (result.feedback.warning || result.feedback.suggestions.length > 0) && (
					<div className={`mt-5 ${styles.feedbackBox}`}>
						{result.feedback.warning && (
							<p className={styles.feedbackWarning}>{result.feedback.warning}</p>
						)}
						{result.feedback.suggestions.length > 0 && (
							<ul className={styles.feedbackList}>
								{result.feedback.suggestions.map((s, i) => (
									<li key={`${s}-${i}`}>{s}</li>
								))}
							</ul>
						)}
					</div>
				)}
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.cardTitle}`}>About</h2>
				<p className={`text-sm leading-relaxed ${styles.infoText}`}>
					Strength is estimated by zxcvbn-ts, which models real-world attacks (dictionary words, common
					substitutions, keyboard patterns). Everything runs locally in your browser; your password is
					never transmitted.
				</p>
			</div>
		</div>
	);
}
