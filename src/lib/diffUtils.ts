/**
 * Text diffing: line-level Myers diff, intra-line (word / character)
 * highlighting for changed lines, moved-block detection, view models for
 * split and unified rendering, unchanged-region collapsing and unified
 * patch output.
 */

export interface DiffOptions {
	ignoreWhitespace: boolean;
	ignoreCase: boolean;
	trimLines: boolean;
}

export type InlineGranularity = "word" | "char";

export interface InlineSegment {
	text: string;
	changed: boolean;
}

export interface InlineDiff {
	left: InlineSegment[];
	right: InlineSegment[];
	/** 0..1, share of non-whitespace characters the two lines have in common */
	similarity: number;
}

export type DiffBlock =
	| { type: "equal"; leftStart: number; rightStart: number; count: number }
	| { type: "change"; leftStart: number; leftCount: number; rightStart: number; rightCount: number };

export interface LineDiff {
	left: string[];
	right: string[];
	/** Alternating runs of equal and changed lines (0-based line indices) */
	blocks: DiffBlock[];
	stats: { added: number; removed: number; unchanged: number; changes: number };
}

export interface DiffCell {
	/** 1-based line number */
	num: number;
	text: string;
	/** Intra-line highlights, or null when the line is changed as a whole */
	segments: InlineSegment[] | null;
	move: RowMove | null;
}

export interface MovedBlock {
	leftStart: number;
	rightStart: number;
	count: number;
	/** Some lines changed during the move (beyond what the options ignore) */
	edited: boolean;
}

export interface MoveMap {
	blocks: MovedBlock[];
	/** Left / right line index → index into `blocks` */
	byLeft: Map<number, number>;
	byRight: Map<number, number>;
}

export interface RowMove {
	/** Index into MoveMap.blocks */
	index: number;
	/** 1-based line where the block starts on the other side */
	counterpart: number;
	/** First line of the moved block */
	isStart: boolean;
	edited: boolean;
}

export interface RowOptions {
	granularity?: InlineGranularity;
	options?: Partial<DiffOptions>;
	moves?: MoveMap;
}

export const NO_MOVES: MoveMap = { blocks: [], byLeft: new Map(), byRight: new Map() };

export interface UnifiedRow {
	type: "equal" | "removed" | "added";
	leftNum: number | null;
	rightNum: number | null;
	text: string;
	segments: InlineSegment[] | null;
	move: RowMove | null;
	/** Index of the change block this row belongs to, -1 for unchanged rows */
	changeIndex: number;
}

export interface SplitRow {
	type: "equal" | "change";
	left: DiffCell | null;
	right: DiffCell | null;
	changeIndex: number;
}

export type CollapsedItem<T> =
	| { type: "row"; row: T; index: number }
	| { type: "gap"; start: number; end: number; header: string | null };

const EQUAL = 0;
const DELETE = 1;
const INSERT = 2;

/** Above this edit distance Myers' trace gets too large; the middle is treated as replaced. */
const MAX_EDIT_DISTANCE = 3000;

/** Changed lines below this similarity are not paired for intra-line highlighting. */
const PAIR_SIMILARITY_THRESHOLD = 0.4;

/** Change blocks up to this many removed×added lines get optimal pairing; larger ones pair by position. */
const PAIR_MATRIX_LIMIT = 900;

/** A moved block needs this many lines and alphanumeric characters (git uses 20 characters). */
const MIN_MOVE_LINES = 3;
const MIN_MOVE_ALNUM = 20;
/** A single line must have this many alphanumeric characters to seed a move. */
const MIN_SEED_ALNUM = 10;
/** Neighbours of a moved seed join the block at this word similarity. */
const MOVE_SIMILARITY_THRESHOLD = 0.6;
/** Cap on identical added lines tried as a move target, for very repetitive input. */
const MAX_MOVE_CANDIDATES = 200;

/** Unchanged runs hide only when at least this many lines would be hidden. */
const MIN_COLLAPSED_LINES = 4;

// ---------------------------------------------------------------------------
// Core sequence diff
// ---------------------------------------------------------------------------

/**
 * Myers O(ND) diff over integer keys. Returns one op per element of the edit
 * script: EQUAL (0), DELETE (1), INSERT (2), in order.
 */
export function diffSequences(a: ArrayLike<number>, b: ArrayLike<number>): number[] {
	let start = 0;
	while (start < a.length && start < b.length && a[start] === b[start]) start++;

	let endA = a.length;
	let endB = b.length;
	while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
		endA--;
		endB--;
	}

	const ops: number[] = new Array(start).fill(EQUAL);
	const middle = myersMiddle(a, start, endA, b, start, endB);
	for (const op of middle) ops.push(op);
	for (let i = endA; i < a.length; i++) ops.push(EQUAL);
	return ops;
}

