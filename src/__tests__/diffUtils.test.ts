import { describe, it, expect } from "vitest";
import {
	diffSequences,
	diffLines,
	diffInline,
	pairChangedLines,
	buildSplitRows,
	buildUnifiedRows,
	collapseUnchanged,
	detectMoves,
	toUnifiedPatch,
	splitLines,
	type DiffOptions,
	type InlineSegment,
} from "@/lib/diffUtils";

const NO_OPTS: DiffOptions = { ignoreWhitespace: false, ignoreCase: false, trimLines: false };

const changedText = (segs: InlineSegment[]) => segs.filter((s) => s.changed).map((s) => s.text);
const joined = (segs: InlineSegment[]) => segs.map((s) => s.text).join("");

/** Apply an op script to `a` and check it reproduces `b`. */
function applyOps(a: number[], b: number[], ops: number[]): number[] {
	const out: number[] = [];
	let i = 0;
	let j = 0;
	for (const op of ops) {
		if (op === 0) {
			expect(a[i]).toBe(b[j]);
			out.push(a[i++]);
			j++;
		} else if (op === 1) i++;
		else out.push(b[j++]);
	}
	return out;
}

describe("diffSequences", () => {
	it("produces a minimal, valid edit script", () => {
		const a = [1, 2, 3, 4, 5, 6];
		const b = [1, 3, 4, 7, 6, 8];
		const ops = diffSequences(a, b);
		expect(applyOps(a, b, ops)).toEqual(b);
		// LCS is [1,3,4,6] → 2 deletes + 2 inserts
		expect(ops.filter((o) => o !== 0)).toHaveLength(4);
	});

	it("handles empty sides", () => {
		expect(diffSequences([], [1, 2])).toEqual([2, 2]);
		expect(diffSequences([1, 2], [])).toEqual([1, 1]);
		expect(diffSequences([], [])).toEqual([]);
	});

	it("round-trips random sequences", () => {
		let seed = 7;
		const rand = () => (seed = (seed * 16807) % 2147483647) % 5;
		for (let t = 0; t < 50; t++) {
			const a = Array.from({ length: 30 }, rand);
			const b = Array.from({ length: 25 }, rand);
			expect(applyOps(a, b, diffSequences(a, b))).toEqual(b);
		}
	});
});

describe("diffLines", () => {
	it("groups changes into blocks with stats", () => {
		const d = diffLines("a\nb\nc\nd", "a\nB\nc\nd\ne", NO_OPTS);
		expect(d.stats).toEqual({ added: 2, removed: 1, unchanged: 3, changes: 2 });
		expect(d.blocks.map((b) => b.type)).toEqual(["equal", "change", "equal", "change"]);
	});

	it("slides added blocks so whole functions read as added", () => {
		const base = ["function a() {", "  one();", "}"];
		const added = ["", "function b() {", "  two();", "}"];
		const addedText = (a: string[], b: string[]) =>
			buildUnifiedRows(diffLines(a.join("\n"), b.join("\n"), NO_OPTS))
				.filter((r) => r.type === "added")
				.map((r) => r.text);
		// Myers alone would mark `}`, "", `function b() {`, `two();` as added and keep the last `}` equal.
		expect(addedText(base, [...base, ...added])).toEqual(added);
		// Mid-file, a leading or trailing blank line are equally readable; the function must be whole.
		const tail = ["", "function c() {", "}"];
		const middle = addedText([...base, ...tail], [...base, ...added, ...tail]);
		expect(middle.filter((t) => t !== "")).toEqual(["function b() {", "  two();", "}"]);
	});

	it("keeps every equal line truly equal after sliding (random input)", () => {
		let seed = 11;
		const pick = () => ["", "}", "a", "b", "{"][(seed = (seed * 16807) % 2147483647) % 5];
		for (let t = 0; t < 200; t++) {
			const a = Array.from({ length: 12 }, pick);
			const b = Array.from({ length: 14 }, pick);
			const d = diffLines(a.join("\n"), b.join("\n"), NO_OPTS);
			let li = 0;
			let ri = 0;
			for (const block of d.blocks) {
				if (block.type === "equal") {
					for (let n = 0; n < block.count; n++) expect(d.left[block.leftStart + n]).toBe(d.right[block.rightStart + n]);
					li += block.count;
					ri += block.count;
				} else {
					li += block.leftCount;
					ri += block.rightCount;
				}
			}
			expect([li, ri]).toEqual([a.length, b.length]);
		}
	});

	it("respects ignore options", () => {
		expect(diffLines("Foo  bar", "foo bar", { ...NO_OPTS, ignoreCase: true, ignoreWhitespace: true }).stats.changes).toBe(0);
		expect(diffLines("  x", "x  ", { ...NO_OPTS, trimLines: true }).stats.changes).toBe(0);
		expect(diffLines("  x", "x  ", NO_OPTS).stats.changes).toBe(1);
	});

	it("splits on any newline style and treats empty text as no lines", () => {
		expect(splitLines("a\r\nb\rc\nd")).toEqual(["a", "b", "c", "d"]);
		expect(splitLines("")).toEqual([]);
		expect(diffLines("", "x", NO_OPTS).stats).toEqual({ added: 1, removed: 0, unchanged: 0, changes: 1 });
	});
});

