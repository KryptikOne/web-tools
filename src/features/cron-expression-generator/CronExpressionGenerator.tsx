"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ClockIcon,
	InformationCircleIcon,
} from "@heroicons/react/24/outline";
import styles from "./CronExpressionGenerator.module.scss";

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldMode = "every" | "specific" | "range" | "step";

interface CronField {
	mode: FieldMode;
	specific: string;
	rangeStart: string;
	rangeEnd: string;
	stepBase: string;
	stepValue: string;
}

interface Preset {
	label: string;
	expression: string;
	description: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELD_NAMES = ["Minute", "Hour", "Day of Month", "Month", "Day of Week"] as const;

const FIELD_RANGES: { min: number; max: number; labels?: Record<number, string> }[] = [
	{ min: 0, max: 59 },
	{ min: 0, max: 23 },
	{ min: 1, max: 31 },
	{ min: 1, max: 12, labels: { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" } },
	{ min: 0, max: 6, labels: { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" } },
];

const PRESETS: Preset[] = [
	{ label: "Every Minute", expression: "* * * * *", description: "Runs every minute" },
	{ label: "Every 5 Minutes", expression: "*/5 * * * *", description: "Runs every 5 minutes" },
	{ label: "Every 15 Minutes", expression: "*/15 * * * *", description: "Runs every 15 minutes" },
	{ label: "Every Hour", expression: "0 * * * *", description: "At minute 0 of every hour" },
	{ label: "Every 2 Hours", expression: "0 */2 * * *", description: "At minute 0 every 2 hours" },
	{ label: "Daily at Midnight", expression: "0 0 * * *", description: "Every day at 00:00" },
	{ label: "Daily at Noon", expression: "0 12 * * *", description: "Every day at 12:00" },
	{ label: "Every Weekday", expression: "0 9 * * 1-5", description: "At 09:00 Monday through Friday" },
	{ label: "Every Weekend", expression: "0 9 * * 0,6", description: "At 09:00 on Saturday and Sunday" },
	{ label: "Weekly (Sunday)", expression: "0 0 * * 0", description: "At 00:00 every Sunday" },
	{ label: "Monthly (1st)", expression: "0 0 1 * *", description: "At 00:00 on the 1st of every month" },
	{ label: "Quarterly", expression: "0 0 1 1,4,7,10 *", description: "At 00:00 on the 1st of Jan, Apr, Jul, Oct" },
];

const REFERENCE_DATA = [
	{ field: "Minute", range: "0-59", specials: "* , - /", example: "*/5 = every 5 minutes" },
	{ field: "Hour", range: "0-23", specials: "* , - /", example: "9-17 = 9 AM to 5 PM" },
	{ field: "Day of Month", range: "1-31", specials: "* , - /", example: "1,15 = 1st and 15th" },
	{ field: "Month", range: "1-12", specials: "* , - /", example: "1-6 = January to June" },
	{ field: "Day of Week", range: "0-6 (Sun=0)", specials: "* , - /", example: "1-5 = weekdays" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createDefaultField(): CronField {
	return { mode: "every", specific: "", rangeStart: "", rangeEnd: "", stepBase: "*", stepValue: "2" };
}

function fieldToString(field: CronField, index: number): string {
	const { min } = FIELD_RANGES[index];
	switch (field.mode) {
		case "every":
			return "*";
		case "specific":
			return field.specific.trim() || "*";
		case "range": {
			const start = field.rangeStart || String(min);
			const end = field.rangeEnd || String(min);
			return `${start}-${end}`;
		}
		case "step": {
			const base = field.stepBase || "*";
			const step = field.stepValue || "2";
			return `${base}/${step}`;
		}
		default:
			return "*";
	}
}

/** Parse a single cron field token back into a CronField. */
function parseFieldToken(token: string): CronField {
	const field = createDefaultField();
	if (token === "*") {
		field.mode = "every";
		return field;
	}
	if (token.includes("/")) {
		field.mode = "step";
		const [base, step] = token.split("/");
		field.stepBase = base;
		field.stepValue = step;
		return field;
	}
	if (token.includes("-") && !token.includes(",")) {
		field.mode = "range";
		const [start, end] = token.split("-");
		field.rangeStart = start;
		field.rangeEnd = end;
		return field;
	}
	field.mode = "specific";
	field.specific = token;
	return field;
}

// ─── Human-readable description ──────────────────────────────────────────────

function describeExpression(expression: string): string {
	const parts = expression.trim().split(/\s+/);
	if (parts.length !== 5) return "Invalid cron expression (expected 5 fields)";

	const [minute, hour, dom, month, dow] = parts;

	// Check for well-known patterns first
	if (expression === "* * * * *") return "Every minute";
	if (minute.startsWith("*/") && hour === "*" && dom === "*" && month === "*" && dow === "*") {
		return `Every ${minute.slice(2)} minutes`;
	}
	if (hour.startsWith("*/") && minute === "0" && dom === "*" && month === "*" && dow === "*") {
		return `Every ${hour.slice(2)} hours`;
	}

	const segments: string[] = [];

	// Minute / Hour
	if (minute === "*" && hour === "*") {
		segments.push("Every minute");
	} else if (minute === "*") {
		segments.push("Every minute");
	} else if (minute.includes("/")) {
		segments.push(`Every ${minute.split("/")[1]} minutes`);
	} else {
		// specific minute
	}

	if (hour === "*" && minute !== "*") {
		segments.push("of every hour");
	} else if (hour.includes("/")) {
		segments.push(`every ${hour.split("/")[1]} hours`);
	} else if (hour.includes("-")) {
		const [s, e] = hour.split("-");
		segments.push(`between ${formatHour(s)} and ${formatHour(e)}`);
	} else if (hour !== "*") {
		if (minute !== "*" && !minute.includes("/")) {
			segments.push(`at ${formatHour(hour)}:${minute.padStart(2, "0")}`);
		} else {
			segments.push(`during hour ${hour}`);
		}
	}

	// Day of month
	if (dom !== "*") {
		if (dom.includes(",")) {
			segments.push(`on day ${dom} of the month`);
		} else if (dom.includes("-")) {
			segments.push(`on days ${dom} of the month`);
		} else if (dom.includes("/")) {
			segments.push(`every ${dom.split("/")[1]} days`);
		} else {
			segments.push(`on day ${dom} of the month`);
		}
	}

	// Month
	if (month !== "*") {
		const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		if (month.includes(",")) {
			const names = month.split(",").map((m) => monthNames[parseInt(m, 10) - 1] || m);
			segments.push(`in ${names.join(", ")}`);
		} else if (month.includes("-")) {
			const [s, e] = month.split("-");
			segments.push(`from ${monthNames[parseInt(s, 10) - 1] || s} to ${monthNames[parseInt(e, 10) - 1] || e}`);
		} else {
			segments.push(`in ${monthNames[parseInt(month, 10) - 1] || month}`);
		}
	}

	// Day of week
	if (dow !== "*") {
		const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		if (dow.includes(",")) {
			const names = dow.split(",").map((d) => dayNames[parseInt(d, 10)] || d);
			segments.push(`on ${names.join(" and ")}`);
		} else if (dow.includes("-")) {
			const [s, e] = dow.split("-");
			segments.push(`${dayNames[parseInt(s, 10)] || s} through ${dayNames[parseInt(e, 10)] || e}`);
		} else {
			segments.push(`on ${dayNames[parseInt(dow, 10)] || dow}`);
		}
	}

	return segments.join(" ") || "Every minute";
}

function formatHour(h: string): string {
	const n = parseInt(h, 10);
	if (isNaN(n)) return h;
	if (n === 0) return "12 AM";
	if (n === 12) return "12 PM";
	return n > 12 ? `${n - 12} PM` : `${n} AM`;
}

// ─── Next run calculator ─────────────────────────────────────────────────────

function expandField(token: string, min: number, max: number): number[] {
	if (token === "*") {
		return Array.from({ length: max - min + 1 }, (_, i) => i + min);
	}
	const results = new Set<number>();
	for (const part of token.split(",")) {
		if (part.includes("/")) {
			const [base, stepStr] = part.split("/");
			const step = parseInt(stepStr, 10);
			const start = base === "*" ? min : parseInt(base, 10);
			for (let i = start; i <= max; i += step) {
				results.add(i);
			}
		} else if (part.includes("-")) {
			const [s, e] = part.split("-").map(Number);
			for (let i = s; i <= e; i++) {
				results.add(i);
			}
		} else {
			results.add(parseInt(part, 10));
		}
	}
	return Array.from(results).filter((n) => n >= min && n <= max).sort((a, b) => a - b);
}

function getNextRuns(expression: string, count: number): Date[] {
	const parts = expression.trim().split(/\s+/);
	if (parts.length !== 5) return [];

	const minutes = expandField(parts[0], 0, 59);
	const hours = expandField(parts[1], 0, 23);
	const doms = expandField(parts[2], 1, 31);
	const months = expandField(parts[3], 1, 12);
	const dows = expandField(parts[4], 0, 6);

	if (!minutes.length || !hours.length || !doms.length || !months.length || !dows.length) return [];

	const minuteSet = new Set(minutes);
	const hourSet = new Set(hours);
	const domSet = new Set(doms);
	const monthSet = new Set(months);
	const dowSet = new Set(dows);

	const runs: Date[] = [];
	const now = new Date();
	const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

	const maxIterations = 525600; // 1 year of minutes
	for (let i = 0; i < maxIterations && runs.length < count; i++) {
		const m = cursor.getMinutes();
		const h = cursor.getHours();
		const d = cursor.getDate();
		const mo = cursor.getMonth() + 1;
		const wd = cursor.getDay();

		if (minuteSet.has(m) && hourSet.has(h) && domSet.has(d) && monthSet.has(mo) && dowSet.has(wd)) {
			runs.push(new Date(cursor));
		}
		cursor.setMinutes(cursor.getMinutes() + 1);
	}

	return runs;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CronExpressionGenerator() {
	const [fields, setFields] = useState<CronField[]>(() =>
		Array.from({ length: 5 }, () => createDefaultField())
	);
	const [manualInput, setManualInput] = useState("");
	const [isManualMode, setIsManualMode] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Build expression from fields
	const expression = useMemo(() => {
		if (isManualMode) return manualInput.trim();
		return fields.map((f, i) => fieldToString(f, i)).join(" ");
	}, [fields, isManualMode, manualInput]);

	const isValidExpression = useMemo(() => {
		const parts = expression.split(/\s+/);
		return parts.length === 5 && parts.every((p) => /^[\d*,\-/]+$/.test(p));
	}, [expression]);

	const description = useMemo(() => {
		if (!isValidExpression) return "Invalid cron expression";
		return describeExpression(expression);
	}, [expression, isValidExpression]);

	const nextRuns = useMemo(() => {
		if (!isValidExpression) return [];
		return getNextRuns(expression, 10);
	}, [expression, isValidExpression]);

	const updateField = useCallback((index: number, updates: Partial<CronField>) => {
		setFields((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], ...updates };
			return next;
		});
	}, []);

	const applyPreset = useCallback((preset: Preset) => {
		const parts = preset.expression.split(/\s+/);
		if (parts.length !== 5) return;
		setFields(parts.map((token) => parseFieldToken(token)));
		setIsManualMode(false);
		setManualInput("");
	}, []);

	const loadManualExpression = useCallback(() => {
		const parts = manualInput.trim().split(/\s+/);
		if (parts.length !== 5) return;
		setFields(parts.map((token) => parseFieldToken(token)));
		setIsManualMode(false);
		setManualInput("");
	}, [manualInput]);

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div className={styles.container}>
			{/* Expression Output */}
			<div className={styles.glassCard}>
				<div className={`flex items-center gap-3 mb-4`}>
					<ClockIcon className={`w-6 h-6 ${styles.accentIcon}`} />
					<h2 className={styles.sectionTitle}>Cron Expression</h2>
				</div>
				<div className={`flex items-center gap-4 p-4 rounded-lg ${styles.expressionDisplay}`}>
					<code className={styles.expressionValue}>{expression || "* * * * *"}</code>
					<button
						className={`${styles.copyBtn} ${copiedField === "expression" ? styles.copied : ""}`}
						onClick={() => copyToClipboard(expression, "expression")}
						title="Copy expression"
					>
						{copiedField === "expression" ? (
							<CheckIcon className={styles.copyIcon} />
						) : (
							<ClipboardDocumentIcon className={styles.copyIcon} />
						)}
					</button>
				</div>
				<p className={styles.descriptionText}>{description}</p>
			</div>

			{/* Manual Input Mode */}
			<div className={styles.glassCard}>
				<div className={`flex items-center gap-3 mb-4`}>
					<InformationCircleIcon className={`w-6 h-6 ${styles.accentIcon}`} />
					<h2 className={styles.sectionTitle}>Paste &amp; Explain</h2>
				</div>
				<div className={`flex gap-3 ${styles.manualRow}`}>
					<input
						type="text"
						value={manualInput}
						onChange={(e) => {
							setManualInput(e.target.value);
							setIsManualMode(true);
						}}
						className={styles.input}
						placeholder="Paste a cron expression, e.g. 0 */2 * * 1-5"
					/>
					<button className={styles.btnPrimary} onClick={loadManualExpression}>
						Load into Builder
					</button>
				</div>
			</div>

			{/* Presets */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Common Presets</h2>
				<div className={`flex flex-wrap gap-2 ${styles.presetsGrid}`}>
					{PRESETS.map((preset) => (
						<button
							key={preset.expression}
							className={`${styles.presetBtn} ${expression === preset.expression ? styles.active : ""}`}
							onClick={() => applyPreset(preset)}
							title={preset.description}
						>
							{preset.label}
						</button>
					))}
				</div>
			</div>

			{/* Field Builder */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Expression Builder</h2>
				<div className={`flex flex-col gap-4`}>
					{FIELD_NAMES.map((name, index) => {
						const field = fields[index];
						const range = FIELD_RANGES[index];
						return (
							<div key={name} className={`flex flex-col gap-2 p-4 rounded-lg ${styles.fieldRow}`}>
								<div className={`flex items-center justify-between`}>
									<label className={styles.fieldLabel}>
										{name}
										<span className={styles.fieldRange}>
											({range.min}-{range.max})
										</span>
									</label>
									<code className={styles.fieldPreview}>{fieldToString(field, index)}</code>
								</div>
								<div className={`flex flex-wrap items-center gap-3 ${styles.fieldControls}`}>
									<select
										className={styles.modeSelect}
										value={field.mode}
										onChange={(e) => {
											updateField(index, { mode: e.target.value as FieldMode });
											setIsManualMode(false);
										}}
									>
										<option value="every">Every (*)</option>
										<option value="specific">Specific</option>
										<option value="range">Range</option>
										<option value="step">Step (/)</option>
									</select>

									{field.mode === "specific" && (
										<input
											type="text"
											className={styles.fieldInput}
											value={field.specific}
											onChange={(e) => {
												updateField(index, { specific: e.target.value });
												setIsManualMode(false);
											}}
											placeholder={
												range.labels
													? `e.g. ${Object.keys(range.labels).slice(0, 3).join(",")}`
													: `e.g. ${range.min},${range.min + 1}`
											}
										/>
									)}

									{field.mode === "range" && (
										<div className={`flex items-center gap-2`}>
											<input
												type="number"
												className={styles.fieldInputSmall}
												min={range.min}
												max={range.max}
												value={field.rangeStart}
												onChange={(e) => {
													updateField(index, { rangeStart: e.target.value });
													setIsManualMode(false);
												}}
												placeholder={String(range.min)}
											/>
											<span className={styles.rangeSeparator}>to</span>
											<input
												type="number"
												className={styles.fieldInputSmall}
												min={range.min}
												max={range.max}
												value={field.rangeEnd}
												onChange={(e) => {
													updateField(index, { rangeEnd: e.target.value });
													setIsManualMode(false);
												}}
												placeholder={String(range.max)}
											/>
										</div>
									)}

									{field.mode === "step" && (
										<div className={`flex items-center gap-2`}>
											<input
												type="text"
												className={styles.fieldInputSmall}
												value={field.stepBase}
												onChange={(e) => {
													updateField(index, { stepBase: e.target.value });
													setIsManualMode(false);
												}}
												placeholder="*"
											/>
											<span className={styles.rangeSeparator}>/</span>
											<input
												type="number"
												className={styles.fieldInputSmall}
												min={1}
												value={field.stepValue}
												onChange={(e) => {
													updateField(index, { stepValue: e.target.value });
													setIsManualMode(false);
												}}
												placeholder="2"
											/>
										</div>
									)}

									{field.mode !== "every" && range.labels && (
										<div className={styles.labelHint}>
											{Object.entries(range.labels).map(([val, lbl]) => (
												<span key={val} className={styles.labelTag}>
													{val}={lbl}
												</span>
											))}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Next Runs */}
			{nextRuns.length > 0 && (
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Next Run Times</h2>
					<div className={`${styles.runsList}`}>
						{nextRuns.map((date, i) => (
							<div key={i} className={`flex items-center gap-3 ${styles.runItem}`}>
								<span className={styles.runIndex}>{i + 1}</span>
								<span className={styles.runDate}>
									{date.toLocaleString("en-US", {
										weekday: "short",
										year: "numeric",
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
										hour12: true,
									})}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Reference Table */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Cron Syntax Reference</h2>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Field</th>
								<th>Range</th>
								<th>Special Characters</th>
								<th>Example</th>
							</tr>
						</thead>
						<tbody>
							{REFERENCE_DATA.map((row) => (
								<tr key={row.field}>
									<td>{row.field}</td>
									<td><code>{row.range}</code></td>
									<td><code>{row.specials}</code></td>
									<td><code>{row.example}</code></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className={`mt-4 ${styles.infoGrid}`}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Special Characters</h3>
						<p className={styles.infoText}>
							<code>*</code> matches all values. <code>,</code> separates list items (e.g. <code>1,3,5</code>).
							<code>-</code> defines a range (e.g. <code>1-5</code>). <code>/</code> defines a step (e.g. <code>*/10</code>).
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Day of Week</h3>
						<p className={styles.infoText}>
							Sunday is <code>0</code>, Saturday is <code>6</code>. Some systems also accept <code>7</code> as Sunday.
							Three-letter abbreviations (SUN-SAT) are supported by some implementations.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