function myersMiddle(
	a: ArrayLike<number>,
	aLo: number,
	aHi: number,
	b: ArrayLike<number>,
	bLo: number,
	bHi: number
): number[] {
	const n = aHi - aLo;
	const m = bHi - bLo;
	if (n === 0) return new Array(m).fill(INSERT);
	if (m === 0) return new Array(n).fill(DELETE);

	const max = n + m;
	const offset = max + 1;
	const v = new Int32Array(2 * max + 3);
	// trace[d] holds v for k in [-d, d] as it was before step d (index k + d)
	const trace: Int32Array[] = [];
	let found = -1;

	outer: for (let d = 0; d <= max; d++) {
		if (d > MAX_EDIT_DISTANCE) break;
		trace.push(v.slice(offset - d, offset + d + 1));
		for (let k = -d; k <= d; k += 2) {
			let x =
				k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
					? v[offset + k + 1]
					: v[offset + k - 1] + 1;
			let y = x - k;
			while (x < n && y < m && a[aLo + x] === b[bLo + y]) {
				x++;
				y++;
			}
			v[offset + k] = x;
			if (x >= n && y >= m) {
				found = d;
				break outer;
			}
		}
	}

	if (found === -1) {
		return [...new Array(n).fill(DELETE), ...new Array(m).fill(INSERT)];
	}

	const ops: number[] = [];
	let x = n;
	let y = m;
	for (let d = found; d > 0; d--) {
		const snap = trace[d];
		const at = (k: number) => snap[k + d];
		const k = x - y;
		const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
		const prevX = at(prevK);
		const prevY = prevX - prevK;
		while (x > prevX && y > prevY) {
			ops.push(EQUAL);
			x--;
			y--;
		}
		ops.push(prevK === k + 1 ? INSERT : DELETE);
		x = prevX;
		y = prevY;
	}
	while (x > 0 && y > 0) {
		ops.push(EQUAL);
		x--;
		y--;
	}
	return ops.reverse();
}

/** Map strings to integer keys, sharing one table so equal strings get equal keys. */
function toKeys(items: string[], table: Map<string, number>): Int32Array {
	const keys = new Int32Array(items.length);
	for (let i = 0; i < items.length; i++) {
		let key = table.get(items[i]);
		if (key === undefined) {
			key = table.size;
			table.set(items[i], key);
		}
		keys[i] = key;
	}
	return keys;
}

// ---------------------------------------------------------------------------
// Line diff
// ---------------------------------------------------------------------------

/** Split text into lines, accepting \n, \r\n and \r. Empty text has no lines. */
export function splitLines(text: string): string[] {
	if (text === "") return [];
	return text.split(/\r\n|\r|\n/);
}

export function normalizeLine(line: string, options: DiffOptions): string {
	let normalized = line;
	if (options.trimLines) normalized = normalized.trim();
	if (options.ignoreWhitespace) normalized = normalized.replace(/\s+/g, " ");
	if (options.ignoreCase) normalized = normalized.toLowerCase();
	return normalized;
}

export function diffLines(original: string, modified: string, options: DiffOptions): LineDiff {
	const left = splitLines(original);
	const right = splitLines(modified);
	const table = new Map<string, number>();
	const leftKeys = toKeys(left.map((l) => normalizeLine(l, options)), table);
	const rightKeys = toKeys(right.map((l) => normalizeLine(l, options)), table);
	const ops = diffSequences(leftKeys, rightKeys);
	slideRuns(ops, left, leftKeys, right, rightKeys);

	const blocks: DiffBlock[] = [];
	const stats = { added: 0, removed: 0, unchanged: 0, changes: 0 };
	let li = 0;
	let ri = 0;
	let i = 0;
	while (i < ops.length) {
		if (ops[i] === EQUAL) {
			const start = i;
			while (i < ops.length && ops[i] === EQUAL) i++;
			const count = i - start;
			blocks.push({ type: "equal", leftStart: li, rightStart: ri, count });
			stats.unchanged += count;
			li += count;
			ri += count;
		} else {
			let leftCount = 0;
			let rightCount = 0;
			while (i < ops.length && ops[i] !== EQUAL) {
				if (ops[i] === DELETE) leftCount++;
				else rightCount++;
				i++;
			}
			blocks.push({ type: "change", leftStart: li, leftCount, rightStart: ri, rightCount });
			stats.removed += leftCount;
			stats.added += rightCount;
			stats.changes++;
			li += leftCount;
			ri += rightCount;
		}
	}

	return { left, right, blocks, stats };
}

