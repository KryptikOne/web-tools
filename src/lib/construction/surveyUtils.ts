/**
 * Angles the way they are read off instruments and plans: degrees, minutes and seconds, adding
 * and subtracting, normalising past a full turn, and quadrant bearings against azimuths.
 */

export interface DMS {
	negative: boolean;
	degrees: number;
	minutes: number;
	seconds: number;
}

/** Decimal degrees to degrees, minutes and seconds, seconds rounded to `places` decimals with carry. */
export function toDMS(decimal: number, places = 1): DMS {
	if (!Number.isFinite(decimal)) return { negative: false, degrees: 0, minutes: 0, seconds: 0 };
	const negative = decimal < 0;
	let total = Math.abs(decimal) * 3600;
	const scale = Math.pow(10, Math.max(0, Math.min(6, places)));
	total = Math.round(total * scale) / scale;
	let degrees = Math.floor(total / 3600 + 1e-12);
	const rest = total - degrees * 3600;
	let minutes = Math.floor(rest / 60 + 1e-12);
	let seconds = Math.round((rest - minutes * 60) * scale) / scale;
	if (seconds >= 60) {
		seconds -= 60;
		minutes += 1;
	}
	if (minutes >= 60) {
		minutes -= 60;
		degrees += 1;
	}
	return { negative, degrees, minutes, seconds };
}

export function fromDMS(degrees: number, minutes: number, seconds: number, negative = false): number {
	const v = Math.abs(degrees) + Math.abs(minutes) / 60 + Math.abs(seconds) / 3600;
	return negative ? -v : v;
}

export function formatDMS(decimal: number, places = 1): string {
	const d = toDMS(decimal, places);
	const [whole, frac = ""] = d.seconds.toFixed(places).split(".");
	const trimmed = frac.replace(/0+$/, "");
	const s = whole.padStart(2, "0") + (trimmed ? `.${trimmed}` : "");
	return `${d.negative ? "-" : ""}${d.degrees}° ${String(d.minutes).padStart(2, "0")}' ${s}"`;
}

/** Bring an angle into 0 ≤ a < 360. */
export function normalizeAngle(decimal: number): number {
	if (!Number.isFinite(decimal)) return 0;
	const a = decimal % 360;
	return a < 0 ? a + 360 : a;
}

export function addAngles(a: number, b: number, normalize = true): number {
	const s = a + b;
	return normalize ? normalizeAngle(s) : s;
}

export function subtractAngles(a: number, b: number, normalize = true): number {
	const s = a - b;
	return normalize ? normalizeAngle(s) : s;
}

export type Quadrant = "NE" | "SE" | "SW" | "NW";

export interface Bearing {
	quadrant: Quadrant;
	/** Angle from north or south toward east or west, 0 to 90 */
	angle: number;
	text: string;
}

/** Azimuth clockwise from north to a quadrant bearing such as N 45° 00' 00" E. */
export function azimuthToBearing(azimuth: number, places = 0): Bearing {
	const a = normalizeAngle(azimuth);
	let quadrant: Quadrant;
	let angle: number;
	if (a <= 90) {
		quadrant = "NE";
		angle = a;
	} else if (a <= 180) {
		quadrant = "SE";
		angle = 180 - a;
	} else if (a <= 270) {
		quadrant = "SW";
		angle = a - 180;
	} else {
		quadrant = "NW";
		angle = 360 - a;
	}
	return { quadrant, angle, text: `${quadrant[0]} ${formatDMS(angle, places)} ${quadrant[1]}` };
}

export function bearingToAzimuth(quadrant: Quadrant, angle: number): number {
	const a = Math.max(0, Math.min(90, angle));
	switch (quadrant) {
		case "NE":
			return a;
		case "SE":
			return 180 - a;
		case "SW":
			return 180 + a;
		default:
			return normalizeAngle(360 - a);
	}
}

/** Interior angle to the right from a back bearing to a forward bearing, as a transit reads it. */
export function angleRight(backAzimuth: number, forwardAzimuth: number): number {
	return normalizeAngle(forwardAzimuth - backAzimuth);
}