describe("diffInline", () => {
	it("highlights only the changed word (GitHub-style)", () => {
		const d = diffInline("\tcategory: ToolCategory.UNIT_CONVERTERS,", "\tcategory: ToolCategory.KITCHEN,", "word");
		expect(changedText(d.left)).toEqual(["UNIT_CONVERTERS"]);
		expect(changedText(d.right)).toEqual(["KITCHEN"]);
		expect(d.similarity).toBeGreaterThan(0.5);
	});

	it("highlights individual characters in char mode", () => {
		const d = diffInline("color: grey;", "color: gray;", "char");
		expect(changedText(d.left)).toEqual(["e"]);
		expect(changedText(d.right)).toEqual(["a"]);
	});

	it("folds short equalities into surrounding edits", () => {
		// Without cleanup, the shared " " and "e" would split the highlights.
		const d = diffInline("the quick fox", "a slow fox", "char");
		expect(changedText(d.left)).toEqual(["the quick"]);
		expect(changedText(d.right)).toEqual(["a slow"]);
	});

	it("preserves each side's text exactly", () => {
		const a = "  const x = Foo(1,  2);";
		const b = "const  y = foo(1, 2) ;";
		for (const g of ["word", "char"] as const) {
			for (const opts of [NO_OPTS, { ...NO_OPTS, ignoreCase: true, ignoreWhitespace: true }]) {
				const d = diffInline(a, b, g, opts);
				expect(joined(d.left)).toBe(a);
				expect(joined(d.right)).toBe(b);
			}
		}
	});

	it("does not highlight differences the options ignore", () => {
		const d = diffInline("Hello  World", "hello world!", "word", { ignoreCase: true, ignoreWhitespace: true });
		expect(changedText(d.left)).toEqual([]);
		expect(changedText(d.right)).toEqual(["!"]);
	});
});

describe("pairChangedLines", () => {
	it("pairs similar lines and skips unrelated ones", () => {
		const removed = ["const a = 1;", "totally different text here"];
		const added = ["inserted line about nothing", "const a = 2;"];
		expect(pairChangedLines(removed, added)).toEqual([[0, 1]]);
	});
});

describe("view rows", () => {
	const d = diffLines("one\ntwo\nthree", "one\nTWO 2\nnew\nthree", NO_OPTS);

	it("builds unified rows with removed before added", () => {
		const rows = buildUnifiedRows(d);
		expect(rows.map((r) => r.type)).toEqual(["equal", "removed", "added", "added", "equal"]);
		expect(rows[2].rightNum).toBe(2);
	});

	it("aligns paired lines on one split row", () => {
		const rows = buildSplitRows(diffLines("x = 1\ny", "x = 2\ny", NO_OPTS));
		expect(rows[0].left?.text).toBe("x = 1");
		expect(rows[0].right?.text).toBe("x = 2");
		expect(rows[0].left?.segments && changedText(rows[0].left.segments)).toEqual(["1"]);
	});
});

