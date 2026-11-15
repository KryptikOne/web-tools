import { describe, it, expect } from "vitest";
import { tileFit, tileCount, tilesAlong, simpleTileCount } from "@/lib/construction/tileUtils";

const base = { width: 100, tile: 12, joint: 0.25 };

describe("tileFit", () => {
	it("whole tiles with the slack in the wall joints", () => {
		const r = tileFit({ ...base, mode: "wall-joint" })!;
		// 8 tiles: 8×12 + 7×0.25 = 97.75, 2.25 left → 1.125 each wall
		expect(r.count).toBe(8);
		expect(r.fullTiles).toBe(8);
		expect(r.startGap).toBeCloseTo(1.125, 9);
		expect(r.endGap).toBeCloseTo(1.125, 9);
	});

	it("flush: full first tile, last cut to the wall, no wall joints", () => {
		const r = tileFit({ ...base, mode: "flush" })!;
		expect(r.tiles[0].near).toBe(0);
		expect(r.count).toBe(9);
		expect(r.lastWidth).toBeCloseTo(100 - 8 * 12.25, 9);
		expect(r.tiles[8].cut).toBe(true);
		expect(r.endGap).toBeCloseTo(0, 9);
	});

	it("full first with wall joints cuts only the last", () => {
		const r = tileFit({ ...base, mode: "full-first" })!;
		expect(r.startGap).toBe(0.25);
		expect(r.endGap).toBeCloseTo(0.25, 9);
		expect(r.lastWidth).toBeCloseTo(99.5 - 8 * 12.25, 9);
	});

	it("cut both ends evenly keeps the end cuts at least half a tile", () => {
		const r = tileFit({ ...base, mode: "cut-both" })!;
		expect(r.firstWidth).toBeCloseTo(r.lastWidth, 9);
		expect(r.firstWidth).toBeGreaterThanOrEqual(6);
		expect(r.tiles[0].cut).toBe(true);
		expect(r.fullTiles).toBe(r.count - 2);
		expect(r.tiles[r.count - 1].far).toBeCloseTo(100 - 0.25, 9);
	});

	it("cut first tile at a set position", () => {
		const r = tileFit({ ...base, mode: "cut-first-at", firstTileEnd: 8 })!;
		expect(r.tiles[0]).toMatchObject({ near: 0.25, far: 8 });
		expect(r.tiles[1].near).toBeCloseTo(8.25, 9);
		expect(r.endGap).toBeCloseTo(0.25, 9);
	});

	it("fit evenly adjusts the joint and says so", () => {
		const r = tileFit({ ...base, mode: "fit-evenly" })!;
		expect(r.fullTiles).toBe(r.count);
		expect(r.count).toBe(8);
		expect(r.joint).toBeCloseTo((100 - 96) / 9, 9);
		expect(r.warnings[0]).toMatch(/Joint adjusted/);
		expect(r.tiles[7].far + r.joint).toBeCloseTo(100, 9);
	});

	it("flags slivers and rejects tiles wider than the room", () => {
		const r = tileFit({ width: 98.3, tile: 12, joint: 0.25, mode: "flush" })!;
		expect(r.warnings.some((w) => /sliver/.test(w))).toBe(true);
		expect(tileFit({ width: 10, tile: 12, joint: 0.25, mode: "flush" })).toBeNull();
	});
});

describe("tileCount", () => {
	it("counts along one side with the page's rules", () => {
		expect(tilesAlong(100, 12, 0.25)).toEqual({ full: 8, cut: 1 });
		// 98" covers 8 tiles exactly (97.75) with 0.25 left: a sliver no wider than the joint, not counted
		expect(tilesAlong(98, 12, 0.25)).toEqual({ full: 8, cut: 0 });
		expect(tilesAlong(97.75, 12, 0.25)).toEqual({ full: 8, cut: 0 });
	});

	it("totals tiles, waste, boxes and cost", () => {
		const r = tileCount({ areaWidth: 120, areaLength: 96, tileWidth: 12, tileLength: 12, joint: 0.25, wastePercent: 10, tilesPerBox: 10, costPerTile: 2.5 })!;
		expect(r.across).toBe(10);
		expect(r.down).toBe(8);
		expect(r.tiles).toBe(80);
		expect(r.tilesWithWaste).toBe(88);
		expect(r.boxes).toBe(9);
		expect(r.tilesToBuy).toBe(90);
		expect(r.cost).toBeCloseTo(225, 9);
	});

	it("simple count from an area", () => {
		const r = simpleTileCount({ areaSquareInches: 144 * 100, tileWidth: 12, tileLength: 12, wastePercent: 5, tilesPerBox: 12, costPerTile: 3 })!;
		expect(r.tiles).toBe(100);
		expect(r.tilesWithWaste).toBe(105);
		expect(r.boxes).toBe(9);
		expect(r.cost).toBe(324);
	});
});
