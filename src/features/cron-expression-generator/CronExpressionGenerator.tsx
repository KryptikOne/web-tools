"use client";

import { useCallback, useMemo, useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import {
	CRON_FIELDS,
	CRON_PRESETS,
	createDefaultCronField,
	cronFieldToString,
	describeCronExpression,
	getNextCronRuns,
	isValidCronExpression,
	parseCronExpression,
	parseCronToken,
	type CronField,
	type CronFieldMode,
} from "@/lib/cronUtils";
import { COMMON_TIME_ZONES, LOCAL_TIME_ZONE, resolveTimeZone } from "@/lib/dateTimeUtils";
import styles from "./CronExpressionGenerator.module.scss";

const MODE_OPTIONS: { value: CronFieldMode; label: string }[] = [
	{ value: "every", label: "Every" },
	{ value: "specific", label: "Value" },
	{ value: "range", label: "Range" },
	{ value: "step", label: "Step" },
];

const REFERENCE_DATA = [
	{ field: "Minute", range: "0-59", specials: "* , - /", example: "*/5 = every 5 minutes" },
	{ field: "Hour", range: "0-23", specials: "* , - /", example: "9-17 = 9 AM to 5 PM" },
	{ field: "Day of month", range: "1-31", specials: "* , - /", example: "1,15 = 1st and 15th" },
	{ field: "Month", range: "1-12 or JAN-DEC", specials: "* , - /", example: "1-6 = January to June" },
	{ field: "Day of week", range: "0-6 or SUN-SAT (Sun=0)", specials: "* , - /", example: "1-5 = weekdays" },
];

function fieldsToExpression(fields: CronField[]): string {
	return fields.map((f, i) => cronFieldToString(f, i)).join(" ");
}

export default function CronExpressionGenerator() {
	const [fields, setFields] = useState<CronField[]>(() => {
		const initial = Array.from({ length: 5 }, () => createDefaultCronField());
		initial[0] = { ...initial[0], mode: "specific", specific: "30" };
		initial[1] = { ...initial[1], mode: "specific", specific: "9" };
		initial[4] = { ...initial[4], mode: "range", rangeStart: "1", rangeEnd: "5" };
		return initial;
	});
	const [expressionInput, setExpressionInput] = useState(() => "30 9 * * 1-5");
	const [tokenDrafts, setTokenDrafts] = useState<Record<number, string>>({});
	const [timeZone, setTimeZone] = useState(LOCAL_TIME_ZONE);
	const { copy, isCopied } = useClipboard();

	const expression = useMemo(() => fieldsToExpression(fields), [fields]);
	const isValid = useMemo(() => isValidCronExpression(expression), [expression]);
	const description = useMemo(
		() => (isValid ? describeCronExpression(expression) : "Invalid cron expression"),
		[expression, isValid]
	);
	const nextRuns = useMemo(
		() => (isValid ? getNextCronRuns(expression, 10, timeZone) : []),
		[expression, isValid, timeZone]
	);

	/** Apply new fields from the builder rows and mirror them into the expression box. */
	const commitFields = useCallback((next: CronField[]) => {
		setFields(next);
		setExpressionInput(fieldsToExpression(next));
		setTokenDrafts({});
	}, []);

	const updateField = useCallback(
		(index: number, updates: Partial<CronField>) => {
			const next = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
			commitFields(next);
		},
		[fields, commitFields]
	);

	const handleExpressionInput = (value: string) => {
		setExpressionInput(value);
		const parsed = parseCronExpression(value);
		if (parsed) {
			setFields(parsed);
			setTokenDrafts({});
		}
	};

	const handleTokenInput = (index: number, value: string) => {
		setTokenDrafts((prev) => ({ ...prev, [index]: value }));
		const token = value.trim();
		if (!token) return;
		const next = fields.map((f, i) => (i === index ? parseCronToken(token, index) : f));
		setFields(next);
		setExpressionInput(fieldsToExpression(next));
	};

	const applyPreset = (preset: string) => {
		const parsed = parseCronExpression(preset);
		if (parsed) commitFields(parsed);
	};

	const tz = resolveTimeZone(timeZone);
	const formatRun = (d: Date) =>
		d.toLocaleString("en-US", {
			timeZone: tz,
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

	return (
		<div className={styles.container}>
			<div className={styles.panel}>
				{/* Expression */}
				<div className={styles.expressionRow}>
					<label htmlFor="cron-expression" className={styles.rowLabel}>
						Expression
					</label>
					<input
						id="cron-expression"
						type="text"
						value={expressionInput}
						onChange={(e) => handleExpressionInput(e.target.value)}
						className={`${styles.expressionInput} ${isValid ? "" : styles.invalid}`}
						placeholder="* * * * *"
						spellCheck={false}
						autoComplete="off"
					/>
					<button
						type="button"
						className={`${styles.copyBtn} ${isCopied("expression") ? styles.copied : ""}`}
						onClick={() => copy(expression, "expression")}
						disabled={!isValid}
					>
						{isCopied("expression") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
						{isCopied("expression") ? "Copied" : "Copy"}
					</button>
				</div>

				{/* Presets */}
				<div className={styles.presetsRow}>
					<span className={styles.rowLabel}>Presets</span>
					<div className="flex flex-wrap gap-1.5">
						{CRON_PRESETS.map((preset) => (
							<button
								key={preset.expression}
								type="button"
								className={`${styles.presetBtn} ${expression === preset.expression ? styles.active : ""}`}
								onClick={() => applyPreset(preset.expression)}
								title={preset.description}
							>
								{preset.label}
							</button>
						))}
					</div>
				</div>

				{/* Field rows */}
				{CRON_FIELDS.map((spec, index) => {
					const field = fields[index];
					const token = tokenDrafts[index] ?? cronFieldToString(field, index);
					return (
						<div key={spec.name} className={styles.fieldRow}>
							<span className={styles.rowLabel}>
								{spec.name}
								<span className={styles.rowRange}>
									{spec.min}–{spec.max}
								</span>
							</span>
							<div className={styles.fieldControls}>
								<SegmentedControl<CronFieldMode>
									label={`${spec.name} mode`}
									size="sm"
									fill={false}
									value={field.mode}
									onChange={(mode) => updateField(index, { mode })}
									options={MODE_OPTIONS}
								/>

								{field.mode === "specific" && (
									<input
										type="text"
										aria-label={`${spec.name} value`}
										className={styles.smallInput}
										value={field.specific}
										onChange={(e) => updateField(index, { specific: e.target.value })}
										placeholder={spec.labels ? "e.g. 1,3,5" : `${spec.min},${spec.min + 1}`}
									/>
								)}
								{field.mode === "range" && (
									<div className="flex items-center gap-2">
										<input
											type="number"
											aria-label={`${spec.name} from`}
											className={styles.smallInput}
											min={spec.min}
											max={spec.max}
											value={field.rangeStart}
											onChange={(e) => updateField(index, { rangeStart: e.target.value })}
											placeholder={String(spec.min)}
										/>
										<span className={styles.sep}>–</span>
										<input
											type="number"
											aria-label={`${spec.name} to`}
											className={styles.smallInput}
											min={spec.min}
											max={spec.max}
											value={field.rangeEnd}
											onChange={(e) => updateField(index, { rangeEnd: e.target.value })}
											placeholder={String(spec.max)}
										/>
									</div>
								)}
								{field.mode === "step" && (
									<div className="flex items-center gap-2">
										<input
											type="text"
											aria-label={`${spec.name} step base`}
											className={styles.smallInput}
											value={field.stepBase}
											onChange={(e) => updateField(index, { stepBase: e.target.value })}
											placeholder="*"
										/>
										<span className={styles.sep}>/</span>
										<input
											type="number"
											aria-label={`${spec.name} step`}
											className={styles.smallInput}
											min={1}
											value={field.stepValue}
											onChange={(e) => updateField(index, { stepValue: e.target.value })}
											placeholder="2"
										/>
									</div>
								)}

								<input
									type="text"
									aria-label={`${spec.name} field`}
									className={`${styles.tokenInput} ${isValidCronExpression(fields.map((f, i) => (i === index ? token : cronFieldToString(f, i))).join(" ")) ? "" : styles.invalid}`}
									value={token}
									onChange={(e) => handleTokenInput(index, e.target.value)}
									spellCheck={false}
									autoComplete="off"
								/>
							</div>
							{field.mode !== "every" && spec.labels && (
								<div className={styles.labelHint}>
									{Object.entries(spec.labels).map(([val, lbl]) => (
										<span key={val} className={styles.labelTag}>
											{val}={lbl}
										</span>
									))}
								</div>
							)}
						</div>
					);
				})}

				{/* Result */}
				<div className={styles.resultRow}>
					<code className={`${styles.expressionValue} ${isValid ? "" : styles.invalidText}`}>{expression}</code>
				</div>
				<div className={styles.descriptionRow}>{description}</div>

				{/* Next runs */}
				<div className={styles.runsRow}>
					<div className={styles.runsHeader}>
						<span className={styles.rowLabel}>Next runs</span>
						<label className="sr-only" htmlFor="cron-timezone">
							Time zone
						</label>
						<select
							id="cron-timezone"
							className={styles.tzSelect}
							value={timeZone}
							onChange={(e) => setTimeZone(e.target.value)}
						>
							{COMMON_TIME_ZONES.map((z) => (
								<option key={z.value} value={z.value}>
									{z.label}
								</option>
							))}
						</select>
					</div>
					{nextRuns.length === 0 ? (
						<span className={styles.hint}>{isValid ? "No runs in the next five years." : "Fix the expression to see upcoming runs."}</span>
					) : (
						<div className="flex flex-wrap gap-1.5">
							{nextRuns.map((d, i) => (
								<span key={i} className={styles.runChip}>
									{formatRun(d)}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Reference */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>Cron syntax reference</h2>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Field</th>
								<th>Range</th>
								<th>Special characters</th>
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
						<h3 className={styles.infoSubtitle}>Special characters</h3>
						<p className={styles.infoText}>
							<code>*</code> matches all values. <code>,</code> separates list items (e.g. <code>1,3,5</code>).
							<code>-</code> defines a range (e.g. <code>1-5</code>). <code>/</code> defines a step (e.g. <code>*/10</code>).
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Day of week and day of month</h3>
						<p className={styles.infoText}>
							Sunday is <code>0</code> (or <code>7</code>), Saturday is <code>6</code>. Names such as <code>MON-FRI</code> and{" "}
							<code>JAN</code> are accepted and normalised. When both day fields are restricted, standard cron runs on days
							matching <em>either</em> one.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
