"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./TimeDurationCalculator.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Duration units (base: seconds)
const DURATION_UNITS: ConversionUnit[] = [
	{ id: "ms", name: "Milliseconds", abbrev: "ms", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
	{ id: "s", name: "Seconds", abbrev: "s", toBase: (v) => v, fromBase: (v) => v },
	{ id: "min", name: "Minutes", abbrev: "min", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
	{ id: "hr", name: "Hours", abbrev: "hr", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
	{ id: "day", name: "Days", abbrev: "days", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
	{ id: "week", name: "Weeks", abbrev: "weeks", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
	{ id: "month", name: "Months (avg)", abbrev: "months", toBase: (v) => v * 2629746, fromBase: (v) => v / 2629746 },
	{ id: "year", name: "Years (avg)", abbrev: "years", toBase: (v) => v * 31556952, fromBase: (v) => v / 31556952 },
];

const TIME_EQUIVALENTS = [
	{ description: "1 year", equivalent: "365.25 days / 8,766 hours" },
	{ description: "1 month (avg)", equivalent: "30.44 days / 730.5 hours" },
	{ description: "1 week", equivalent: "7 days / 168 hours" },
	{ description: "1 day", equivalent: "24 hours / 1,440 minutes" },
	{ description: "1 hour", equivalent: "60 minutes / 3,600 seconds" },
	{ description: "1 minute", equivalent: "60 seconds / 60,000 ms" },
	{ description: "Work year (standard)", equivalent: "~260 working days" },
	{ description: "Work month (avg)", equivalent: "~21.7 working days" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

function getToday(): string {
	const d = new Date();
	return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getNow(): string {
	const d = new Date();
	return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export default function TimeDurationCalculator() {
	const [mode, setMode] = useState<"converter" | "difference" | "add_subtract">("converter");

	// Converter state
	const [fromUnit, setFromUnit] = useState<string>("hr");
	const [toUnit, setToUnit] = useState<string>("min");
	const [inputValue, setInputValue] = useState<string>("1");

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

	// Converter logic
	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = DURATION_UNITS.find((u) => u.id === fromUnit);
		const to = DURATION_UNITS.find((u) => u.id === toUnit);

		if (!from || !to) return "";

		const baseValue = from.toBase(value);
		const result = to.fromBase(baseValue);

		return formatNumber(result);
	}, [inputValue, fromUnit, toUnit]);

	const swapUnits = () => {
		const temp = fromUnit;
		setFromUnit(toUnit);
		setToUnit(temp);
	};

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

	const converterResult = convert();
	const diffResult = calculateDifference();
	const addSubResult = calculateAddSubtract();

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Time Duration Calculator</h2>

				<div className={styles.modeTabs}>
					<button className={`${styles.modeTab} ${mode === "converter" ? styles.activeTab : ""}`} onClick={() => setMode("converter")}>
						Duration Converter
					</button>
					<button className={`${styles.modeTab} ${mode === "difference" ? styles.activeTab : ""}`} onClick={() => setMode("difference")}>
						Date Difference
					</button>
					<button className={`${styles.modeTab} ${mode === "add_subtract" ? styles.activeTab : ""}`} onClick={() => setMode("add_subtract")}>
						Add / Subtract
					</button>
				</div>

				{/* Duration Converter Mode */}
				{mode === "converter" && (
					<>
						<div className={styles.converterGrid}>
							<div className={styles.converterInput}>
								<label className={styles.inputLabel}>From</label>
								<div className={styles.inputRow}>
									<input
										type="number"
										inputMode="decimal"
										value={inputValue}
										onChange={(e) => setInputValue(e.target.value)}
										className={styles.numberInput}
										placeholder="Enter value"
									/>
									<select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={styles.unitSelect}>
										{DURATION_UNITS.map((unit) => (
											<option key={unit.id} value={unit.id}>
												{unit.name} ({unit.abbrev})
											</option>
										))}
									</select>
								</div>
							</div>

							<button className={styles.swapButton} onClick={swapUnits} title="Swap units">
								<ArrowsRightLeftIcon className="w-5 h-5" />
							</button>

							<div className={styles.converterInput}>
								<label className={styles.inputLabel}>To</label>
								<div className={styles.inputRow}>
									<div className={styles.resultDisplay}>{converterResult || "—"}</div>
									<select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={styles.unitSelect}>
										{DURATION_UNITS.map((unit) => (
											<option key={unit.id} value={unit.id}>
												{unit.name} ({unit.abbrev})
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{converterResult && (
							<div className={styles.resultSummary}>
								<span className={styles.resultText}>
									{inputValue} {DURATION_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
									<strong>
										{converterResult} {DURATION_UNITS.find((u) => u.id === toUnit)?.abbrev}
									</strong>
								</span>
							</div>
						)}
					</>
				)}

				{/* Date Difference Mode */}
				{mode === "difference" && (
					<>
						<div className={styles.dateInputs}>
							<div className={styles.dateGroup}>
								<label className={styles.inputLabel}>Start Date & Time</label>
								<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.dateInput} />
								<input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={styles.dateInput} />
							</div>
							<div className={styles.dateGroup}>
								<label className={styles.inputLabel}>End Date & Time</label>
								<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.dateInput} />
								<input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={styles.dateInput} />
							</div>
						</div>

						{diffResult && (
							<>
								<div className={styles.resultCards}>
									<div className={styles.resultCard}>
										<span className={styles.resultCardValue}>{diffResult.years}</span>
										<span className={styles.resultCardLabel}>Years</span>
									</div>
									<div className={styles.resultCard}>
										<span className={styles.resultCardValue}>{diffResult.months}</span>
										<span className={styles.resultCardLabel}>Months</span>
									</div>
									<div className={styles.resultCard}>
										<span className={styles.resultCardValue}>{diffResult.days}</span>
										<span className={styles.resultCardLabel}>Days</span>
									</div>
									<div className={styles.resultCard}>
										<span className={styles.resultCardValue}>{diffResult.hours}</span>
										<span className={styles.resultCardLabel}>Hours</span>
									</div>
									<div className={styles.resultCard}>
										<span className={styles.resultCardValue}>{diffResult.minutes}</span>
										<span className={styles.resultCardLabel}>Minutes</span>
									</div>
									<div className={styles.resultCard}>
										<span className={styles.resultCardValue}>{diffResult.seconds}</span>
										<span className={styles.resultCardLabel}>Seconds</span>
									</div>
								</div>

								<div className={styles.resultSummary}>
									<span className={styles.resultText}>
										Total: <strong>{diffResult.totalDays.toLocaleString()} days</strong> /{" "}
										<strong>{diffResult.totalHours.toLocaleString()} hours</strong> /{" "}
										<strong>{diffResult.totalMinutes.toLocaleString()} minutes</strong> |{" "}
										Working days: <strong>{diffResult.workingDays.toLocaleString()}</strong>
									</span>
								</div>
							</>
						)}
					</>
				)}

				{/* Add/Subtract Mode */}
				{mode === "add_subtract" && (
					<>
						<div className={styles.dateGroup}>
							<label className={styles.inputLabel}>Starting Date & Time</label>
							<div className={styles.inputRow}>
								<input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className={styles.dateInput} />
								<input type="time" value={baseTime} onChange={(e) => setBaseTime(e.target.value)} className={styles.dateInput} />
							</div>
						</div>

						<div className={styles.toggleRow}>
							<button className={`${styles.toggleBtn} ${!isSubtract ? styles.toggleBtnActive : ""}`} onClick={() => setIsSubtract(false)}>
								Add (+)
							</button>
							<button className={`${styles.toggleBtn} ${isSubtract ? styles.toggleBtnActive : ""}`} onClick={() => setIsSubtract(true)}>
								Subtract (−)
							</button>
						</div>

						<div className={styles.addSubtractGrid}>
							<div className={styles.converterInput}>
								<label className={styles.inputLabel}>Years</label>
								<input type="number" value={addYears} onChange={(e) => setAddYears(e.target.value)} className={styles.numberInput} min="0" />
							</div>
							<div className={styles.converterInput}>
								<label className={styles.inputLabel}>Months</label>
								<input type="number" value={addMonths} onChange={(e) => setAddMonths(e.target.value)} className={styles.numberInput} min="0" />
							</div>
							<div className={styles.converterInput}>
								<label className={styles.inputLabel}>Days</label>
								<input type="number" value={addDays} onChange={(e) => setAddDays(e.target.value)} className={styles.numberInput} min="0" />
							</div>
							<div className={styles.converterInput}>
								<label className={styles.inputLabel}>Hours</label>
								<input type="number" value={addHours} onChange={(e) => setAddHours(e.target.value)} className={styles.numberInput} min="0" />
							</div>
							<div className={styles.converterInput}>
								<label className={styles.inputLabel}>Minutes</label>
								<input type="number" value={addMinutes} onChange={(e) => setAddMinutes(e.target.value)} className={styles.numberInput} min="0" />
							</div>
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

			{/* Time Equivalents Reference */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Time Equivalents</h3>
				<div className={styles.referencesGrid}>
					{TIME_EQUIVALENTS.map((item, i) => (
						<div key={i} className={styles.referenceCard}>
							<span className={styles.referenceLabel}>{item.description}</span>
							<span className={styles.referenceValue}>{item.equivalent}</span>
						</div>
					))}
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Leap Years</h4>
						<p>Leap years occur every 4 years (except centuries, unless divisible by 400). This adds 1 day to February.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Unix Timestamp</h4>
						<p>Unix time counts seconds since Jan 1, 1970 UTC. Current time ≈ 1.7+ billion seconds.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Working Days</h4>
						<p>A standard work year has ~260 working days (52 weeks × 5 days), not counting holidays.</p>
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
