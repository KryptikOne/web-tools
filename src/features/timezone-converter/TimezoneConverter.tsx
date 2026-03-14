"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowsRightLeftIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import styles from "./TimezoneConverter.module.scss";

// Common timezone data with UTC offsets
interface TimezoneInfo {
	id: string;
	name: string;
	abbrev: string;
	offset: number; // hours from UTC (can be fractional like 5.5 for India)
	region: string;
}

const TIMEZONES: TimezoneInfo[] = [
	// North America
	{ id: "pst", name: "Pacific Time", abbrev: "PST/PDT", offset: -8, region: "North America" },
	{ id: "mst", name: "Mountain Time", abbrev: "MST/MDT", offset: -7, region: "North America" },
	{ id: "cst", name: "Central Time", abbrev: "CST/CDT", offset: -6, region: "North America" },
	{ id: "est", name: "Eastern Time", abbrev: "EST/EDT", offset: -5, region: "North America" },
	{ id: "ast", name: "Atlantic Time", abbrev: "AST/ADT", offset: -4, region: "North America" },
	{ id: "nst", name: "Newfoundland", abbrev: "NST/NDT", offset: -3.5, region: "North America" },

	// South America
	{ id: "brt", name: "Brasilia Time", abbrev: "BRT", offset: -3, region: "South America" },
	{ id: "art", name: "Argentina Time", abbrev: "ART", offset: -3, region: "South America" },

	// Europe & Africa
	{ id: "utc", name: "UTC / GMT", abbrev: "UTC", offset: 0, region: "Universal" },
	{ id: "gmt", name: "Greenwich Mean Time", abbrev: "GMT", offset: 0, region: "Europe" },
	{ id: "wet", name: "Western European", abbrev: "WET/WEST", offset: 0, region: "Europe" },
	{ id: "cet", name: "Central European", abbrev: "CET/CEST", offset: 1, region: "Europe" },
	{ id: "eet", name: "Eastern European", abbrev: "EET/EEST", offset: 2, region: "Europe" },
	{ id: "msk", name: "Moscow Time", abbrev: "MSK", offset: 3, region: "Europe" },

	// Middle East
	{ id: "gst", name: "Gulf Standard", abbrev: "GST", offset: 4, region: "Middle East" },
	{ id: "irst", name: "Iran Standard", abbrev: "IRST", offset: 3.5, region: "Middle East" },

	// Asia
	{ id: "pkt", name: "Pakistan Time", abbrev: "PKT", offset: 5, region: "Asia" },
	{ id: "ist", name: "India Standard", abbrev: "IST", offset: 5.5, region: "Asia" },
	{ id: "bst", name: "Bangladesh Time", abbrev: "BST", offset: 6, region: "Asia" },
	{ id: "ict", name: "Indochina Time", abbrev: "ICT", offset: 7, region: "Asia" },
	{ id: "cst_china", name: "China Standard", abbrev: "CST", offset: 8, region: "Asia" },
	{ id: "hkt", name: "Hong Kong Time", abbrev: "HKT", offset: 8, region: "Asia" },
	{ id: "sgt", name: "Singapore Time", abbrev: "SGT", offset: 8, region: "Asia" },
	{ id: "jst", name: "Japan Standard", abbrev: "JST", offset: 9, region: "Asia" },
	{ id: "kst", name: "Korea Standard", abbrev: "KST", offset: 9, region: "Asia" },

	// Oceania
	{ id: "awst", name: "Australian Western", abbrev: "AWST", offset: 8, region: "Oceania" },
	{ id: "acst", name: "Australian Central", abbrev: "ACST", offset: 9.5, region: "Oceania" },
	{ id: "aest", name: "Australian Eastern", abbrev: "AEST/AEDT", offset: 10, region: "Oceania" },
	{ id: "nzst", name: "New Zealand", abbrev: "NZST/NZDT", offset: 12, region: "Oceania" },
];

// Group timezones by region for the dropdown
const TIMEZONE_GROUPS = TIMEZONES.reduce(
	(acc, tz) => {
		if (!acc[tz.region]) acc[tz.region] = [];
		acc[tz.region].push(tz);
		return acc;
	},
	{} as Record<string, TimezoneInfo[]>,
);

