import { describe, it, expect } from "vitest";
import { toDMS, fromDMS, formatDMS, normalizeAngle, addAngles, subtractAngles, azimuthToBearing, bearingToAzimuth, angleRight } from "@/lib/construction/surveyUtils";
import { drawingToReal, realToDrawing, scaleFactor, drawingAreaToReal, ratioFromInchesPerFoot, scaleBarTicks, DRAWING_SCALES } from "@/lib/construction/scaleUtils";
import { floorArea, roomArea } from "@/lib/construction/areaUtils";

describe("surveyUtils", () => {
	it("converts both ways with carry", () => {
		expect(toDMS(45.5)).toEqual({ negative: false, degrees: 45, minutes: 30, seconds: 0 });
		expect(toDMS(12.999999, 0)).toEqual({ negative: false, degrees: 13, minutes: 0, seconds: 0 });
		expect(toDMS(-0.5)).toEqual({ negative: true, degrees: 0, minutes: 30, seconds: 0 });
		expect(fromDMS(45, 30, 0)).toBe(45.5);
		expect(fromDMS(10, 15, 30, true)).toBeCloseTo(-10.258333, 6);
		expect(formatDMS(45.5, 0)).toBe(`45° 30' 00"`);
		expect(formatDMS(10.2583333, 1)).toBe(`10° 15' 30"`);
	});

	it("adds, subtracts and normalises", () => {
		expect(normalizeAngle(370)).toBe(10);
		expect(normalizeAngle(-30)).toBe(330);
		expect(addAngles(350, 20)).toBe(10);
		expect(addAngles(350, 20, false)).toBe(370);
		expect(subtractAngles(10, 20)).toBe(350);
		expect(angleRight(90, 45)).toBe(315);
	});

	it("turns azimuths into quadrant bearings and back", () => {
		expect(azimuthToBearing(45).text).toBe(`N 45° 00' 00" E`);
		expect(azimuthToBearing(135)).toMatchObject({ quadrant: "SE", angle: 45 });
		expect(azimuthToBearing(225)).toMatchObject({ quadrant: "SW", angle: 45 });
		expect(azimuthToBearing(300)).toMatchObject({ quadrant: "NW", angle: 60 });
		expect(bearingToAzimuth("NW", 60)).toBe(300);
		expect(bearingToAzimuth("SE", 45)).toBe(135);
	});
});

describe("scaleUtils", () => {
	it("converts drawing lengths and scales", () => {
		expect(drawingToReal(2, 48)).toBe(96);
		expect(realToDrawing(96, 48)).toBe(2);
		expect(scaleFactor(48, 96)).toBe(0.5);
		expect(drawingAreaToReal(2, 50)).toBe(5000);
		expect(ratioFromInchesPerFoot(0.25)).toBe(48);
		expect(DRAWING_SCALES.find((s) => s.id === "1/4in")!.ratio).toBe(48);
	});

	it("lays out a scale bar with round ticks", () => {
		const t = scaleBarTicks(50, 150, "metric");
		expect(t[0]).toEqual({ mm: 0, real: 0 });
		expect(t[1].real).toBeCloseTo(1000 / 25.4, 9);
		expect(t[1].mm).toBeCloseTo(20, 9);
		expect(t.length).toBe(8);
		const i = scaleBarTicks(48, 150, "imperial");
		expect(i[1].real).toBe(36);
		expect(i[1].mm).toBeCloseTo((36 / 48) * 25.4, 9);
		expect(scaleBarTicks(0, 100, "metric")).toEqual([]);
	});
});

describe("areaUtils", () => {
	it("sums rooms of three shapes and takes a void away", () => {
		const f = floorArea(
			[
				{ name: "Living", shape: "rectangle", a: 144, b: 180 },
				{ name: "Bay", shape: "triangle", a: 36, b: 48 },
				{ name: "Turret", shape: "circle", a: 96, b: 0 },
				{ name: "Stair", shape: "rectangle", a: 36, b: 120, subtract: true },
			],
			10,
			144,
		);
		expect(f.rooms[0].area).toBe(25920);
		expect(f.rooms[1].area).toBe(864);
		expect(f.rooms[1].perimeter).toBe(36 + 48 + 60);
		expect(f.rooms[2].area).toBeCloseTo((Math.PI * 96 * 96) / 4, 6);
		expect(f.totalArea).toBeCloseTo(25920 + 864 + (Math.PI * 96 * 96) / 4 - 4320, 6);
		expect(f.withWaste).toBeCloseTo(f.totalArea * 1.1, 6);
		expect(f.units).toBe(Math.ceil(f.withWaste / 144));
		expect(f.totalPerimeter).toBeCloseTo(2 * (144 + 180) + 144 + Math.PI * 96, 6);
		expect(roomArea({ name: "x", shape: "rectangle", a: -5, b: 10 }).area).toBe(0);
		expect(floorArea([{ name: "void", shape: "rectangle", a: 10, b: 10, subtract: true }], 0).warnings[0]).toMatch(/taken away/);
	});
});