/**
 * A run of purely added (or removed) lines can often shift up or down and
 * still be a valid diff, e.g. `}` `""` `fn() {` … versus `""` `fn() {` … `}`.
 * Myers picks one arbitrarily; like git's slider heuristics, move each run
 * to the position whose edges fall on blank lines or the ends of the file,
 * so whole blocks read as added or removed. Mutates `ops`.
 */
function slideRuns(ops: number[], left: string[], leftKeys: Int32Array, right: string[], rightKeys: Int32Array) {
	let li = 0;
	let ri = 0;
	let a = 0;
	while (a < ops.length) {
		if (ops[a] === EQUAL) {
			li++;
			ri++;
			a++;
			continue;
		}
		let b = a;
		let deletes = 0;
		while (b < ops.length && ops[b] !== EQUAL) {
			if (ops[b] === DELETE) deletes++;
			b++;
		}
		const len = b - a;
		if (deletes === 0 || deletes === len) {
			const op = ops[a];
			const [lines, keys, start] = op === DELETE ? [left, leftKeys, li] : [right, rightKeys, ri];
			const isEqual = (n: number) => n >= 0 && n < ops.length && ops[n] === EQUAL;
			// How far the run can shift while staying between unchanged lines.
			let up = 0;
			while (isEqual(a - up - 1) && (a - up - 2 < 0 || isEqual(a - up - 2)) && keys[start - up - 1] === keys[start + len - up - 1]) up++;
			let down = 0;
			while (isEqual(b + down) && (b + down + 1 >= ops.length || isEqual(b + down + 1)) && keys[start + down] === keys[start + len + down]) down++;

			let best = 0;
			let bestScore = runEdgeScore(lines, start, len);
			for (let offset = -up; offset <= down; offset++) {
				const score = runEdgeScore(lines, start + offset, len);
				if (score > bestScore || (score === bestScore && Math.abs(offset) < Math.abs(best))) {
					best = offset;
					bestScore = score;
				}
			}
			if (best !== 0) {
				ops.fill(EQUAL, a, b);
				ops.fill(op, a + best, b + best);
			}
			// Continue after the run's final position; the side counters only depend on op counts.
			const end = b + Math.max(best, 0);
			for (let n = a; n < end; n++) {
				if (ops[n] !== INSERT) li++;
				if (ops[n] !== DELETE) ri++;
			}
			a = end;
			continue;
		}
		li += deletes;
		ri += len - deletes;
		a = b;
	}
}

/** Score a run's two edges: each edge on a blank line or file boundary is readable. */
function runEdgeScore(lines: string[], start: number, len: number): number {
	const isBreak = (n: number) => n < 0 || n >= lines.length || lines[n].trim() === "";
	const top = isBreak(start - 1) || isBreak(start) ? 1 : 0;
	const bottom = isBreak(start + len - 1) || isBreak(start + len) ? 1 : 0;
	return top + bottom;
}

// ---------------------------------------------------------------------------
// Intra-line diff
// ---------------------------------------------------------------------------

const WORD_TOKEN = /[A-Za-z0-9_À-ɏͰ-ϿЀ-ӿ]+|\s+|[\s\S]/g;

export function tokenize(text: string, granularity: InlineGranularity): string[] {
	if (granularity === "char") return Array.from(text);
	return text.match(WORD_TOKEN) ?? [];
}

interface Chunk {
	type: number;
	text: string;
}

/** Merge each run of edits into one delete + one insert, and adjacent equals into one. */
function normalizeChunks(chunks: Chunk[]): Chunk[] {
	const out: Chunk[] = [];
	let del = "";
	let ins = "";
	const flush = () => {
		if (del) out.push({ type: DELETE, text: del });
		if (ins) out.push({ type: INSERT, text: ins });
		del = "";
		ins = "";
	};
	for (const chunk of chunks) {
		if (!chunk.text) continue;
		if (chunk.type === DELETE) del += chunk.text;
		else if (chunk.type === INSERT) ins += chunk.text;
		else {
			flush();
			const last = out[out.length - 1];
			if (last && last.type === EQUAL) last.text += chunk.text;
			else out.push({ ...chunk });
		}
	}
	flush();
	return out;
}

/**
 * Fold short equalities that sit between edits into the edits (in the spirit
 * of diff-match-patch's semantic cleanup), so highlights read as whole
 * changes instead of confetti.
 */