// Detect user's local timezone and map to our timezone list
function detectUserTimezone(): string {
	try {
		const now = new Date();
		const offsetMinutes = now.getTimezoneOffset(); // Minutes from UTC (negative for east of UTC)
		const offsetHours = -offsetMinutes / 60; // Convert to hours (positive for east of UTC)

		// Try to find a matching timezone by offset
		const matchingZone = TIMEZONES.find((tz) => tz.offset === offsetHours);
		if (matchingZone) return matchingZone.id;

		// If no exact match, try to find the closest one
		let closestZone = TIMEZONES[0];
		let closestDiff = Math.abs(TIMEZONES[0].offset - offsetHours);

		for (const tz of TIMEZONES) {
			const diff = Math.abs(tz.offset - offsetHours);
			if (diff < closestDiff) {
				closestDiff = diff;
				closestZone = tz;
			}
		}

		return closestZone.id;
	} catch {
		return "est"; // Fallback to EST
	}
}

// Get initial time values from current local time
function getInitialTime(): { hours: number; minutes: number } {
	const now = new Date();
	return { hours: now.getHours(), minutes: now.getMinutes() };
}

function formatOffset(offset: number): string {
	const sign = offset >= 0 ? "+" : "";
	const absOffset = Math.abs(offset);
	const hours = Math.floor(absOffset);
	const minutes = (absOffset % 1) * 60;
	if (minutes === 0) {
		return `UTC${sign}${offset}`;
	}
	return `UTC${sign}${offset < 0 ? "-" : ""}${hours}:${minutes.toString().padStart(2, "0")}`;
}