describe("detectMoves", () => {
	const block = ["function helper(value) {", "  return value * 2;", "}"];
	const filler = ["const a = 1;", "const b = 2;", "const c = 3;"];

	it("finds a block that moved and links both ends", () => {
		const d = diffLines([...block, ...filler].join("\n"), [...filler, ...block].join("\n"), NO_OPTS);
		const moves = detectMoves(d, NO_OPTS);
		expect(moves.blocks).toHaveLength(1);
		const rows = buildUnifiedRows(d, { moves });
		const from = rows.find((r) => r.type === "removed" && r.move?.isStart);
		const to = rows.find((r) => r.type === "added" && r.move?.isStart);
		expect(from?.text).toBe(to?.text);
		expect(from?.move?.counterpart).toBe(to?.rightNum);
		expect(to?.move?.counterpart).toBe(from?.leftNum);
	});

	it("ignores short or trivial blocks", () => {
		const trivial = ["}", "", "}"];
		const d = diffLines([...trivial, ...filler].join("\n"), [...filler, ...trivial].join("\n"), NO_OPTS);
		expect(detectMoves(d, NO_OPTS).blocks).toHaveLength(0);
		const two = diffLines([block[0], block[1], ...filler].join("\n"), [...filler, block[0], block[1]].join("\n"), NO_OPTS);
		expect(detectMoves(two, NO_OPTS).blocks).toHaveLength(0);
	});

	it("follows a block that was moved and edited", () => {
		const edited = ["function helper(value) {", "  return value * 3;", "}"];
		const d = diffLines([...block, ...filler].join("\n"), [...filler, ...edited].join("\n"), NO_OPTS);
		const moves = detectMoves(d, NO_OPTS);
		expect(moves.blocks).toEqual([{ leftStart: 0, rightStart: 3, count: 3, edited: true }]);
		const rows = buildUnifiedRows(d, { moves });
		const changed = rows.filter((r) => r.move && r.segments).map((r) => changedText(r.segments!));
		expect(changed).toEqual([["2"], ["3"]]);
	});

	it("follows a block that was moved and re-indented", () => {
		const indented = block.map((l) => "\t" + l);
		const d = diffLines([...block, ...filler].join("\n"), [...filler, ...indented].join("\n"), NO_OPTS);
		expect(detectMoves(d, NO_OPTS).blocks).toMatchObject([{ count: 3, edited: true }]);
		// With whitespace ignored it is an exact move.
		const ws = { ...NO_OPTS, ignoreWhitespace: true, trimLines: true };
		expect(detectMoves(diffLines([...block, ...filler].join("\n"), [...filler, ...indented].join("\n"), ws), ws).blocks).toMatchObject([{ edited: false }]);
	});

	it("leaves neighbouring braces and blank lines out of an edited move", () => {
		// A removed function sits right above the moved one, as in the Sample.
		const gone = ["function gone() {", "  bye();", "}", ""];
		const moved = ["function helper(value) {", "  return value * 2;", "  return value;", "}", ""];
		const edited = ["function helper(value) {", "  return value * 3;", "  return value;", "}"];
		const big = ["function big() {", "  a();", "  b();", "  c();", "  d();", "  e();", "}"];
		const d = diffLines([...gone, ...moved, ...big].join("\n"), [...big, "", ...edited].join("\n"), NO_OPTS);
		const [move] = detectMoves(d, NO_OPTS).blocks;
		expect(move).toMatchObject({ count: 4, edited: true });
		expect(d.left[move.leftStart]).toBe(moved[0]);
		expect(d.right[move.rightStart]).toBe(edited[0]);
	});

	it("does not report in-place re-indentation as a move", () => {
		const wrapped = ["if (enabled) {", ...block.map((l) => "\t" + l), "}"];
		const d = diffLines([...filler, ...block].join("\n"), [...filler, ...wrapped].join("\n"), NO_OPTS);
		expect(detectMoves(d, NO_OPTS).blocks).toHaveLength(0);
	});

	it("does not grow moves over dissimilar neighbours", () => {
		const a = ["alpha one();", "return computeTotal(items);", "zeta two();", "const keep = 1;"];
		const b = ["const keep = 1;", "something else entirely", "return computeTotal(items);", "unrelated thing here"];
		const d = diffLines(a.join("\n"), b.join("\n"), NO_OPTS);
		expect(detectMoves(d, NO_OPTS).blocks).toHaveLength(0);
	});

	it("never pairs moved lines for intra-line highlights", () => {
		const d = diffLines([...block, "x = 1", ...filler].join("\n"), [...filler, "x = 2", ...block].join("\n"), NO_OPTS);
		const rows = buildUnifiedRows(d, { moves: detectMoves(d, NO_OPTS) });
		expect(rows.filter((r) => r.move && r.segments)).toHaveLength(0);
	});
});

describe("collapseUnchanged", () => {
	it("keeps context around changes and hides the rest", () => {
		const rows = Array.from({ length: 20 }, (_, i) => (i === 10 ? "change" : "same"));
		const items = collapseUnchanged(rows, (r) => r === "same", 2);
		expect(items.filter((i) => i.type === "gap").map((g) => g.type === "gap" && [g.start, g.end])).toEqual([
			[0, 8],
			[13, 20],
		]);
	});

	it("does not collapse tiny runs", () => {
		const rows = ["c", "s", "s", "s", "s", "s", "c"];
		expect(collapseUnchanged(rows, (r) => r === "s", 1).every((i) => i.type === "row")).toBe(true);
	});
});

describe("toUnifiedPatch", () => {
	it("matches diff -u output", () => {
		const a = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].join("\n");
		const b = ["1", "2", "3", "4", "five", "6", "7", "8", "9"].join("\n");
		expect(toUnifiedPatch(diffLines(a, b, NO_OPTS))).toBe(
			["--- original", "+++ modified", "@@ -2,7 +2,7 @@", " 2", " 3", " 4", "-5", "+five", " 6", " 7", " 8", ""].join("\n")
		);
	});

	it("uses start-1 for an empty range", () => {
		expect(toUnifiedPatch(diffLines("", "a", NO_OPTS))).toBe("--- original\n+++ modified\n@@ -0,0 +1,1 @@\n+a\n");
	});

	it("returns empty string for identical input", () => {
		expect(toUnifiedPatch(diffLines("a", "a", NO_OPTS))).toBe("");
	});
});
