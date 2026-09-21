/** Cron expression helpers: field model, parsing, human description, and time-zone aware next runs. */

import { getZonedParts, zonedTimeToUtc } from "@/lib/dateTimeUtils";

export type CronFieldMode = "every" | "specific" | "range" | "step";

export interface CronField {
	mode: CronFieldMode;
	specific: string;
	rangeStart: string;
	rangeEnd: string;
	stepBase: string;
	stepValue: string;
}

export interface CronFieldSpec {
	name: string;
	min: number;
	max: number;
	labels?: Record<number, string>;
	names?: Record<string, number>;
}

const MONTH_NAMES: Record<string, number> = {
	JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const DAY_NAMES: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

export const CRON_FIELDS: CronFieldSpec[] = [
	{ name: "Minute", min: 0, max: 59 },
	{ name: "Hour", min: 0, max: 23 },
	{ name: "Day of month", min: 1, max: 31 },
	{
		name: "Month",
		min: 1,
		max: 12,
		labels: { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" },
		names: MONTH_NAMES,
	},
	{
		name: "Day of week",
		min: 0,
		max: 6,
		labels: { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" },
		names: DAY_NAMES,
	},
];

export interface CronPreset {
	label: string;
	expression: string;
	description: string;
}

export const CRON_PRESETS: CronPreset[] = [
	{ label: "Every minute", expression: "* * * * *", description: "Runs every minute" },
	{ label: "Every 5 minutes", expression: "*/5 * * * *", description: "Runs every 5 minutes" },
	{ label: "Every 15 minutes", expression: "*/15 * * * *", description: "Runs every 15 minutes" },
	{ label: "Every hour", expression: "0 * * * *", description: "At minute 0 of every hour" },
	{ label: "Every 2 hours", expression: "0 */2 * * *", description: "At minute 0 every 2 hours" },
	{ label: "Daily at midnight", expression: "0 0 * * *", description: "Every day at 00:00" },
	{ label: "Daily at noon", expression: "0 12 * * *", description: "Every day at 12:00" },
	{ label: "Weekdays 9am", expression: "0 9 * * 1-5", description: "At 09:00 Monday through Friday" },
	{ label: "Weekends 9am", expression: "0 9 * * 0,6", description: "At 09:00 on Saturday and Sunday" },
	{ label: "Weekly (Sunday)", expression: "0 0 * * 0", description: "At 00:00 every Sunday" },
	{ label: "Monthly (1st)", expression: "0 0 1 * *", description: "At 00:00 on the 1st of every month" },
	{ label: "Quarterly", expression: "0 0 1 1,4,7,10 *", description: "At 00:00 on the 1st of Jan, Apr, Jul, Oct" },
];

export function createDefaultCronField(): CronField {
	return { mode: "every", specific: "", rangeStart: "", rangeEnd: "", stepBase: "*", stepValue: "2" };
}

export function cronFieldToString(field: CronField, index: number): string {
	const { min } = CRON_FIELDS[index];
	switch (field.mode) {
		case "every":
			return "*";
		case "specific":
			return field.specific.trim() || "*";
		case "range":
			return `${field.rangeStart || String(min)}-${field.rangeEnd || String(min)}`;
		case "step":
			return `${field.stepBase || "*"}/${field.stepValue || "2"}`;
	}
}

/** Replace JAN/MON style names with numbers and map 7 → 0 for day of week. */
export function normalizeCronToken(token: string, index: number): string {
	const spec = CRON_FIELDS[index];
	let out = token.trim();
	if (spec.names) {
		out = out.replace(/[A-Za-z]{3}/g, (m) => {
			const n = spec.names![m.toUpperCase()];
			return n === undefined ? m : String(n);
		});
	}
	if (index === 4) out = out.replace(/\b7\b/g, "0");
	return out;
}

export function parseCronToken(token: string, index: number): CronField {
	const field = createDefaultCronField();
	const t = normalizeCronToken(token, index);
	if (t === "*") return field;
	if (t.includes("/")) {
		const [base, step] = t.split("/");
		return { ...field, mode: "step", stepBase: base || "*", stepValue: step || "2" };
	}
	if (/^\d+-\d+$/.test(t)) {
		const [start, end] = t.split("-");
		return { ...field, mode: "range", rangeStart: start, rangeEnd: end };
	}
	return { ...field, mode: "specific", specific: t };
}

/** Split an expression into 5 tokens, or null when it does not have exactly 5. */
export function splitCronExpression(expression: string): string[] | null {
	const parts = expression.trim().split(/\s+/).filter(Boolean);
	return parts.length === 5 ? parts : null;
}

export function normalizeCronExpression(expression: string): string | null {
	const parts = splitCronExpression(expression);
	if (!parts) return null;
	return parts.map((p, i) => normalizeCronToken(p, i)).join(" ");
}

export function parseCronExpression(expression: string): CronField[] | null {
	const parts = splitCronExpression(expression);
	if (!parts) return null;
	return parts.map((p, i) => parseCronToken(p, i));
}

export function isValidCronExpression(expression: string): boolean {
	const normalized = normalizeCronExpression(expression);
	if (!normalized) return false;
	const parts = normalized.split(" ");
	return parts.every((p, i) => {
		if (!/^[\d*,\-/]+$/.test(p)) return false;
		return expandCronField(p, CRON_FIELDS[i].min, CRON_FIELDS[i].max).length > 0;
	});
}

export function expandCronField(token: string, min: number, max: number): number[] {
	if (token === "*") return Array.from({ length: max - min + 1 }, (_, i) => i + min);
	const results = new Set<number>();
	for (const part of token.split(",")) {
		if (!part) continue;
		if (part.includes("/")) {
			const [base, stepStr] = part.split("/");
			const step = parseInt(stepStr, 10);
			if (!step || step < 1) continue;
			let start = min;
			let end = max;
			if (base !== "*" && base !== "") {
				if (base.includes("-")) {
					const [s, e] = base.split("-").map(Number);
					start = s;
					end = e;
				} else {
					start = parseInt(base, 10);
				}
			}
			for (let i = start; i <= end; i += step) results.add(i);
		} else if (part.includes("-")) {
			const [s, e] = part.split("-").map(Number);
			for (let i = s; i <= e; i++) results.add(i);
		} else {
			results.add(parseInt(part, 10));
		}
	}
	return Array.from(results)
		.filter((n) => Number.isFinite(n) && n >= min && n <= max)
		.sort((a, b) => a - b);
}

function formatHour(h: string): string {
	const n = parseInt(h, 10);
	if (isNaN(n)) return h;
	if (n === 0) return "12 AM";
	if (n === 12) return "12 PM";
	return n > 12 ? `${n - 12} PM` : `${n} AM`;
}

/** Plain-English description of a 5-field expression. */
export function describeCronExpression(expression: string): string {
	const normalized = normalizeCronExpression(expression);
	if (!normalized) return "Invalid cron expression (expected 5 fields)";
	const [minute, hour, dom, month, dow] = normalized.split(" ");

	if (normalized === "* * * * *") return "Every minute";
	if (minute.startsWith("*/") && hour === "*" && dom === "*" && month === "*" && dow === "*") {
		return `Every ${minute.slice(2)} minutes`;
	}
	if (hour.startsWith("*/") && minute === "0" && dom === "*" && month === "*" && dow === "*") {
		return `Every ${hour.slice(2)} hours`;
	}

	const segments: string[] = [];
	if (minute === "*") {
		segments.push("Every minute");
	} else if (minute.includes("/")) {
		segments.push(`Every ${minute.split("/")[1]} minutes`);
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
			const hours = hour.split(",").map((h) => `${formatHour(h).replace(/ (AM|PM)$/, "")}:${minute.padStart(2, "0")} ${formatHour(h).slice(-2)}`);
			segments.push(`At ${hours.join(" and ")}`);
		} else {
			segments.push(`during hour ${hour}`);
		}
	}

	if (dom !== "*") {
		if (dom.includes("/")) segments.push(`every ${dom.split("/")[1]} days`);
		else if (dom.includes("-")) segments.push(`on days ${dom} of the month`);
		else segments.push(`on day ${dom} of the month`);
	}

	if (month !== "*") {
		const names = CRON_FIELDS[3].labels!;
		const lbl = (m: string) => names[parseInt(m, 10)] || m;
		if (month.includes("-")) {
			const [s, e] = month.split("-");
			segments.push(`from ${lbl(s)} to ${lbl(e)}`);
		} else {
			segments.push(`in ${month.split(",").map(lbl).join(", ")}`);
		}
	}

	if (dow !== "*") {
		const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		const lbl = (d: string) => days[parseInt(d, 10)] || d;
		if (dow === "1-5") segments.push("on weekdays");
		else if (dow === "0,6" || dow === "6,0") segments.push("on weekends");
		else if (dow.includes("-")) {
			const [s, e] = dow.split("-");
			segments.push(`${lbl(s)} through ${lbl(e)}`);
		} else {
			segments.push(`on ${dow.split(",").map(lbl).join(" and ")}`);
		}
	}

	const text = segments.join(" ").trim() || "Every minute";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Next `count` run instants after `from`, evaluated in a time zone
 * ("local" or undefined uses the browser zone). Looks ahead up to 5 years.
 */
export function getNextCronRuns(
	expression: string,
	count: number,
	timeZone?: string,
	from: Date = new Date()
): Date[] {
	const normalized = normalizeCronExpression(expression);
	if (!normalized) return [];
	const parts = normalized.split(" ");
	const minutes = expandCronField(parts[0], 0, 59);
	const hours = expandCronField(parts[1], 0, 23);
	const doms = new Set(expandCronField(parts[2], 1, 31));
	const months = new Set(expandCronField(parts[3], 1, 12));
	const dows = new Set(expandCronField(parts[4], 0, 6));
	if (!minutes.length || !hours.length || !doms.size || !months.size || !dows.size) return [];

	// Standard cron: when both day fields are restricted, a day matches if either matches.
	const domRestricted = parts[2] !== "*";
	const dowRestricted = parts[4] !== "*";

	const start = new Date(Math.floor(from.getTime() / 60_000) * 60_000 + 60_000);
	const sp = getZonedParts(start, timeZone);
	const runs: Date[] = [];
	const maxDays = 366 * 5;

	for (let i = 0; i < maxDays && runs.length < count; i++) {
		const cal = new Date(Date.UTC(sp.year, sp.month - 1, sp.day + i));
		const y = cal.getUTCFullYear();
		const m = cal.getUTCMonth() + 1;
		const d = cal.getUTCDate();
		const wd = cal.getUTCDay();
		if (!months.has(m)) continue;
		const domOk = doms.has(d);
		const dowOk = dows.has(wd);
		const dayOk = domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
		if (!dayOk) continue;

		for (const h of hours) {
			if (i === 0 && h < sp.hour) continue;
			for (const mi of minutes) {
				if (i === 0 && h === sp.hour && mi < sp.minute) continue;
				const instant = zonedTimeToUtc(y, m, d, h, mi, 0, timeZone);
				if (!instant || instant.getTime() < start.getTime()) continue;
				runs.push(instant);
				if (runs.length >= count) return runs;
			}
		}
	}
	return runs;
}
