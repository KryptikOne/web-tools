"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardDocumentIcon, CheckIcon, ClockIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import styles from "./EpochConverter.module.scss";

const TIMEZONES = [
	{ value: "local", label: "Local Time" },
	{ value: "UTC", label: "UTC" },
	{ value: "America/New_York", label: "Eastern Time (ET)" },
	{ value: "America/Chicago", label: "Central Time (CT)" },
	{ value: "America/Denver", label: "Mountain Time (MT)" },
	{ value: "America/Los_Angeles", label: "Pacific Time (PT)" },
	{ value: "Europe/London", label: "London (GMT/BST)" },
	{ value: "Europe/Paris", label: "Paris (CET/CEST)" },
	{ value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
	{ value: "Asia/Tokyo", label: "Tokyo (JST)" },
	{ value: "Asia/Shanghai", label: "Shanghai (CST)" },
	{ value: "Asia/Singapore", label: "Singapore (SGT)" },
	{ value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

export default function EpochConverter() {
	const [currentEpochSeconds, setCurrentEpochSeconds] = useState<number>(Math.floor(Date.now() / 1000));
	const [currentEpochMs, setCurrentEpochMs] = useState<number>(Date.now());
	const [epochInput, setEpochInput] = useState<string>("");
	const [dateInput, setDateInput] = useState<string>("");
	const [timeInput, setTimeInput] = useState<string>("");
	const [timezone, setTimezone] = useState<string>("local");
	const [epochResult, setEpochResult] = useState<string>("");
	const [dateResult, setDateResult] = useState<string>("");
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [epochError, setEpochError] = useState<string>("");
	const [dateError, setDateError] = useState<string>("");

	// Update current epoch every 100ms for smooth millisecond display
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentEpochSeconds(Math.floor(Date.now() / 1000));
			setCurrentEpochMs(Date.now());
		}, 100);
		return () => clearInterval(interval);
	}, []);

	const formatDateForTimezone = useCallback((date: Date, tz: string): string => {
		try {
			if (tz === "local") {
				return date.toLocaleString("en-US", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: true,
				});
			}
			return date.toLocaleString("en-US", {
				timeZone: tz,
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: true,
				timeZoneName: "short",
			});
		} catch {
			return date.toLocaleString();
		}
	}, []);

	const convertEpochToDate = useCallback(() => {
		setEpochError("");
		const epoch = parseInt(epochInput, 10);

		if (isNaN(epoch)) {
			setEpochError("Please enter a valid epoch timestamp");
			setDateResult("");
			return;
		}

		// Handle both seconds and milliseconds
		const epochMs = epoch.toString().length > 10 ? epoch : epoch * 1000;
		const date = new Date(epochMs);

		if (isNaN(date.getTime())) {
			setEpochError("Invalid epoch timestamp");
			setDateResult("");
			return;
		}

		setDateResult(formatDateForTimezone(date, timezone));
	}, [epochInput, timezone, formatDateForTimezone]);

	const convertDateToEpoch = useCallback(() => {
		setDateError("");

		if (!dateInput || !timeInput) {
			setDateError("Please enter both date and time");
			setEpochResult("");
			return;
		}

		try {
			const dateTimeString = `${dateInput}T${timeInput}`;
			let date: Date;

			if (timezone === "local") {
				date = new Date(dateTimeString);
			} else if (timezone === "UTC") {
				date = new Date(dateTimeString + "Z");
			} else {
				// For other timezones, we need to calculate the offset
				const tempDate = new Date(dateTimeString);
				const utcDate = new Date(tempDate.toLocaleString("en-US", { timeZone: "UTC" }));
				const tzDate = new Date(tempDate.toLocaleString("en-US", { timeZone: timezone }));
				const offset = utcDate.getTime() - tzDate.getTime();
				date = new Date(tempDate.getTime() + offset);
			}

			if (isNaN(date.getTime())) {
				setDateError("Invalid date/time format");
				setEpochResult("");
				return;
			}

			const epochSeconds = Math.floor(date.getTime() / 1000);
			setEpochResult(epochSeconds.toString());
		} catch {
			setDateError("Invalid date/time format");
			setEpochResult("");
		}
	}, [dateInput, timeInput, timezone]);

	const setCurrentEpochInput = () => {
		setEpochInput(currentEpochSeconds.toString());
		setEpochError("");
	};

	const setCurrentDateTime = () => {
		const now = new Date();
		const dateStr = now.toISOString().split("T")[0];
		const timeStr = now.toTimeString().slice(0, 8);
		setDateInput(dateStr);
		setTimeInput(timeStr);
		setDateError("");
	};

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const formatEpoch = (epoch: number): string => {
		return epoch.toString();
	};

	return (
		<div className={styles.container}>
			{/* Live Epoch Display */}
			<div className={styles.liveSection}>
				<div className={styles.glassCard}>
					<div className={styles.liveHeader}>
						<ClockIcon className={styles.liveIcon} />
						<h2 className={styles.liveTitle}>Current Unix Timestamp</h2>
					</div>
					<div className={styles.liveDisplayGrid}>
						<div className={styles.liveDisplayItem}>
							<span className={styles.liveDisplayLabel}>Seconds</span>
							<div className={styles.liveDisplay}>
								<span className={styles.epochValue}>{formatEpoch(currentEpochSeconds)}</span>
								<button className={`${styles.copyBtn} ${copiedField === "liveSeconds" ? styles.copied : ""}`} onClick={() => copyToClipboard(currentEpochSeconds.toString(), "liveSeconds")} title="Copy to clipboard">
									{copiedField === "liveSeconds" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
								</button>
							</div>
						</div>
						<div className={styles.liveDisplayItem}>
							<span className={styles.liveDisplayLabel}>Milliseconds</span>
							<div className={styles.liveDisplay}>
								<span className={styles.epochValue}>{formatEpoch(currentEpochMs)}</span>
								<button className={`${styles.copyBtn} ${copiedField === "liveMs" ? styles.copied : ""}`} onClick={() => copyToClipboard(currentEpochMs.toString(), "liveMs")} title="Copy to clipboard">
									{copiedField === "liveMs" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
								</button>
							</div>
						</div>
					</div>
					<p className={styles.liveSubtext}>Time since January 1, 1970 00:00:00 UTC</p>
				</div>
			</div>

			{/* Timezone Selector */}
			<div className={styles.timezoneSection}>
				<label className={styles.timezoneLabel}>Timezone for conversions:</label>
				<select className={styles.timezoneSelect} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
					{TIMEZONES.map((tz) => (
						<option key={tz.value} value={tz.value}>
							{tz.label}
						</option>
					))}
				</select>
			</div>

			{/* Conversion Grid */}
			<div className={styles.conversionGrid}>
				{/* Epoch to Date */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Epoch → Date/Time</h2>

					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Unix Timestamp (seconds)</label>
						<div className={styles.inputWrapper}>
							<input
								type="number"
								inputMode="numeric"
								value={epochInput}
								onChange={(e) => {
									setEpochInput(e.target.value);
									setEpochError("");
								}}
								className={styles.input}
								placeholder="Enter epoch seconds..."
							/>
						</div>
						{epochError && <p className={styles.errorText}>{epochError}</p>}
					</div>

					<div className={styles.buttonRow}>
						<button className={styles.btnSecondary} onClick={setCurrentEpochInput}>
							<ClockIcon className={styles.btnIcon} />
							Set Current
						</button>
						<button className={styles.btnPrimary} onClick={convertEpochToDate}>
							<ArrowPathIcon className={styles.btnIcon} />
							Convert
						</button>
					</div>

					{dateResult && (
						<div className={styles.resultBox}>
							<div className={styles.resultHeader}>
								<span className={styles.resultLabel}>Result:</span>
								<button className={`${styles.copyBtn} ${copiedField === "dateResult" ? styles.copied : ""}`} onClick={() => copyToClipboard(dateResult, "dateResult")} title="Copy to clipboard">
									{copiedField === "dateResult" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
								</button>
							</div>
							<p className={styles.resultValue}>{dateResult}</p>
						</div>
					)}
				</div>

				{/* Date to Epoch */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Date/Time → Epoch</h2>

					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Date</label>
						<input
							type="date"
							value={dateInput}
							onChange={(e) => {
								setDateInput(e.target.value);
								setDateError("");
							}}
							className={styles.input}
						/>
					</div>

					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Time</label>
						<input
							type="time"
							value={timeInput}
							onChange={(e) => {
								setTimeInput(e.target.value);
								setDateError("");
							}}
							className={styles.input}
							step="1"
						/>
					</div>

					{dateError && <p className={styles.errorText}>{dateError}</p>}

					<div className={styles.buttonRow}>
						<button className={styles.btnSecondary} onClick={setCurrentDateTime}>
							<ClockIcon className={styles.btnIcon} />
							Set Current
						</button>
						<button className={styles.btnPrimary} onClick={convertDateToEpoch}>
							<ArrowPathIcon className={styles.btnIcon} />
							Convert
						</button>
					</div>

					{epochResult && (
						<div className={styles.resultBox}>
							<div className={styles.resultHeader}>
								<span className={styles.resultLabel}>Result:</span>
								<button className={`${styles.copyBtn} ${copiedField === "epochResult" ? styles.copied : ""}`} onClick={() => copyToClipboard(epochResult, "epochResult")} title="Copy to clipboard">
									{copiedField === "epochResult" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
								</button>
							</div>
							<p className={styles.resultValue}>{epochResult}</p>
						</div>
					)}
				</div>
			</div>

			{/* Info Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>About Unix Timestamps</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>What is a Unix Timestamp?</h3>
						<p className={styles.infoText}>A Unix timestamp (or Epoch time) is the number of seconds that have elapsed since January 1, 1970 at 00:00:00 UTC. It&apos;s a widely used format for representing dates and times in computing systems.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Common Uses</h3>
						<p className={styles.infoText}>Unix timestamps are used in databases, APIs, log files, and many programming languages. They&apos;re timezone-independent and easy to compare mathematically, making them ideal for storing and manipulating dates.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Seconds vs Milliseconds</h3>
						<p className={styles.infoText}>
							This converter accepts both formats. Timestamps with 10 digits are in seconds, while 13-digit timestamps are in milliseconds. JavaScript&apos;s <code>Date.now()</code> returns milliseconds.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Year 2038 Problem</h3>
						<p className={styles.infoText}>32-bit systems storing Unix time as a signed integer will overflow on January 19, 2038. Modern 64-bit systems use 64-bit integers, extending the range to billions of years.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
