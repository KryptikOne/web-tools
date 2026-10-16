"use client";

import { useState, useCallback } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./TimeDurationCalculator.module.scss";

type DateMode = "difference" | "add_subtract";

const DATE_MODES: { value: DateMode; label: string }[] = [
	{ value: "difference", label: "Date Difference" },
	{ value: "add_subtract", label: "Add / Subtract" },
];

// Reference charts
const UNIT_TO_SECONDS = [
	{ unit: "1 minute", seconds: "60 s" },
	{ unit: "1 hour", seconds: "3,600 s" },
	{ unit: "1 day", seconds: "86,400 s" },
	{ unit: "1 week", seconds: "604,800 s" },
	{ unit: "1 month (avg)", seconds: "2,629,746 s" },
	{ unit: "1 year (avg)", seconds: "31,556,952 s" },
];

const DAYS_AND_HOURS = [
	{ unit: "1 week", value: "7 d / 168 h" },
	{ unit: "1 fortnight", value: "14 d / 336 h" },
	{ unit: "1 month (avg)", value: "30.44 d / 730.5 h" },
	{ unit: "1 quarter (avg)", value: "91.31 d / 2,191.5 h" },
	{ unit: "1 year (avg)", value: "365.25 d / 8,766 h" },
	{ unit: "1 leap year", value: "366 d / 8,784 h" },
];

const COMMON_DURATIONS = [
	{ description: "Work day", value: "8 h / 480 min" },
	{ description: "Work week", value: "40 h / 2,400 min" },
	{ description: "Work year", value: "~260 days / 2,080 h" },
	{ description: "Fortnight", value: "14 days / 2 weeks" },
	{ description: "Quarter", value: "~13 weeks / 91.3 days" },
	{ description: "Decade", value: "10 years / ~3,652.5 days" },
	{ description: "One million seconds", value: "~11.57 days" },
	{ description: "One billion seconds", value: "~31.7 years" },
];