function cleanupSemantic(input: Chunk[]): Chunk[] {
	let chunks = normalizeChunks(input);
	for (;;) {
		let folded = false;
		for (let i = 0; i < chunks.length; i++) {
			if (chunks[i].type !== EQUAL) continue;
			const before = editLengths(chunks, i - 1, -1);
			const after = editLengths(chunks, i + 1, 1);
			if (!before || !after) continue;
			const len = chunks[i].text.length;
			if (len <= Math.max(before.del, before.ins) && len <= Math.max(after.del, after.ins)) {
				const text = chunks[i].text;
				chunks.splice(i, 1, { type: DELETE, text }, { type: INSERT, text });
				chunks = normalizeChunks(chunks);
				folded = true;
				break;
			}
		}
		if (!folded) return chunks;
	}
}

function editLengths(chunks: Chunk[], from: number, step: 1 | -1) {
	let del = 0;
	let ins = 0;
	for (let i = from; i >= 0 && i < chunks.length && chunks[i].type !== EQUAL; i += step) {
		if (chunks[i].type === DELETE) del += chunks[i].text.length;
		else ins += chunks[i].text.length;
	}
	return del || ins ? { del, ins } : null;
}

function tokenKey(token: string, options: Partial<DiffOptions>): string {
	if ((options.ignoreWhitespace || options.trimLines) && /^\s+$/.test(token)) return " ";
	return options.ignoreCase ? token.toLowerCase() : token;
}

/** Push a segment, merging with the previous one when the changed flag matches. */
function pushSegment(segments: InlineSegment[], text: string, changed: boolean) {
	const last = segments[segments.length - 1];
	if (last && last.changed === changed) last.text += text;
	else segments.push({ text, changed });
}

/** Whitespace edits the active options say to ignore are shown as unchanged. */
function unmarkIgnoredWhitespace(segments: InlineSegment[], options: Partial<DiffOptions>): InlineSegment[] {
	if (!options.ignoreWhitespace && !options.trimLines) return segments;
	const out: InlineSegment[] = [];
	segments.forEach((seg, i) => {
		const isEdge = i === 0 || i === segments.length - 1;
		const ignorable =
			seg.changed && /^\s+$/.test(seg.text) && (options.ignoreWhitespace || isEdge);
		pushSegment(out, seg.text, ignorable ? false : seg.changed);
	});
	return out;
}

const nonWhitespaceLength = (text: string) => text.replace(/\s+/g, "").length;

/** Diff two lines at word or character granularity. */
export function diffInline(
	a: string,
	b: string,
	granularity: InlineGranularity,
	options: Partial<DiffOptions> = {}
): InlineDiff {
	const aTokens = tokenize(a, granularity);
	const bTokens = tokenize(b, granularity);
	const table = new Map<string, number>();
	const ops = diffSequences(
		toKeys(aTokens.map((t) => tokenKey(t, options)), table),
		toKeys(bTokens.map((t) => tokenKey(t, options)), table)
	);

	// Equal tokens can differ in raw text under ignore options, so keep both sides.
	const raw: Array<Chunk & { right?: string }> = [];
	let ai = 0;
	let bi = 0;
	for (const op of ops) {
		if (op === EQUAL) raw.push({ type: EQUAL, text: aTokens[ai++], right: bTokens[bi++] });
		else if (op === DELETE) raw.push({ type: DELETE, text: aTokens[ai++] });
		else raw.push({ type: INSERT, text: bTokens[bi++] });
	}

	const hasIgnoredDifferences = raw.some((c) => c.type === EQUAL && c.text !== c.right);
	const left: InlineSegment[] = [];
	const right: InlineSegment[] = [];
	let common = 0;

	if (hasIgnoredDifferences) {
		// Skip semantic cleanup so each side keeps its own text for equal tokens.
		for (const c of raw) {
			if (c.type === EQUAL) {
				pushSegment(left, c.text, false);
				pushSegment(right, c.right ?? c.text, false);
				common += nonWhitespaceLength(c.text);
			} else if (c.type === DELETE) pushSegment(left, c.text, true);
			else pushSegment(right, c.text, true);
		}
	} else {
		for (const c of cleanupSemantic(raw)) {
			if (c.type === EQUAL) {
				pushSegment(left, c.text, false);
				pushSegment(right, c.text, false);
				common += nonWhitespaceLength(c.text);
			} else if (c.type === DELETE) pushSegment(left, c.text, true);
			else pushSegment(right, c.text, true);
		}
	}

	const total = nonWhitespaceLength(a) + nonWhitespaceLength(b);
	return {
		left: unmarkIgnoredWhitespace(left, options),
		right: unmarkIgnoredWhitespace(right, options),
		similarity: total === 0 ? 1 : (2 * common) / total,
	};
}

/**
 * Pair removed lines with the added lines they most plausibly became, in
 * order. Small blocks use an order-preserving best-total-similarity
 * alignment; large blocks pair by position. Returns [removedIdx, addedIdx].
 */