function formatTime12(hours: number, minutes: number): string {
	const period = hours >= 12 ? "PM" : "AM";
	const displayHours = hours % 12 || 12;
	return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatTime24(hours: number, minutes: number): string {
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function getHourLabel(hour: number): string {
	if (hour === 0 || hour === 24) return "12a";
	if (hour === 12) return "12p";
	if (hour < 12) return `${hour}a`;
	return `${hour - 12}p`;
}

function getTimeCategory(hour: number): "night" | "early" | "morning" | "afternoon" | "evening" | "late" {
	if (hour >= 0 && hour < 6) return "night";
	if (hour >= 6 && hour < 9) return "early";
	if (hour >= 9 && hour < 12) return "morning";
	if (hour >= 12 && hour < 17) return "afternoon";
	if (hour >= 17 && hour < 21) return "evening";
	return "late";
}

export default function TimezoneConverter() {
	// Initialize with defaults that will be updated on mount to avoid hydration mismatch
	const [fromTimezone, setFromTimezone] = useState<string>("utc");
	const [toTimezone, setToTimezone] = useState<string>("pst");
	const [inputHours, setInputHours] = useState<number>(12);
	const [inputMinutes, setInputMinutes] = useState<number>(0);
	const [useCurrentTime, setUseCurrentTime] = useState<boolean>(true);
	const [use24Hour, setUse24Hour] = useState<boolean>(false);
	const [timelineZones, setTimelineZones] = useState<string[]>(["pst", "cst", "est", "utc"]);
	const [isInitialized, setIsInitialized] = useState<boolean>(false);

	// Initialize with user's local timezone and current time on mount (client-side only)
	useEffect(() => {
		const userTimezone = detectUserTimezone();
		setFromTimezone(userTimezone);
		const { hours, minutes } = getInitialTime();
		setInputHours(hours);
		setInputMinutes(minutes);
		setIsInitialized(true);
	}, []);

	// Update time if using current time
	useEffect(() => {
		if (useCurrentTime && isInitialized) {
			const updateTime = () => {
				const now = new Date();
				setInputHours(now.getHours());
				setInputMinutes(now.getMinutes());
			};
			updateTime();
			const interval = setInterval(updateTime, 1000);
			return () => clearInterval(interval);
		}
	}, [useCurrentTime, isInitialized]);

	// Get timezone info
	const fromTz = useMemo(() => TIMEZONES.find((tz) => tz.id === fromTimezone), [fromTimezone]);
	const toTz = useMemo(() => TIMEZONES.find((tz) => tz.id === toTimezone), [toTimezone]);

	// Calculate converted time
	const convertedTime = useMemo(() => {
		if (!fromTz || !toTz) return { hours: 0, minutes: 0, dayOffset: 0 };

		const offsetDiff = toTz.offset - fromTz.offset;
		let totalMinutes = inputHours * 60 + inputMinutes + offsetDiff * 60;
		let dayOffset = 0;

		while (totalMinutes < 0) {
			totalMinutes += 24 * 60;
			dayOffset--;
		}
		while (totalMinutes >= 24 * 60) {
			totalMinutes -= 24 * 60;
			dayOffset++;
		}

		return {
			hours: Math.floor(totalMinutes / 60),
			minutes: totalMinutes % 60,
			dayOffset,
		};
	}, [inputHours, inputMinutes, fromTz, toTz]);

	// Calculate offset difference for display
	const offsetDiff = useMemo(() => {
		if (!fromTz || !toTz) return 0;
		return toTz.offset - fromTz.offset;
	}, [fromTz, toTz]);

	// Swap timezones
	const swapTimezones = () => {
		const temp = fromTimezone;
		setFromTimezone(toTimezone);
		setToTimezone(temp);
	};

	// Handle time input change
	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUseCurrentTime(false);
		const [h, m] = e.target.value.split(":").map(Number);
		if (!isNaN(h)) setInputHours(h);
		if (!isNaN(m)) setInputMinutes(m);
	};

	// Use current time
	const handleUseNow = () => {
		setUseCurrentTime(true);
	};

	// Add zone to timeline
	const addTimelineZone = (zoneId: string) => {
		if (!timelineZones.includes(zoneId) && timelineZones.length < 6) {
			setTimelineZones([...timelineZones, zoneId]);
		}
	};

	// Remove zone from timeline
	const removeTimelineZone = (zoneId: string) => {
		if (timelineZones.length > 2) {
			setTimelineZones(timelineZones.filter((z) => z !== zoneId));
		}
	};

	// Generate timeline hours for a timezone
	const getTimelineHours = useCallback(
		(tzId: string) => {
			const tz = TIMEZONES.find((t) => t.id === tzId);
			const baseTz = TIMEZONES.find((t) => t.id === timelineZones[0]);
			if (!tz || !baseTz) return [];

			const offsetDiff = tz.offset - baseTz.offset;
			const hours = [];

			for (let i = 0; i < 24; i++) {
				let adjustedHour = i + offsetDiff;
				let dayOffset = 0;

				while (adjustedHour < 0) {
					adjustedHour += 24;
					dayOffset--;
				}
				while (adjustedHour >= 24) {
					adjustedHour -= 24;
					dayOffset++;
				}

				hours.push({
					baseHour: i,
					localHour: adjustedHour,
					dayOffset,
				});
			}

			return hours;
		},
		[timelineZones],
	);

	// Get current hour position for the highlight
	const currentBaseHour = useMemo(() => {
		const baseTz = TIMEZONES.find((t) => t.id === timelineZones[0]);
		if (!baseTz) return 0;

		const now = new Date();
		const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
		let localHour = utcHours + baseTz.offset;

		while (localHour < 0) localHour += 24;
		while (localHour >= 24) localHour -= 24;

		return Math.floor(localHour);
	}, [timelineZones]);

	const formatTimeDisplay = use24Hour ? formatTime24 : formatTime12;

	return (
		<div className={styles.container}>
			{/* Quick Converter */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<div className={`flex justify-between items-center mb-6 flex-wrap gap-4 ${styles.converterHeader}`}>
					<h2 className={styles.sectionTitle}>Quick Convert</h2>
					<div className={`flex gap-2 items-center ${styles.headerControls}`}>
						<button className={`py-2 px-3 rounded-sm text-xs font-semibold ${styles.formatToggle} ${use24Hour ? styles.active : ""}`} onClick={() => setUse24Hour(!use24Hour)}>
							{use24Hour ? "24h" : "12h"}
						</button>
						<Button onClick={handleUseNow} className={`flex items-center gap-1.5 py-2 px-3 rounded-sm text-xs ${styles.nowButton} ${useCurrentTime ? styles.active : ""}`}>
							<ClockIcon className="w-4 h-4" />
							Now
						</Button>
					</div>
				</div>

				<div className={`grid items-center gap-6 ${styles.quickConverter}`}>
					{/* From Side */}
					<div className={`flex flex-col gap-4 ${styles.timeColumn}`}>
						<select value={fromTimezone} onChange={(e) => setFromTimezone(e.target.value)} className={`w-full rounded-md ${styles.timezoneSelect}`}>
							{Object.entries(TIMEZONE_GROUPS).map(([region, zones]) => (
								<optgroup key={region} label={region}>
									{zones.map((tz) => (
										<option key={tz.id} value={tz.id}>
											{tz.name} ({tz.abbrev})
										</option>
									))}
								</optgroup>
							))}
						</select>

						<div className={`text-center p-6 rounded-lg ${styles.timeDisplay}`}>
							{useCurrentTime ? (
								<div className={`inline-flex rounded-md ${styles.largeTimeEditable}`} onClick={() => setUseCurrentTime(false)} title="Click to set custom time">
									{formatTimeDisplay(inputHours, inputMinutes)}
								</div>
							) : (
								<div className={`items-center justify-center rounded-md ${styles.largeTimeEditing}`}>
									<input type="time" value={formatTime24(inputHours, inputMinutes)} onChange={handleTimeChange} className={`w-full p-2 text-center font-bold ${styles.timeInputLarge}`} autoFocus />
								</div>
							)}
							<div className={`mt-2 ${styles.offsetLabel}`}>{fromTz && formatOffset(fromTz.offset)}</div>
						</div>
					</div>

					{/* Swap Button */}
					<div className={`flex flex-col items-center gap-2 ${styles.swapColumn}`}>
						<button className={`p-4 rounded-full ${styles.swapButton}`} onClick={swapTimezones} title="Swap timezones">
							<ArrowsRightLeftIcon className="w-6 h-6" />
						</button>
						<div className={`font-semibold rounded-sm ${styles.offsetBadge}`}>
							{offsetDiff >= 0 ? "+" : ""}
							{offsetDiff}h
						</div>
					</div>

					{/* To Side */}
					<div className={`flex flex-col gap-4 ${styles.timeColumn}`}>
						<select value={toTimezone} onChange={(e) => setToTimezone(e.target.value)} className={`w-full rounded-md ${styles.timezoneSelect}`}>
							{Object.entries(TIMEZONE_GROUPS).map(([region, zones]) => (
								<optgroup key={region} label={region}>
									{zones.map((tz) => (
										<option key={tz.id} value={tz.id}>
											{tz.name} ({tz.abbrev})
										</option>
									))}
								</optgroup>
							))}
						</select>

						<div className={`read-only text-center p-6 rounded-lg ${styles.timeDisplay}`}>
							<div className={styles.largeTimeReadonly}>{formatTimeDisplay(convertedTime.hours, convertedTime.minutes)}</div>
							{convertedTime.dayOffset !== 0 && (
								<div className={`font-semibold mt-1 ${styles.dayOffset}`}>{convertedTime.dayOffset > 0 ? `+${convertedTime.dayOffset} day` : `${convertedTime.dayOffset} day`}</div>
							)}
							<div className={`mt-2 ${styles.offsetLabel}`}>{toTz && formatOffset(toTz.offset)}</div>
						</div>
					</div>
				</div>

				{/* Summary sentence */}
				<div className={`mt-6 px-6 py-4 rounded-md text-center ${styles.summaryBox}`}>
					<p>
						When it&apos;s <strong>{formatTimeDisplay(inputHours, inputMinutes)}</strong> in <strong>{fromTz?.name}</strong>, it&apos;s{" "}
						<strong>{formatTimeDisplay(convertedTime.hours, convertedTime.minutes)}</strong> in <strong>{toTz?.name}</strong>
						{convertedTime.dayOffset !== 0 && <span className={styles.dayNote}> ({convertedTime.dayOffset > 0 ? "next" : "previous"} day)</span>}
					</p>
				</div>
			</div>

			{/* Visual Timeline */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<div className={`flex justify-between items-center mb-5 flex-wrap gap-4 ${styles.timelineHeader}`}>
					<h2 className={styles.sectionTitle}>Timeline Comparison</h2>
					<div className={`flex gap-2 ${styles.timelineControls}`}>
						<select onChange={(e) => e.target.value && addTimelineZone(e.target.value)} value="" className={`py-2 px-3 rounded-sm ${styles.addZoneSelect}`} disabled={timelineZones.length >= 6}>
							<option value="">+ Add timezone</option>
							{Object.entries(TIMEZONE_GROUPS).map(([region, zones]) => (
								<optgroup key={region} label={region}>
									{zones
										.filter((tz) => !timelineZones.includes(tz.id))
										.map((tz) => (
											<option key={tz.id} value={tz.id}>
												{tz.name}
											</option>
										))}
								</optgroup>
							))}
						</select>
					</div>
				</div>

				<div className={`overflow-x-auto pb-2 ${styles.timelineContainer}`}>
					{timelineZones.map((zoneId) => {
						const tz = TIMEZONES.find((t) => t.id === zoneId);
						const hours = getTimelineHours(zoneId);

						return (
							<div key={zoneId} className={`flex items-center mb-2 last:mb-0 ${styles.timelineRow}`}>
								<div className={`flex flex-col shrink-0 relative ${styles.timelineLabel}`}>
									<div className={`font-semibold ${styles.zoneName}`}>{tz?.abbrev}</div>
									<div className={styles.zoneOffset}>{tz && formatOffset(tz.offset)}</div>
									{timelineZones.length > 2 && (
										<button className={`absolute ${styles.removeZoneBtn}`} onClick={() => removeTimelineZone(zoneId)} title="Remove">
											<XMarkIcon className="w-3.5 h-3.5" />
										</button>
									)}
								</div>
								<div className={`flex flex-1 min-w-0 ${styles.timelineHours}`}>
									{hours.map((h, i) => (
										<div
											key={i}
											className={`flex flex-col items-center justify-center relative ${styles.hourCell} ${styles[getTimeCategory(h.localHour)]} ${i === currentBaseHour ? styles.currentHour : ""}`}
											title={`${tz?.abbrev}: ${formatTime12(h.localHour, 0)}`}
										>
											<span className={`font-medium ${styles.hourLabel}`}>{getHourLabel(h.localHour)}</span>
											{h.dayOffset !== 0 && <span className={`absolute ${styles.hourDayOffset}`}>{h.dayOffset > 0 ? "+1" : "-1"}</span>}
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>

				<div className={`flex flex-wrap gap-4 mt-4 pt-4 ${styles.timelineLegend}`}>
					<div className={`flex items-center gap-1.5 ${styles.legendItem}`}>
						<span className={`${styles.legendColor} ${styles.night}`}></span>
						<span>Night (12a-6a)</span>
					</div>
					<div className={`flex items-center gap-1.5 ${styles.legendItem}`}>
						<span className={`${styles.legendColor} ${styles.early}`}></span>
						<span>Early (6a-9a)</span>
					</div>
					<div className={`flex items-center gap-1.5 ${styles.legendItem}`}>
						<span className={`${styles.legendColor} ${styles.morning}`}></span>
						<span>Morning (9a-12p)</span>
					</div>
					<div className={`flex items-center gap-1.5 ${styles.legendItem}`}>
						<span className={`${styles.legendColor} ${styles.afternoon}`}></span>
						<span>Afternoon (12p-5p)</span>
					</div>
					<div className={`flex items-center gap-1.5 ${styles.legendItem}`}>
						<span className={`${styles.legendColor} ${styles.evening}`}></span>
						<span>Evening (5p-9p)</span>
					</div>
					<div className={`flex items-center gap-1.5 ${styles.legendItem}`}>
						<span className={`${styles.legendColor} ${styles.late}`}></span>
						<span>Late (9p-12a)</span>
					</div>
				</div>
			</div>

			{/* Common Conversions Reference */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>Quick Reference</h2>
				<div className={`grid gap-4 mt-4 ${styles.referenceGrid}`}>
					<div className={`p-4 rounded-md ${styles.referenceCard}`}>
						<h3>US Time Zones</h3>
						<ul>
							<li>PST to EST: +3 hours</li>
							<li>PST to CST: +2 hours</li>
							<li>CST to EST: +1 hour</li>
							<li>EST to PST: -3 hours</li>
						</ul>
					</div>
					<div className={`p-4 rounded-md ${styles.referenceCard}`}>
						<h3>US to Europe</h3>
						<ul>
							<li>EST to GMT: +5 hours</li>
							<li>EST to CET: +6 hours</li>
							<li>PST to GMT: +8 hours</li>
							<li>PST to CET: +9 hours</li>
						</ul>
					</div>
					<div className={`p-4 rounded-md ${styles.referenceCard}`}>
						<h3>US to Asia</h3>
						<ul>
							<li>EST to IST: +10.5 hours</li>
							<li>EST to JST: +14 hours</li>
							<li>PST to IST: +13.5 hours</li>
							<li>PST to JST: +17 hours</li>
						</ul>
					</div>
					<div className={`p-4 rounded-md ${styles.referenceCard}`}>
						<h3>Tips</h3>
						<ul>
							<li>Add hours going east</li>
							<li>Subtract hours going west</li>
							<li>UTC is the global reference</li>
							<li>DST may shift by 1 hour</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