function getToday(): string {
	const d = new Date();
	return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getNow(): string {
	const d = new Date();
	return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export default function TimeDurationCalculator() {
	const [mode, setMode] = useState<DateMode>("difference");

	// Date difference state
	const [startDate, setStartDate] = useState<string>(getToday());
	const [startTime, setStartTime] = useState<string>("09:00");
	const [endDate, setEndDate] = useState<string>(getToday());
	const [endTime, setEndTime] = useState<string>("17:00");

	// Add/subtract state
	const [baseDate, setBaseDate] = useState<string>(getToday());
	const [baseTime, setBaseTime] = useState<string>(getNow());
	const [addYears, setAddYears] = useState<string>("0");
	const [addMonths, setAddMonths] = useState<string>("0");
	const [addDays, setAddDays] = useState<string>("0");
	const [addHours, setAddHours] = useState<string>("0");
	const [addMinutes, setAddMinutes] = useState<string>("0");
	const [isSubtract, setIsSubtract] = useState<boolean>(false);

	// Date difference logic
	const calculateDifference = useCallback(() => {
		const start = new Date(`${startDate}T${startTime}:00`);
		const end = new Date(`${endDate}T${endTime}:00`);

		if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

		const diffMs = Math.abs(end.getTime() - start.getTime());
		const totalSeconds = Math.floor(diffMs / 1000);
		const totalMinutes = Math.floor(diffMs / 60000);
		const totalHours = Math.floor(diffMs / 3600000);
		const totalDays = Math.floor(diffMs / 86400000);

		// Calculate working days (exclude weekends)
		let workingDays = 0;
		const earlier = start < end ? start : end;
		const later = start < end ? end : start;
		const current = new Date(earlier);
		while (current < later) {
			const dayOfWeek = current.getDay();
			if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
			current.setDate(current.getDate() + 1);
		}

		// Breakdown
		const years = Math.floor(totalDays / 365.25);
		const remainingAfterYears = totalDays - Math.floor(years * 365.25);
		const months = Math.floor(remainingAfterYears / 30.44);
		const days = Math.floor(remainingAfterYears - months * 30.44);
		const hours = Math.floor((diffMs % 86400000) / 3600000);
		const minutes = Math.floor((diffMs % 3600000) / 60000);
		const seconds = Math.floor((diffMs % 60000) / 1000);

		return { years, months, days, hours, minutes, seconds, totalDays, totalHours, totalMinutes, totalSeconds, workingDays };
	}, [startDate, startTime, endDate, endTime]);

	// Add/subtract logic
	const calculateAddSubtract = useCallback(() => {
		const base = new Date(`${baseDate}T${baseTime}:00`);
		if (isNaN(base.getTime())) return null;

		const multiplier = isSubtract ? -1 : 1;
		const result = new Date(base);

		result.setFullYear(result.getFullYear() + parseInt(addYears || "0") * multiplier);
		result.setMonth(result.getMonth() + parseInt(addMonths || "0") * multiplier);
		result.setDate(result.getDate() + parseInt(addDays || "0") * multiplier);
		result.setHours(result.getHours() + parseInt(addHours || "0") * multiplier);
		result.setMinutes(result.getMinutes() + parseInt(addMinutes || "0") * multiplier);

		return result;
	}, [baseDate, baseTime, addYears, addMonths, addDays, addHours, addMinutes, isSubtract]);

	const diffResult = calculateDifference();
	const addSubResult = calculateAddSubtract();

	const diffBreakdown = diffResult
		? [
				{ label: "Years", value: diffResult.years },
				{ label: "Months", value: diffResult.months },
				{ label: "Days", value: diffResult.days },
				{ label: "Hours", value: diffResult.hours },
				{ label: "Minutes", value: diffResult.minutes },
				{ label: "Seconds", value: diffResult.seconds },
			]
		: [];

	const addSubFields = [
		{ id: "years", label: "Years", value: addYears, set: setAddYears },
		{ id: "months", label: "Months", value: addMonths, set: setAddMonths },
		{ id: "days", label: "Days", value: addDays, set: setAddDays },
		{ id: "hours", label: "Hours", value: addHours, set: setAddHours },
		{ id: "minutes", label: "Minutes", value: addMinutes, set: setAddMinutes },
	];

	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("time")!} initialUnitId="hr" initialValue="1" />
			</div>

			{/* Date calculator: difference between two dates, or add/subtract a duration */}
			<div className={styles.glassCard}>
				<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
					<h3 className={`${styles.chartTitle} mb-0`}>Date Calculator</h3>
					<SegmentedControl label="Date calculator mode" size="sm" fill={false} value={mode} onChange={setMode} options={DATE_MODES} />
				</div>

				{mode === "difference" && (
					<>
						<div className={styles.dateInputs}>
							<div className={styles.dateGroup}>
								<span className={styles.inputLabel}>Start Date &amp; Time</span>
								<div className={styles.inputRow}>
									<input
										type="date"
										aria-label="Start date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
										className={styles.dateInput}
									/>
									<input
										type="time"
										aria-label="Start time"
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
										className={styles.dateInput}
									/>
								</div>
							</div>
							<div className={styles.dateGroup}>
								<span className={styles.inputLabel}>End Date &amp; Time</span>
								<div className={styles.inputRow}>
									<input type="date" aria-label="End date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.dateInput} />
									<input type="time" aria-label="End time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={styles.dateInput} />
								</div>
							</div>
						</div>

						{diffResult && (
							<>
								<div className={styles.resultCards}>
									{diffBreakdown.map((item) => (
										<div key={item.label} className={styles.resultCard}>
											<span className={styles.resultCardValue}>{item.value}</span>
											<span className={styles.resultCardLabel}>{item.label}</span>
										</div>
									))}
								</div>

								<div className={styles.resultSummary}>
									<span className={styles.resultText}>
										Total: <strong>{diffResult.totalDays.toLocaleString()} days</strong> / <strong>{diffResult.totalHours.toLocaleString()} hours</strong> /{" "}
										<strong>{diffResult.totalMinutes.toLocaleString()} minutes</strong> | Working days: <strong>{diffResult.workingDays.toLocaleString()}</strong>
									</span>
								</div>
							</>
						)}
					</>
				)}

				{mode === "add_subtract" && (
					<>
						<div className="flex flex-wrap items-end gap-4">
							<div className={`${styles.dateGroup} flex-1 min-w-0`}>
								<span className={styles.inputLabel}>Starting Date &amp; Time</span>
								<div className={styles.inputRow}>
									<input
										type="date"
										aria-label="Starting date"
										value={baseDate}
										onChange={(e) => setBaseDate(e.target.value)}
										className={styles.dateInput}
									/>
									<input
										type="time"
										aria-label="Starting time"
										value={baseTime}
										onChange={(e) => setBaseTime(e.target.value)}
										className={styles.dateInput}
									/>
								</div>
							</div>
							<SegmentedControl
								label="Add or subtract"
								size="sm"
								fill={false}
								value={isSubtract ? "subtract" : "add"}
								onChange={(v) => setIsSubtract(v === "subtract")}
								options={[
									{ value: "add", label: "Add (+)" },
									{ value: "subtract", label: "Subtract (−)" },
								]}
							/>
						</div>

						<div className={styles.addSubtractGrid}>
							{addSubFields.map((field) => (
								<div key={field.id} className={styles.fieldGroup}>
									<label htmlFor={`duration-add-${field.id}`} className={styles.inputLabel}>
										{field.label}
									</label>
									<input
										id={`duration-add-${field.id}`}
										type="number"
										inputMode="numeric"
										min="0"
										value={field.value}
										onChange={(e) => field.set(e.target.value)}
										className={styles.numberInput}
									/>
								</div>
							))}
						</div>

						{addSubResult && !isNaN(addSubResult.getTime()) && (
							<div className={styles.resultSummary}>
								<span className={styles.resultText}>
									Result:{" "}
									<strong>
										{addSubResult.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
										{" at "}
										{addSubResult.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
									</strong>
								</span>
							</div>
						)}
					</>
				)}
			</div>

			{/* Reference Charts */}
			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Unit to Seconds</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Unit</th>
									<th>Seconds</th>
								</tr>
							</thead>
							<tbody>
								{UNIT_TO_SECONDS.map((row) => (
									<tr key={row.unit}>
										<td>{row.unit}</td>
										<td>{row.seconds}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Days and Hours</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Unit</th>
									<th>Days / Hours</th>
								</tr>
							</thead>
							<tbody>
								{DAYS_AND_HOURS.map((row) => (
									<tr key={row.unit}>
										<td>{row.unit}</td>
										<td>{row.value}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Common Durations */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Common Duration References</h3>
				<div className={styles.referencesGrid}>
					{COMMON_DURATIONS.map((item) => (
						<div key={item.description} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.value}</span>
						</div>
					))}
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Leap Years</h4>
						<p>Leap years occur every 4 years (except centuries, unless divisible by 400). This adds 1 day to February.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Unix Timestamp</h4>
						<p>Unix time counts seconds since Jan 1, 1970 UTC. Current time is roughly 1.7+ billion seconds.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Working Days</h4>
						<p>A standard work year has ~260 working days (52 weeks x 5 days), not counting holidays.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Month Lengths</h4>
						<p>30 days: Apr, Jun, Sep, Nov. 31 days: Jan, Mar, May, Jul, Aug, Oct, Dec. Feb: 28/29 days.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