export function pairChangedLines(
	removed: string[],
	added: string[],
	options: Partial<DiffOptions> = {}
): Array<[number, number]> {
	const r = removed.length;
	const a = added.length;
	if (r === 0 || a === 0) return [];

	const similarity = (i: number, j: number) => diffInline(removed[i], added[j], "word", options).similarity;

	if (r * a > PAIR_MATRIX_LIMIT) {
		const pairs: Array<[number, number]> = [];
		for (let i = 0; i < Math.min(r, a); i++) {
			if (similarity(i, i) >= PAIR_SIMILARITY_THRESHOLD) pairs.push([i, i]);
		}
		return pairs;
	}

	const best: number[][] = Array.from({ length: r + 1 }, () => new Array(a + 1).fill(0));
	const sim: number[][] = Array.from({ length: r }, () => new Array(a).fill(0));
	for (let i = 1; i <= r; i++) {
		for (let j = 1; j <= a; j++) {
			sim[i - 1][j - 1] = similarity(i - 1, j - 1);
			const match =
				sim[i - 1][j - 1] >= PAIR_SIMILARITY_THRESHOLD ? best[i - 1][j - 1] + sim[i - 1][j - 1] : -1;
			best[i][j] = Math.max(best[i - 1][j], best[i][j - 1], match);
		}
	}

	const pairs: Array<[number, number]> = [];
	let i = r;
	let j = a;
	while (i > 0 && j > 0) {
		const s = sim[i - 1][j - 1];
		if (s >= PAIR_SIMILARITY_THRESHOLD && best[i][j] === best[i - 1][j - 1] + s) {
			pairs.push([i - 1, j - 1]);
			i--;
			j--;
		} else if (best[i][j] === best[i - 1][j]) i--;
		else j--;
	}
	return pairs.reverse();
}

// ---------------------------------------------------------------------------
// Moved lines
// ---------------------------------------------------------------------------

/**
 * Detect blocks of removed lines that reappear as added lines elsewhere.
 *
 * Seeds are lines that match once indentation is ignored. Seeds that cross
 * change blocks grow over neighbouring lines that are merely similar, which
 * catches code that was moved and then edited or re-indented. Within one
 * change block only exact runs count, so in-place edits are never reported
 * as moves. Like git's --color-moved, a block must be long and substantial
 * enough that braces, blank lines and other boilerplate never qualify.
 */
export function detectMoves(diff: LineDiff, options: DiffOptions): MoveMap {
	const seedOptions = { ...options, trimLines: true, ignoreWhitespace: true };
	const changeBlocks = diff.blocks.filter((b): b is ChangeBlock => b.type === "change");
	const left = new Map<number, LineInfo>();
	const right = new Map<number, LineInfo>();
	const addedBySeed = new Map<string, number[]>();

	changeBlocks.forEach((block, b) => {
		for (let i = block.leftStart; i < block.leftStart + block.leftCount; i++) {
			left.set(i, lineInfo(diff.left[i], b, options, seedOptions));
		}
		for (let j = block.rightStart; j < block.rightStart + block.rightCount; j++) {
			const info = lineInfo(diff.right[j], b, options, seedOptions);
			right.set(j, info);
			if (alnumCount(info.seed) < MIN_SEED_ALNUM) continue;
			const list = addedBySeed.get(info.seed);
			if (list) list.push(j);
			else addedBySeed.set(info.seed, [j]);
		}
	});

	const moves: MoveMap = { blocks: [], byLeft: new Map(), byRight: new Map() };
	/** Both lines are unclaimed changed lines in the given change blocks. */
	const open = (i: number, j: number, leftBlock: number, rightBlock: number) =>
		left.get(i)?.block === leftBlock &&
		right.get(j)?.block === rightBlock &&
		!moves.byLeft.has(i) &&
		!moves.byRight.has(j);
	const similar = (i: number, j: number) =>
		left.get(i)!.seed === right.get(j)!.seed ||
		diffInline(diff.left[i], diff.right[j], "word", options).similarity >= MOVE_SIMILARITY_THRESHOLD;

	changeBlocks.forEach((block, b) => {
		for (let i = block.leftStart; i < block.leftStart + block.leftCount; i++) {
			if (moves.byLeft.has(i)) continue;

			// Longest run of matching lines starting at i.
			let bestLen = 0;
			let bestJ = -1;
			for (const j of (addedBySeed.get(left.get(i)!.seed) ?? []).slice(0, MAX_MOVE_CANDIDATES)) {
				const rb = right.get(j)!.block;
				const sameBlock = rb === b;
				let len = 0;
				while (
					open(i + len, j + len, b, rb) &&
					(sameBlock
						? left.get(i + len)!.key === right.get(j + len)!.key
						: left.get(i + len)!.seed === right.get(j + len)!.seed)
				) {
					len++;
				}
				if (len > bestLen) {
					bestLen = len;
					bestJ = j;
				}
			}
			if (!bestLen) continue;

			// Grow cross-block runs over similar neighbours, in both directions.
			let from = 0;
			let to = bestLen;
			const rb = right.get(bestJ)!.block;
			if (rb !== b) {
				while (open(i + from - 1, bestJ + from - 1, b, rb) && similar(i + from - 1, bestJ + from - 1)) from--;
				while (open(i + to, bestJ + to, b, rb) && similar(i + to, bestJ + to)) to++;
				// A leading brace or blank line belongs to the code above, not the move; a
				// trailing brace usually closes the moved block, so only blank lines go.
				while (from < 0 && alnumCount(left.get(i + from)!.seed) === 0) from++;
				while (to > bestLen && left.get(i + to - 1)!.seed === "") to--;
			}

			const leftStart = i + from;
			const rightStart = bestJ + from;
			const count = to - from;
			let alnum = 0;
			let edited = false;
			for (let n = 0; n < count; n++) {
				alnum += alnumCount(left.get(leftStart + n)!.seed);
				if (left.get(leftStart + n)!.key !== right.get(rightStart + n)!.key) edited = true;
			}
			if (count < MIN_MOVE_LINES || alnum < MIN_MOVE_ALNUM) continue;

			const index = moves.blocks.length;
			moves.blocks.push({ leftStart, rightStart, count, edited });
			for (let n = 0; n < count; n++) {
				moves.byLeft.set(leftStart + n, index);
				moves.byRight.set(rightStart + n, index);
			}
			i = leftStart + count - 1;
		}
	});
	return moves;
}

