import { describe, it, expect } from "vitest";
import { getZonedParts, zonedTimeToUtc, formatDateTimeLocal, parseDateTimeLocal, parseUnixTimestamp, addToDate, relativeTime } from "@/lib/dateTimeUtils";

describe("dateTimeUtils", () => {
	const instant = new Date("2026-03-08T14:30:00Z");

	it("reads zoned parts", () => {
		const p = getZonedParts(instant, "America/New_York");
		expect([p.year, p.month, p.day, p.hour, p.minute, p.weekday]).toEqual([2026, 3, 8, 10, 30, 0]);
	});

	it("round-trips wall time through a zone", () => {
		expect(zonedTimeToUtc(2026, 3, 8, 10, 30, 0, "America/New_York")?.toISOString()).toBe("2026-03-08T14:30:00.000Z");
		expect(formatDateTimeLocal(instant, "Asia/Tokyo")).toBe("2026-03-08 23:30:00");
		expect(parseDateTimeLocal("2026-03-08 23:30:00", "Asia/Tokyo")?.toISOString()).toBe("2026-03-08T14:30:00.000Z");
	});

	it("returns null for a spring-forward gap", () => {
		expect(zonedTimeToUtc(2026, 3, 8, 2, 30, 0, "America/New_York")).toBeNull();
	});

	it("parses unix seconds and milliseconds", () => {
		expect(parseUnixTimestamp("1704067200")?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
		expect(parseUnixTimestamp("1704067200000")?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
		expect(parseUnixTimestamp("abc")).toBeNull();
	});

	it("adds calendar units in a zone", () => {
		expect(addToDate(instant, 1, "months", "UTC").toISOString()).toBe("2026-04-08T14:30:00.000Z");
		expect(addToDate(instant, -2, "days", "UTC").toISOString()).toBe("2026-03-06T14:30:00.000Z");
		expect(addToDate(instant, 90, "minutes").toISOString()).toBe("2026-03-08T16:00:00.000Z");
	});

	it("formats relative time", () => {
		expect(relativeTime(new Date(instant.getTime() + 3 * 3_600_000), instant)).toBe("in 3 hours");
		expect(relativeTime(new Date(instant.getTime() - 2 * 86_400_000), instant)).toBe("2 days ago");
	});
});
