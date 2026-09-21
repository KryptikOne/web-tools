/**
 * Flag semaphore reference. Positions follow the standard numbering:
 * 1 low, 2 out, 3 high (signaller's right side), 4 up,
 * 5 high, 6 out, 7 low (signaller's left side). Rest is both arms down.
 */
export type SemaphorePosition = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const SEMAPHORE_POSITIONS: Record<string, SemaphorePosition[]> = {
	A: [1], B: [2], C: [3], D: [4], E: [5], F: [6], G: [7],
	H: [1, 2], I: [1, 3], K: [1, 4], L: [1, 5], M: [1, 6], N: [1, 7],
	O: [2, 3], P: [2, 4], Q: [2, 5], R: [2, 6], S: [2, 7],
	T: [3, 4], U: [3, 5], Y: [3, 6],
	J: [4, 6], V: [4, 7],
	W: [5, 6], X: [5, 7],
	Z: [6, 7],
};

/**
 * Arm angles in degrees, clockwise from 12 o'clock, as seen by the receiver
 * facing the signaller (signaller's right is the viewer's left).
 */
const POSITION_ANGLE: Record<SemaphorePosition, number> = {
	1: 225,
	2: 270,
	3: 315,
	4: 0,
	5: 45,
	6: 90,
	7: 135,
};

const REST_ANGLE = 180;

/** Two arm angles for a letter; single-position letters keep the other arm at rest. */
export function semaphoreAngles(ch: string): [number, number] | undefined {
	const positions = SEMAPHORE_POSITIONS[ch.toUpperCase()];
	if (!positions) return undefined;
	const [a, b] = positions;
	return [POSITION_ANGLE[a], b === undefined ? REST_ANGLE : POSITION_ANGLE[b]];
}
