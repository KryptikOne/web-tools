import { describe, it, expect } from "vitest";
import {
	parseCronExpression, cronFieldToString, normalizeCronExpression, isValidCronExpression,
	describeCronExpression, expandCronField, getNextCronRuns,
} from "@/lib/cronUtils";

describe("cron parsing", () => {
	it("round-trips tokens through the field model", () => {
		const fields = parseCronExpression("30 9 * * 1-5")!;
		expect(fields.map(cronFieldToString)).toEqual(["30", "9", "*", "*", "1-5"]);
		expect(fields[4].mode).toBe("range");
		expect(parseCronExpression("*/5 * * * *")![0]).toMatchObject({ mode: "step", stepBase: "*", stepValue: "5" });
	});

	it("normalises month and weekday names", () => {
		expect(normalizeCronExpression("0 9 * JAN-MAR MON-FRI")).toBe("0 9 * 1-3 1-5");
		expect(normalizeCronExpression("0 0 * * 7")).toBe("0 0 * * 0");
		expect(normalizeCronExpression("0 0 *")).toBeNull();
	});

	it("validates expressions", () => {
		expect(isValidCronExpression("0 */2 * * 1-5")).toBe(true);
		expect(isValidCronExpression("0 25 * * *")).toBe(false);
		expect(isValidCronExpression("banana")).toBe(false);
	});

	it("expands ranges, lists and steps", () => {
		expect(expandCronField("1-3,10,*/20", 0, 59)).toEqual([0, 1, 2, 3, 10, 20, 40]);
		expect(expandCronField("5-20/5", 0, 59)).toEqual([5, 10, 15, 20]);
	});

	it("describes common schedules", () => {
		expect(describeCronExpression("30 9 * * 1-5")).toBe("At 9:30 AM on weekdays");
		expect(describeCronExpression("*/15 * * * *")).toBe("Every 15 minutes");
		expect(describeCronExpression("0 0 1 1,4,7,10 *")).toBe("At 12:00 AM on day 1 of the month in Jan, Apr, Jul, Oct");
	});
});

describe("next runs", () => {
	const from = new Date("2026-09-19T12:00:00Z"); // Saturday

	it("computes upcoming runs in UTC", () => {
		const runs = getNextCronRuns("30 9 * * 1-5", 3, "UTC", from);
		expect(runs.map((d) => d.toISOString())).toEqual([
			"2026-09-21T09:30:00.000Z",
			"2026-09-22T09:30:00.000Z",
			"2026-09-23T09:30:00.000Z",
		]);
	});

	it("respects the time zone", () => {
		const [first] = getNextCronRuns("30 9 * * 1-5", 1, "America/Chicago", from);
		expect(first.toISOString()).toBe("2026-09-21T14:30:00.000Z");
	});

	it("handles the same-day case and steps", () => {
		const runs = getNextCronRuns("*/20 * * * *", 2, "UTC", from);
		expect(runs.map((d) => d.toISOString())).toEqual(["2026-09-19T12:20:00.000Z", "2026-09-19T12:40:00.000Z"]);
	});

	it("returns nothing for invalid input", () => {
		expect(getNextCronRuns("bad", 3, "UTC", from)).toEqual([]);
	});
});