interface LineInfo {
	/** Change block index */
	block: number;
	/** Comparison key under the active options */
	key: string;
	/** Indentation- and whitespace-insensitive key used to find move candidates */
	seed: string;
}

function lineInfo(line: string, block: number, options: DiffOptions, seedOptions: DiffOptions): LineInfo {
	return { block, key: normalizeLine(line, options), seed: normalizeLine(line, seedOptions) };
}

const alnumCount = (text: string) => text.replace(/[^A-Za-z0-9]/g, "").length;

function moveAt(moves: MoveMap, side: "left" | "right", line: number): RowMove | null {
	const index = (side === "left" ? moves.byLeft : moves.byRight).get(line);
	if (index === undefined) return null;
	const block = moves.blocks[index];
	return side === "left"
		? { index, counterpart: block.rightStart + 1, isStart: line === block.leftStart, edited: block.edited }
		: { index, counterpart: block.leftStart + 1, isStart: line === block.rightStart, edited: block.edited };
}

/** Intra-line highlights between a line of an edited move and its counterpart. */
function moveSegments(diff: LineDiff, side: "left" | "right", line: number, rowOptions: RowOptions): InlineSegment[] | null {
	const moves = rowOptions.moves ?? NO_MOVES;
	const index = (side === "left" ? moves.byLeft : moves.byRight).get(line);
	if (index === undefined || !moves.blocks[index].edited) return null;
	const block = moves.blocks[index];
	const offset = line - (side === "left" ? block.leftStart : block.rightStart);
	const a = diff.left[block.leftStart + offset];
	const b = diff.right[block.rightStart + offset];
	if (a === b) return null;
	const inline = diffInline(a, b, rowOptions.granularity ?? "word", rowOptions.options ?? {});
	return side === "left" ? inline.left : inline.right;
}

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

type ChangeBlock = Extract<DiffBlock, { type: "change" }>;

interface ChangeLayout {
	removed: string[];
	added: string[];
	pairs: Array<[number, number]>;
	inline: Map<string, InlineDiff>;
}

/** Pair a change block's lines for intra-line highlighting. Moved lines are never paired. */
function layoutChange(diff: LineDiff, block: ChangeBlock, rowOptions: RowOptions): ChangeLayout {
	const { granularity = "word", options = {}, moves = NO_MOVES } = rowOptions;
	const removed = diff.left.slice(block.leftStart, block.leftStart + block.leftCount);
	const added = diff.right.slice(block.rightStart, block.rightStart + block.rightCount);
	const pairableLeft = removed.map((_, n) => n).filter((n) => !moves.byLeft.has(block.leftStart + n));
	const pairableRight = added.map((_, n) => n).filter((n) => !moves.byRight.has(block.rightStart + n));
	const pairs = pairChangedLines(
		pairableLeft.map((n) => removed[n]),
		pairableRight.map((n) => added[n]),
		options
	).map(([ri, ai]): [number, number] => [pairableLeft[ri], pairableRight[ai]]);
	const inline = new Map<string, InlineDiff>();
	for (const [ri, ai] of pairs) inline.set(`${ri}:${ai}`, diffInline(removed[ri], added[ai], granularity, options));
	return { removed, added, pairs, inline };
}

