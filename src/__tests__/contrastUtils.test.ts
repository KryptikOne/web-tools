import { describe, it, expect } from "vitest";
import { contrastRatio, parseHexColor, wcagChecks, rateContrast, fixContrast, wcagBadge } from "@/lib/contrastUtils";

describe("contrastUtils", () => {
	it("computes the black/white ratio as 21:1", () => {
		expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 2);
	});

	it("parses 3 and 6 digit hex", () => {
		expect(parseHexColor("#fff")).toEqual([255, 255, 255]);
		expect(parseHexColor("1a1a2e")).toEqual([26, 26, 46]);
		expect(parseHexColor("#zzz")).toBeNull();
	});

	it("reports WCAG checks and ratings", () => {
		const checks = wcagChecks(4.6);
		expect(checks.find((c) => c.id === "aa-normal")?.passes).toBe(true);
		expect(checks.find((c) => c.id === "aaa-normal")?.passes).toBe(false);
		expect(rateContrast(14.18)).toBe("Excellent");
		expect(rateContrast(2)).toBe("Poor");
		expect(wcagBadge(3.5)).toBe("AA Large");
	});

	it("fixes a failing foreground to reach the target", () => {
		const fixed = fixContrast("#777777", "#ffffff", 4.5);
		expect(fixed).not.toBeNull();
		expect(contrastRatio(parseHexColor(fixed!)!, [255, 255, 255])).toBeGreaterThanOrEqual(4.5);
	});

	it("returns the same colour when it already passes", () => {
		expect(fixContrast("#000000", "#ffffff", 7)).toBe("#000000");
	});
});
