import { describe, it, expect } from "vitest";
import { ColorUtils } from "@/lib/colorUtils";

describe("ColorUtils", () => {
	describe("hexToRgb", () => {
		it("converts 6-digit hex", () => {
			expect(ColorUtils.hexToRgb("#ff0000")).toEqual([255, 0, 0]);
			expect(ColorUtils.hexToRgb("#00ff00")).toEqual([0, 255, 0]);
			expect(ColorUtils.hexToRgb("#0000ff")).toEqual([0, 0, 255]);
		});

		it("converts 3-digit hex", () => {
			expect(ColorUtils.hexToRgb("#f00")).toEqual([255, 0, 0]);
			expect(ColorUtils.hexToRgb("#fff")).toEqual([255, 255, 255]);
		});

		it("handles hex without #", () => {
			expect(ColorUtils.hexToRgb("ff0000")).toEqual([255, 0, 0]);
		});

		it("handles 8-digit hex (ignores alpha)", () => {
			expect(ColorUtils.hexToRgb("#ff000080")).toEqual([255, 0, 0]);
		});

		it("returns null for invalid hex", () => {
			expect(ColorUtils.hexToRgb("#xyz")).toBeNull();
			expect(ColorUtils.hexToRgb("")).toBeNull();
		});

		it("returns fallback for invalid hex when provided", () => {
			expect(ColorUtils.hexToRgb("#xyz", [0, 0, 0])).toEqual([0, 0, 0]);
		});
	});

	describe("rgbToHex", () => {
		it("converts RGB to hex", () => {
			expect(ColorUtils.rgbToHex(255, 0, 0)).toBe("#ff0000");
			expect(ColorUtils.rgbToHex(0, 255, 0)).toBe("#00ff00");
			expect(ColorUtils.rgbToHex(0, 0, 0)).toBe("#000000");
			expect(ColorUtils.rgbToHex(255, 255, 255)).toBe("#ffffff");
		});

		it("pads single-digit hex values", () => {
			expect(ColorUtils.rgbToHex(1, 2, 3)).toBe("#010203");
		});
	});

	describe("rgbToHsl / hslToRgb roundtrip", () => {
		it("converts red", () => {
			const [h, s, l] = ColorUtils.rgbToHsl(255, 0, 0);
			expect(h).toBe(0);
			expect(s).toBe(100);
			expect(l).toBe(50);
			expect(ColorUtils.hslToRgb(h, s, l)).toEqual([255, 0, 0]);
		});

		it("converts white", () => {
			const [h, s, l] = ColorUtils.rgbToHsl(255, 255, 255);
			expect(s).toBe(0);
			expect(l).toBe(100);
			expect(ColorUtils.hslToRgb(h, s, l)).toEqual([255, 255, 255]);
		});

		it("converts black", () => {
			const [, s, l] = ColorUtils.rgbToHsl(0, 0, 0);
			expect(s).toBe(0);
			expect(l).toBe(0);
		});
	});

	describe("rgbToHsv / hsvToRgb roundtrip", () => {
		it("converts pure red", () => {
			const [h, s, v] = ColorUtils.rgbToHsv(255, 0, 0);
			expect(h).toBeCloseTo(0, 0);
			expect(s).toBeCloseTo(1, 2);
			expect(v).toBeCloseTo(1, 2);
			expect(ColorUtils.hsvToRgb(h, s, v)).toEqual([255, 0, 0]);
		});

		it("converts mid-gray", () => {
			const [h, s, v] = ColorUtils.rgbToHsv(128, 128, 128);
			expect(s).toBeCloseTo(0, 2);
			const rgb = ColorUtils.hsvToRgb(h, s, v);
			expect(rgb[0]).toBeCloseTo(128, 0);
			expect(rgb[1]).toBeCloseTo(128, 0);
			expect(rgb[2]).toBeCloseTo(128, 0);
		});
	});

	describe("oklchToRgb / rgbToOklch roundtrip", () => {
		it("converts black", () => {
			const rgb = ColorUtils.oklchToRgb(0, 0, 0);
			expect(rgb).toEqual([0, 0, 0]);
		});

		it("converts white", () => {
			const rgb = ColorUtils.oklchToRgb(1, 0, 0);
			expect(rgb[0]).toBeCloseTo(255, -1);
			expect(rgb[1]).toBeCloseTo(255, -1);
			expect(rgb[2]).toBeCloseTo(255, -1);
		});

		it("roundtrips a color approximately", () => {
			const [l, c, h] = ColorUtils.rgbToOklch(100, 150, 200);
			const rgb = ColorUtils.oklchToRgb(l, c, h);
			expect(rgb[0]).toBeCloseTo(100, -1);
			expect(rgb[1]).toBeCloseTo(150, -1);
			expect(rgb[2]).toBeCloseTo(200, -1);
		});
	});

	describe("parseColor", () => {
		it("parses hex colors", () => {
			const result = ColorUtils.parseColor("#ff0000");
			expect(result).not.toBeNull();
			expect(result!.type).toBe("hex");
			expect(result!.rgb).toEqual([255, 0, 0]);
		});

		it("parses hex with alpha", () => {
			const result = ColorUtils.parseColor("#ff000080");
			expect(result).not.toBeNull();
			expect(result!.alpha).toBeCloseTo(0.5, 1);
		});

		it("parses rgb()", () => {
			const result = ColorUtils.parseColor("rgb(100, 200, 50)");
			expect(result).not.toBeNull();
			expect(result!.type).toBe("rgb");
			expect(result!.rgb).toEqual([100, 200, 50]);
		});

		it("parses rgba()", () => {
			const result = ColorUtils.parseColor("rgba(100, 200, 50, 0.5)");
			expect(result).not.toBeNull();
			expect(result!.alpha).toBe(0.5);
		});

		it("parses hsl()", () => {
			const result = ColorUtils.parseColor("hsl(0, 100%, 50%)");
			expect(result).not.toBeNull();
			expect(result!.type).toBe("hsl");
			expect(result!.rgb).toEqual([255, 0, 0]);
		});

		it("parses oklch()", () => {
			const result = ColorUtils.parseColor("oklch(0.65 0.18 250)");
			expect(result).not.toBeNull();
			expect(result!.type).toBe("oklch");
		});

		it("returns null for invalid input", () => {
			expect(ColorUtils.parseColor("not a color")).toBeNull();
			expect(ColorUtils.parseColor("")).toBeNull();
		});
	});
});