export function buildUnifiedRows(diff: LineDiff, rowOptions: RowOptions = {}): UnifiedRow[] {
	const moves = rowOptions.moves ?? NO_MOVES;
	const rows: UnifiedRow[] = [];
	let changeIndex = 0;
	for (const block of diff.blocks) {
		if (block.type === "equal") {
			for (let n = 0; n < block.count; n++) {
				rows.push({
					type: "equal",
					leftNum: block.leftStart + n + 1,
					rightNum: block.rightStart + n + 1,
					text: diff.right[block.rightStart + n],
					segments: null,
					move: null,
					changeIndex: -1,
				});
			}
			continue;
		}

		const { removed, added, pairs, inline } = layoutChange(diff, block, rowOptions);
		const leftSegs = new Map<number, InlineSegment[]>();
		const rightSegs = new Map<number, InlineSegment[]>();
		for (const [ri, ai] of pairs) {
			const d = inline.get(`${ri}:${ai}`)!;
			leftSegs.set(ri, d.left);
			rightSegs.set(ai, d.right);
		}
		removed.forEach((text, n) =>
			rows.push({
				type: "removed",
				leftNum: block.leftStart + n + 1,
				rightNum: null,
				text,
				segments: leftSegs.get(n) ?? moveSegments(diff, "left", block.leftStart + n, rowOptions),
				move: moveAt(moves, "left", block.leftStart + n),
				changeIndex,
			})
		);
		added.forEach((text, n) =>
			rows.push({
				type: "added",
				leftNum: null,
				rightNum: block.rightStart + n + 1,
				text,
				segments: rightSegs.get(n) ?? moveSegments(diff, "right", block.rightStart + n, rowOptions),
				move: moveAt(moves, "right", block.rightStart + n),
				changeIndex,
			})
		);
		changeIndex++;
	}
	return rows;
}

export function buildSplitRows(diff: LineDiff, rowOptions: RowOptions = {}): SplitRow[] {
	const moves = rowOptions.moves ?? NO_MOVES;
	const rows: SplitRow[] = [];
	let changeIndex = 0;
	for (const block of diff.blocks) {
		if (block.type === "equal") {
			for (let n = 0; n < block.count; n++) {
				rows.push({
					type: "equal",
					left: { num: block.leftStart + n + 1, text: diff.left[block.leftStart + n], segments: null, move: null },
					right: { num: block.rightStart + n + 1, text: diff.right[block.rightStart + n], segments: null, move: null },
					changeIndex: -1,
				});
			}
			continue;
		}

		const { removed, added, pairs, inline } = layoutChange(diff, block, rowOptions);
		const leftCell = (n: number, segments: InlineSegment[] | null = null): DiffCell => ({
			num: block.leftStart + n + 1,
			text: removed[n],
			segments: segments ?? moveSegments(diff, "left", block.leftStart + n, rowOptions),
			move: moveAt(moves, "left", block.leftStart + n),
		});
		const rightCell = (n: number, segments: InlineSegment[] | null = null): DiffCell => ({
			num: block.rightStart + n + 1,
			text: added[n],
			segments: segments ?? moveSegments(diff, "right", block.rightStart + n, rowOptions),
			move: moveAt(moves, "right", block.rightStart + n),
		});

		// Unpaired lines sit side by side (without highlights) to keep the block compact.
		let rPtr = 0;
		let aPtr = 0;
		const zipUntil = (rEnd: number, aEnd: number) => {
			while (rPtr < rEnd || aPtr < aEnd) {
				rows.push({
					type: "change",
					left: rPtr < rEnd ? leftCell(rPtr++) : null,
					right: aPtr < aEnd ? rightCell(aPtr++) : null,
					changeIndex,
				});
			}
		};
		for (const [ri, ai] of pairs) {
			zipUntil(ri, ai);
			const d = inline.get(`${ri}:${ai}`)!;
			rows.push({ type: "change", left: leftCell(ri, d.left), right: rightCell(ai, d.right), changeIndex });
			rPtr = ri + 1;
			aPtr = ai + 1;
		}
		zipUntil(removed.length, added.length);
		changeIndex++;
	}
	return rows;
}

// ---------------------------------------------------------------------------
// Collapsing and patches
// ---------------------------------------------------------------------------

