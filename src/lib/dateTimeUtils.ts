/** Date/time helpers: time-zone aware formatting and parsing, date arithmetic, relative time. */

export const LOCAL_TIME_ZONE = "local";

export interface ZonedParts {
	year: number;
	month: number; // 1-12
	day: number;
	hour: number;
	minute: number;
	second: number;
	weekday: number; // 0 = Sunday
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone?: string): Intl.DateTimeFormat {
	const key = timeZone ?? "__local__";
	let f = formatterCache.get(key);
	if (!f) {
		f = new Intl.DateTimeFormat("en-US", {
			timeZone,
			hourCycle: "h23",
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			weekday: "short",
		});
		formatterCache.set(key, f);
	}
	return f;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Resolve "local" to undefined so Intl uses the browser zone. */
export function resolveTimeZone(tz: string | undefined): string | undefined {
	return !tz || tz === LOCAL_TIME_ZONE ? undefined : tz;
}

/** Calendar/clock fields of an instant as seen in a time zone. */
export function getZonedParts(date: Date, timeZone?: string): ZonedParts {
	const parts = partsFormatter(resolveTimeZone(timeZone)).formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
	return {
		year: Number(get("year")),
		month: Number(get("month")),
		day: Number(get("day")),
		hour: Number(get("hour")) % 24,
		minute: Number(get("minute")),
		second: Number(get("second")),
		weekday: WEEKDAYS.indexOf(get("weekday")),
	};
}

/** Offset (ms) of a time zone from UTC at a given instant. Positive east of UTC. */
export function getTimeZoneOffsetMs(date: Date, timeZone?: string): number {
	const p = getZonedParts(date, timeZone);
	const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
	return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Build the instant for a wall-clock time in a zone. Returns null when the
 * wall time does not exist (spring-forward gap).
 */
export function zonedTimeToUtc(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
	timeZone?: string
): Date | null {
	const guess = Date.UTC(year, month - 1, day, hour, minute, second);
	let result = new Date(guess - getTimeZoneOffsetMs(new Date(guess), timeZone));
	// Re-check once for DST transitions near the guess
	const check = getZonedParts(result, timeZone);
	if (check.hour !== hour || check.minute !== minute || check.day !== day) {
		result = new Date(guess - getTimeZoneOffsetMs(result, timeZone));
		const again = getZonedParts(result, timeZone);
		if (again.hour !== hour || again.minute !== minute || again.day !== day) return null;
	}
	return result;
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** "YYYY-MM-DD HH:mm:ss" in a zone. */
export function formatDateTimeLocal(date: Date, timeZone?: string): string {
	const p = getZonedParts(date, timeZone);
	return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

/** Parse "YYYY-MM-DD HH:mm[:ss]" or "YYYY-MM-DDTHH:mm[:ss]" as wall time in a zone. */
export function parseDateTimeLocal(input: string, timeZone?: string): Date | null {
	const m = input.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
	if (!m) return null;
	const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
	return zonedTimeToUtc(Number(y), Number(mo), Number(d), Number(h), Number(mi), Number(s), timeZone);
}

/** Unix timestamp string → Date. 10 digits or fewer is seconds, more is milliseconds. */
export function parseUnixTimestamp(input: string): Date | null {
	const t = input.trim();
	if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
	const n = Number(t);
	const digits = t.replace(/^-|\..*$/g, "").length;
	const ms = digits > 10 ? n : n * 1000;
	const d = new Date(ms);
	return isNaN(d.getTime()) ? null : d;
}

/** RFC 2822 / RFC 822 style, e.g. "Mon, 01 Jan 2024 00:00:00 GMT". */
export function toRfc2822(date: Date): string {
	return date.toUTCString();
}

/** Parse an ISO 8601 or RFC 2822 string. Returns null when Date cannot parse it. */
export function parseLooseDate(input: string): Date | null {
	const t = input.trim();
	if (!t) return null;
	const d = new Date(t);
	return isNaN(d.getTime()) ? null : d;
}

export type DateUnit = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";

export const DATE_UNITS: { id: DateUnit; label: string }[] = [
	{ id: "seconds", label: "Seconds" },
	{ id: "minutes", label: "Minutes" },
	{ id: "hours", label: "Hours" },
	{ id: "days", label: "Days" },
	{ id: "weeks", label: "Weeks" },
	{ id: "months", label: "Months" },
	{ id: "years", label: "Years" },
];

/** Add (or subtract, with a negative amount) a duration. Months/years move the calendar in the given zone. */
export function addToDate(date: Date, amount: number, unit: DateUnit, timeZone?: string): Date {
	switch (unit) {
		case "seconds":
			return new Date(date.getTime() + amount * 1000);
		case "minutes":
			return new Date(date.getTime() + amount * 60_000);
		case "hours":
			return new Date(date.getTime() + amount * 3_600_000);
		case "days":
		case "weeks":
		case "months":
		case "years": {
			const p = getZonedParts(date, timeZone);
			let { year, month, day } = p;
			if (unit === "days") day += amount;
			if (unit === "weeks") day += amount * 7;
			if (unit === "months") month += amount;
			if (unit === "years") year += amount;
			// Normalise via UTC calendar math, then re-anchor in the zone
			const norm = new Date(Date.UTC(year, month - 1, day, p.hour, p.minute, p.second));
			return (
				zonedTimeToUtc(
					norm.getUTCFullYear(),
					norm.getUTCMonth() + 1,
					norm.getUTCDate(),
					p.hour,
					p.minute,
					p.second,
					timeZone
				) ?? norm
			);
		}
	}
}

/** Human relative time, e.g. "in 3 hours", "2 days ago", "just now". */
export function relativeTime(date: Date, now: Date = new Date()): string {
	const diff = date.getTime() - now.getTime();
	const abs = Math.abs(diff);
	const units: [number, string][] = [
		[31_557_600_000, "year"],
		[2_629_800_000, "month"],
		[604_800_000, "week"],
		[86_400_000, "day"],
		[3_600_000, "hour"],
		[60_000, "minute"],
		[1000, "second"],
	];
	if (abs < 1000) return "just now";
	for (const [ms, name] of units) {
		if (abs >= ms) {
			const n = Math.floor(abs / ms);
			const label = `${n} ${name}${n === 1 ? "" : "s"}`;
			return diff > 0 ? `in ${label}` : `${label} ago`;
		}
	}
	return "just now";
}

export const COMMON_TIME_ZONES: { value: string; label: string }[] = [
	{ value: LOCAL_TIME_ZONE, label: "Local time" },
	{ value: "UTC", label: "UTC" },
	{ value: "America/New_York", label: "New York (ET)" },
	{ value: "America/Chicago", label: "Chicago (CT)" },
	{ value: "America/Denver", label: "Denver (MT)" },
	{ value: "America/Los_Angeles", label: "Los Angeles (PT)" },
	{ value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
	{ value: "Europe/London", label: "London (GMT/BST)" },
	{ value: "Europe/Paris", label: "Paris (CET/CEST)" },
	{ value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
	{ value: "Europe/Moscow", label: "Moscow (MSK)" },
	{ value: "Asia/Dubai", label: "Dubai (GST)" },
	{ value: "Asia/Kolkata", label: "India (IST)" },
	{ value: "Asia/Shanghai", label: "Shanghai (CST)" },
	{ value: "Asia/Singapore", label: "Singapore (SGT)" },
	{ value: "Asia/Tokyo", label: "Tokyo (JST)" },
	{ value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
	{ value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
];
