/**
 * Floor areas: rooms as rectangles, right triangles or circles, with area and perimeter, totals
 * and a flooring quantity with waste. Lengths in inches, areas in square inches.
 */

export type RoomShape = "rectangle" | "triangle" | "circle";

export interface Room {
	name: string;
	shape: RoomShape;
	/** Rectangle width, triangle base or circle diameter */
	a: number;
	/** Rectangle length or triangle height; unused for a circle */
	b: number;
	/** Rooms taken away, e.g. a stair void: negative contribution */
	subtract?: boolean;
}

export interface RoomArea extends Room {
	area: number;
	perimeter: number;
}

export interface FloorArea {
	rooms: RoomArea[];
	totalArea: number;
	totalPerimeter: number;
	/** Area to buy with the waste allowance */
	withWaste: number;
	/** Whole units of flooring, when a unit coverage is given */
	units: number;
	warnings: string[];
}

export function roomArea(room: Room): RoomArea {
	const a = Math.max(0, room.a);
	const b = Math.max(0, room.b);
	let area = 0;
	let perimeter = 0;
	switch (room.shape) {
		case "triangle":
			area = (a * b) / 2;
			perimeter = a + b + Math.hypot(a, b);
			break;
		case "circle":
			area = (Math.PI * a * a) / 4;
			perimeter = Math.PI * a;
			break;
		default:
			area = a * b;
			perimeter = 2 * (a + b);
	}
	return { ...room, area, perimeter };
}

export function floorArea(rooms: Room[], wastePercent: number, unitCoverage = 0): FloorArea {
	const list = rooms.slice(0, 200).map(roomArea);
	const totalArea = list.reduce((s, r) => s + (r.subtract ? -r.area : r.area), 0);
	const totalPerimeter = list.reduce((s, r) => s + (r.subtract ? 0 : r.perimeter), 0);
	const withWaste = Math.max(0, totalArea) * (1 + Math.max(0, wastePercent) / 100);
	const warnings: string[] = [];
	if (totalArea < 0) warnings.push("More is taken away than the rooms contain");
	return {
		rooms: list,
		totalArea,
		totalPerimeter,
		withWaste,
		units: unitCoverage > 0 ? Math.ceil(withWaste / unitCoverage - 1e-9) : 0,
		warnings,
	};
}