export function formatHunkHeader(leftStart: number, leftCount: number, rightStart: number, rightCount: number): string {
	// Unified diff convention: an empty range starts at the line before it.
	const range = (start: number, count: number) => `${count === 0 ? start - 1 : start},${count}`;
	return `@@ -${range(leftStart, leftCount)} +${range(rightStart, rightCount)} @@`;
}

/**
 * Replace long runs of unchanged rows with gap markers, keeping `context`
 * rows around every change. Each gap carries the hunk header of the rows
 * that follow it, when `lineNums` is provided. Runs shorter than
 * `minHidden` stay visible, since an expander would save nothing.
 */
export function collapseUnchanged<T>(
	rows: T[],
	isUnchanged: (row: T) => boolean,
	context: number,
	lineNums?: (row: T) => { left: number | null; right: number | null },
	minHidden = MIN_COLLAPSED_LINES
): CollapsedItem<T>[] {
	const hidden = new Array<boolean>(rows.length).fill(false);
	let i = 0;
	while (i < rows.length) {
		if (!isUnchanged(rows[i])) {
			i++;
			continue;
		}
		const start = i;
		while (i < rows.length && isUnchanged(rows[i])) i++;
		const hideFrom = start === 0 ? 0 : start + context;
		const hideTo = i === rows.length ? rows.length : i - context;
		if (hideTo - hideFrom >= minHidden) hidden.fill(true, hideFrom, hideTo);
	}

	const items: CollapsedItem<T>[] = [];
	i = 0;
	while (i < rows.length) {
		if (!hidden[i]) {
			items.push({ type: "row", row: rows[i], index: i });
			i++;
			continue;
		}
		const start = i;
		while (i < rows.length && hidden[i]) i++;
		items.push({ type: "gap", start, end: i, header: null });
	}

	if (lineNums) {
		for (let n = 0; n < items.length; n++) {
			const item = items[n];
			if (item.type !== "gap") continue;
			const following: T[] = [];
			for (let m = n + 1; m < items.length; m++) {
				const next = items[m];
				if (next.type === "gap") break;
				following.push(next.row);
			}
			item.header = following.length ? hunkHeaderFor(following, lineNums) : null;
		}
	}
	return items;
}

function hunkHeaderFor<T>(rows: T[], lineNums: (row: T) => { left: number | null; right: number | null }): string {
	let leftStart = 0;
	let rightStart = 0;
	let leftCount = 0;
	let rightCount = 0;
	for (const row of rows) {
		const { left, right } = lineNums(row);
		if (left !== null) {
			if (!leftCount) leftStart = left;
			leftCount++;
		}
		if (right !== null) {
			if (!rightCount) rightStart = right;
			rightCount++;
		}
	}
	return formatHunkHeader(leftStart || 1, leftCount, rightStart || 1, rightCount);
}

/**
 * Standard unified diff (as produced by `diff -u` / `git diff`).
 * Pass `context: Infinity` for a single hunk covering both files.
 */
export function toUnifiedPatch(
	diff: LineDiff,
	context = 3,
	names: { left: string; right: string } = { left: "original", right: "modified" }
): string {
	if (diff.stats.changes === 0) return "";
	const rows = buildUnifiedRows(diff);
	const items = collapseUnchanged(rows, (r) => r.type === "equal", context, undefined, 1);

	const out = [`--- ${names.left}`, `+++ ${names.right}`];
	let hunk: UnifiedRow[] = [];
	const flush = () => {
		if (!hunk.length) return;
		const leftRows = hunk.filter((r) => r.leftNum !== null);
		const rightRows = hunk.filter((r) => r.rightNum !== null);
		// For an empty side, the start is the line just before the hunk position.
		const emptyStart = (side: "left" | "right") => {
			const idx = rows.indexOf(hunk[0]);
			for (let n = idx - 1; n >= 0; n--) {
				const num = side === "left" ? rows[n].leftNum : rows[n].rightNum;
				if (num !== null) return num + 1;
			}
			return 1;
		};
		out.push(
			formatHunkHeader(
				leftRows[0]?.leftNum ?? emptyStart("left"),
				leftRows.length,
				rightRows[0]?.rightNum ?? emptyStart("right"),
				rightRows.length
			)
		);
		for (const r of hunk) {
			const prefix = r.type === "added" ? "+" : r.type === "removed" ? "-" : " ";
			out.push(prefix + (r.type === "removed" ? diff.left[r.leftNum! - 1] : r.text));
		}
		hunk = [];
	};

	for (const item of items) {
		if (item.type === "gap") flush();
		else hunk.push(item.row);
	}
	flush();
	return out.join("\n") + "\n";
}
