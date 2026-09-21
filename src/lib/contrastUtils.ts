/** WCAG 2.1 contrast helpers. */

import { ColorUtils } from "@/lib/colorUtils";

export type RGB = [number, number, number];

export function parseHexColor(hex: string): RGB | null {
	const clean = hex.trim().replace(/^#/, "");
	if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) return null;
	return ColorUtils.hexToRgb(`#${clean}`);
}

export function relativeLuminance([r, g, b]: RGB): number {
	const [rs, gs, bs] = [r, g, b].map((c) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(a: RGB, b: RGB): number {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export interface WcagCheck {
	id: "aa-normal" | "aa-large" | "aaa-normal" | "aaa-large";
	level: "AA" | "AAA";
	text: "Normal text" | "Large text";
	minRatio: number;
	passes: boolean;
}

export const WCAG_THRESHOLDS = {
	aaNormal: 4.5,
	aaLarge: 3,
	aaaNormal: 7,
	aaaLarge: 4.5,
} as const;

export function wcagChecks(ratio: number): WcagCheck[] {
	return [
		{ id: "aa-normal", level: "AA", text: "Normal text", minRatio: WCAG_THRESHOLDS.aaNormal, passes: ratio >= WCAG_THRESHOLDS.aaNormal },
		{ id: "aa-large", level: "AA", text: "Large text", minRatio: WCAG_THRESHOLDS.aaLarge, passes: ratio >= WCAG_THRESHOLDS.aaLarge },
		{ id: "aaa-normal", level: "AAA", text: "Normal text", minRatio: WCAG_THRESHOLDS.aaaNormal, passes: ratio >= WCAG_THRESHOLDS.aaaNormal },
		{ id: "aaa-large", level: "AAA", text: "Large text", minRatio: WCAG_THRESHOLDS.aaaLarge, passes: ratio >= WCAG_THRESHOLDS.aaaLarge },
	];
}

export type ContrastRating = "Excellent" | "Good" | "Fair" | "Poor";

export function rateContrast(ratio: number): ContrastRating {
	if (ratio >= 7) return "Excellent";
	if (ratio >= 4.5) return "Good";
	if (ratio >= 3) return "Fair";
	return "Poor";
}

/** Short WCAG badge for a ratio: AAA, AA, AA Large or Fail. */
export function wcagBadge(ratio: number): "AAA" | "AA" | "AA Large" | "Fail" {
	if (ratio >= 7) return "AAA";
	if (ratio >= 4.5) return "AA";
	if (ratio >= 3) return "AA Large";
	return "Fail";
}

/**
 * Nudge the foreground's HSL lightness (keeping hue and saturation) until it
 * reaches the target ratio against the background. Picks the direction that
 * needs the smaller change. Returns null when no lightness reaches the target.
 */
export function fixContrast(foregroundHex: string, backgroundHex: string, targetRatio: number): string | null {
	const fg = parseHexColor(foregroundHex);
	const bg = parseHexColor(backgroundHex);
	if (!fg || !bg) return null;
	if (contrastRatio(fg, bg) >= targetRatio) return ColorUtils.rgbToHex(...fg);

	const [h, s, l] = ColorUtils.rgbToHsl(...fg);
	const search = (direction: 1 | -1): { hex: string; distance: number } | null => {
		for (let step = 1; step <= 100; step++) {
			const nl = l + direction * step;
			if (nl < 0 || nl > 100) return null;
			const rgb = ColorUtils.hslToRgb(h, s, nl);
			if (contrastRatio(rgb, bg) >= targetRatio) return { hex: ColorUtils.rgbToHex(...rgb), distance: step };
		}
		return null;
	};
	const lighter = search(1);
	const darker = search(-1);
	if (!lighter && !darker) return null;
	if (!lighter) return darker!.hex;
	if (!darker) return lighter.hex;
	return lighter.distance <= darker.distance ? lighter.hex : darker.hex;
}
