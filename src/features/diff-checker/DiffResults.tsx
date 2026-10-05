"use client";

import { useMemo, useRef, useState, useCallback, type CSSProperties } from "react";
import {
	ArrowDownTrayIcon,
	ArrowsUpDownIcon,
	ArrowTurnDownRightIcon,
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import { downloadTextFile } from "@/lib/downloadUtils";
import {
	buildSplitRows,
	buildUnifiedRows,
	collapseUnchanged,
	detectMoves,
	toUnifiedPatch,
	NO_MOVES,
	type DiffCell,
	type DiffOptions,
	type InlineGranularity,
	type InlineSegment,
	type LineDiff,
	type RowMove,
	type SplitRow,
	type UnifiedRow,
} from "@/lib/diffUtils";
import { groupTokensBySegments, SYNTAX_LANGUAGES, type SyntaxKind, type SyntaxToken } from "@/lib/syntaxHighlightUtils";
import { useSyntaxHighlight, type LanguageChoice } from "./useSyntaxHighlight";
import styles from "./DiffChecker.module.scss";

export type ViewMode = "split" | "unified";
type Side = "left" | "right";

const CONTEXT_LINES = 3;
const NO_EXPANDED = new Set<number>();

const VIEW_OPTIONS = [
	{ value: "split" as const, label: "Split" },
	{ value: "unified" as const, label: "Unified" },
];

const GRANULARITY_OPTIONS = [
	{ value: "word" as const, label: "Words", title: "Highlight changed words" },
	{ value: "char" as const, label: "Chars", title: "Highlight changed characters" },
];

const SORTED_LANGUAGES = Object.entries(SYNTAX_LANGUAGES).sort((a, b) => a[1].localeCompare(b[1]));

const SYNTAX_CLASSES: Record<SyntaxKind, string> = {
	keyword: styles.synKeyword,
	entity: styles.synEntity,
	constant: styles.synConstant,
	string: styles.synString,
	builtin: styles.synBuiltin,
	comment: styles.synComment,
	tag: styles.synTag,
	section: styles.synSection,
	bullet: styles.synBullet,
};

/** What every row needs to render code: syntax tokens and move navigation. */
interface RenderContext {
	tokens: Record<Side, SyntaxToken[][] | null>;
	jumpToMove: (index: number, to: Side) => void;
}

interface DiffResultsProps {
	diff: LineDiff;
	options: DiffOptions;
	names: { left: string; right: string };
	view: ViewMode;
	onViewChange: (view: ViewMode) => void;
}

export default function DiffResults({ diff, options, names, view, onViewChange }: DiffResultsProps) {
	const [granularity, setGranularity] = useState<InlineGranularity>("word");
	const [hideUnchanged, setHideUnchanged] = useState(true);
	const [showMoves, setShowMoves] = useState(true);
	const [languageChoice, setLanguageChoice] = useState<LanguageChoice>("auto");
	const { copy, isCopied } = useClipboard();
	const bodyRef = useRef<HTMLDivElement>(null);

	const syntax = useSyntaxHighlight(diff, languageChoice, names);
	const moves = useMemo(() => (showMoves ? detectMoves(diff, options) : NO_MOVES), [diff, options, showMoves]);

	const rows = useMemo<Array<SplitRow | UnifiedRow>>(() => {
		const rowOptions = { granularity, options, moves };
		return view === "split" ? buildSplitRows(diff, rowOptions) : buildUnifiedRows(diff, rowOptions);
	}, [diff, view, granularity, options, moves]);

	// Expanded gaps and the current change belong to one set of rows; a new diff resets them.
	const [expanded, setExpanded] = useState<{ rows: unknown; starts: Set<number> }>({ rows: null, starts: NO_EXPANDED });
	const expandedStarts = expanded.rows === rows ? expanded.starts : NO_EXPANDED;
	const [current, setCurrent] = useState<{ rows: unknown; index: number }>({ rows: null, index: -1 });
	const currentChange = current.rows === rows ? current.index : -1;

	const items = useMemo(() => {
		if (!hideUnchanged) return rows.map((row, index) => ({ type: "row" as const, row, index }));
		return collapseUnchanged(rows, (r) => r.type === "equal", CONTEXT_LINES, lineNumsOf).flatMap((item) =>
			item.type === "gap" && expandedStarts.has(item.start)
				? rows.slice(item.start, item.end).map((row, n) => ({ type: "row" as const, row, index: item.start + n }))
				: [item]
		);
	}, [rows, hideUnchanged, expandedStarts]);

	const expandGap = (start: number) =>
		setExpanded((prev) => ({
			rows,
			starts: new Set(prev.rows === rows ? prev.starts : []).add(start),
		}));

	const patch = useMemo(
		() => toUnifiedPatch(diff, hideUnchanged ? CONTEXT_LINES : Infinity, names),
		[diff, hideUnchanged, names]
	);

	const scrollTo = (selector: string) =>
		bodyRef.current?.querySelector(selector)?.scrollIntoView({ block: "center", behavior: "smooth" });

	const changeCount = diff.stats.changes;
	const goToChange = (step: 1 | -1) => {
		if (!changeCount) return;
		const next =
			currentChange === -1 ? (step === 1 ? 0 : changeCount - 1) : (currentChange + step + changeCount) % changeCount;
		setCurrent({ rows, index: next });
		scrollTo(`[data-change-start="${next}"]`);
	};

	const jumpToMove = useCallback((index: number, to: Side) => {
		bodyRef.current
			?.querySelector(`[data-move-${to}="${index}"]`)
			?.scrollIntoView({ block: "center", behavior: "smooth" });
	}, []);

	const render: RenderContext = useMemo(
		() => ({ tokens: { left: syntax.left, right: syntax.right }, jumpToMove }),
		[syntax.left, syntax.right, jumpToMove]
	);

	const autoLabel = syntax.language ? `Auto (${SYNTAX_LANGUAGES[syntax.language] ?? syntax.language})` : "Auto";
	const numWidth = Math.max(String(diff.left.length).length, String(diff.right.length).length, 2) + 1;
	const changeStarts = new Set<number>();

	return (
		<div className={styles.glassCard}>
			{/* Toolbar */}
			<div className="flex flex-col gap-3 mb-4">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
					<DiffStat
						added={diff.stats.added}
						removed={diff.stats.removed}
						unchanged={diff.stats.unchanged}
						moved={moves.blocks.length}
					/>
					<span className={`text-sm ${styles.mutedText}`}>
						{changeCount} {changeCount === 1 ? "change" : "changes"}
					</span>
					<div className="flex items-center gap-1 ml-auto">
						<span className={`text-sm font-mono mr-1 ${styles.mutedText}`} aria-live="polite">
							{currentChange === -1 ? "" : `${currentChange + 1} / ${changeCount}`}
						</span>
						<button
							type="button"
							className={styles.iconBtn}
							onClick={() => goToChange(-1)}
							aria-label="Previous change"
							title="Previous change"
						>
							<ChevronUpIcon className="w-4 h-4" />
						</button>
						<button
							type="button"
							className={styles.iconBtn}
							onClick={() => goToChange(1)}
							aria-label="Next change"
							title="Next change"
						>
							<ChevronDownIcon className="w-4 h-4" />
						</button>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<SegmentedControl label="Diff layout" options={VIEW_OPTIONS} value={view} onChange={onViewChange} size="sm" fill={false} />
					<SegmentedControl
						label="Highlight changes by"
						options={GRANULARITY_OPTIONS}
						value={granularity}
						onChange={setGranularity}
						size="sm"
						fill={false}
					/>
					<select
						value={languageChoice}
						onChange={(e) => setLanguageChoice(e.target.value)}
						aria-label="Syntax highlighting language"
						title={syntax.tooLarge ? "Input is too large to highlight" : "Syntax highlighting"}
						className={styles.select}
					>
						<option value="auto">{autoLabel}</option>
						<option value="plaintext">Plain text</option>
						{SORTED_LANGUAGES.map(([id, label]) => (
							<option key={id} value={id}>
								{label}
							</option>
						))}
					</select>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={hideUnchanged}
							onChange={(e) => setHideUnchanged(e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Hide unchanged
					</label>
					<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={showMoves}
							onChange={(e) => setShowMoves(e.target.checked)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						Detect moves
					</label>
					<div className="flex items-center gap-2 ml-auto">
						<button
							type="button"
							onClick={() => copy(patch, "patch")}
							className={`${styles.btnSecondary} ${isCopied("patch") ? styles.copied : ""}`}
							title="Copy as a unified diff (patch)"
						>
							{isCopied("patch") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
							{isCopied("patch") ? "Copied!" : "Copy patch"}
						</button>
						<button
							type="button"
							onClick={() => downloadTextFile(`${patchBaseName(names.right)}.diff`, patch, "text/x-diff")}
							className={styles.btnSecondary}
							title="Download as a .diff file"
						>
							<ArrowDownTrayIcon className="w-4 h-4" />
							.diff
						</button>
					</div>
				</div>
			</div>

			{/* Diff body */}
			<div
				ref={bodyRef}
				className={`${styles.diffBody} ${view === "split" ? styles.splitView : styles.unifiedView}`}
				style={{ "--num-width": `${numWidth}ch` } as CSSProperties}
				role="region"
				aria-label="Diff output"
				tabIndex={0}
			>
				{view === "split" && (
					<div className={`${styles.splitRow} ${styles.fileHeader}`}>
						<div className={styles.fileName}>{names.left}</div>
						<div className={styles.fileName}>{names.right}</div>
					</div>
				)}
				{items.map((item) => {
					if (item.type === "gap") {
						return (
							<button
								key={`gap-${item.start}`}
								type="button"
								className={styles.gapRow}
								onClick={() => expandGap(item.start)}
							>
								<ArrowsUpDownIcon className="w-4 h-4 shrink-0" />
								<span>
									Show {item.end - item.start} unchanged {item.end - item.start === 1 ? "line" : "lines"}
								</span>
								{item.header && <span className={styles.hunkHeader}>{item.header}</span>}
							</button>
						);
					}
					const { row, index } = item;
					const isStart = row.changeIndex !== -1 && !changeStarts.has(row.changeIndex);
					if (isStart) changeStarts.add(row.changeIndex);
					const rowProps = {
						changeStart: isStart ? row.changeIndex : undefined,
						isCurrent: row.changeIndex !== -1 && row.changeIndex === currentChange,
						render,
					};
					return "left" in row ? (
						<SplitDiffRow key={index} {...rowProps} row={row} />
					) : (
						<UnifiedDiffRow key={index} {...rowProps} row={row} />
					);
				})}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

interface RowProps<T> {
	row: T;
	isCurrent: boolean;
	changeStart: number | undefined;
	render: RenderContext;
}

/** data-* attributes used to scroll to a change or to the other end of a move. */
function anchorProps(side: Side, move: RowMove | null) {
	return move?.isStart ? { [`data-move-${side}`]: move.index } : {};
}

function SplitDiffRow({ row, isCurrent, changeStart, render }: RowProps<SplitRow>) {
	const sideClass = (cell: DiffCell | null, changed: string) => {
		if (row.type === "equal") return styles.equal;
		if (!cell) return styles.empty;
		return cell.move ? styles.moved : changed;
	};
	return (
		<div className={`${styles.splitRow} ${isCurrent ? styles.current : ""}`} data-change-start={changeStart}>
			<div className={`${styles.side} ${sideClass(row.left, styles.removed)}`} {...anchorProps("left", row.left?.move ?? null)}>
				<DiffSide side="left" cell={row.left} sign={row.type === "change" ? "-" : " "} render={render} />
			</div>
			<div className={`${styles.side} ${sideClass(row.right, styles.added)}`} {...anchorProps("right", row.right?.move ?? null)}>
				<DiffSide side="right" cell={row.right} sign={row.type === "change" ? "+" : " "} render={render} />
			</div>
		</div>
	);
}

function DiffSide({ side, cell, sign, render }: { side: Side; cell: DiffCell | null; sign: string; render: RenderContext }) {
	if (!cell) {
		return (
			<>
				<span className={styles.num} />
				<span className={styles.sign} />
				<span className={styles.code} />
			</>
		);
	}
	return (
		<>
			<span className={styles.num}>{cell.num}</span>
			<span className={styles.sign}>{sign}</span>
			<CodeLine
				text={cell.text}
				segments={cell.segments}
				tokens={render.tokens[side]?.[cell.num - 1] ?? null}
				highlightClass={side === "left" ? styles.hlRemoved : styles.hlAdded}
				move={cell.move}
				moveDirection={side === "left" ? "to" : "from"}
				onJumpToMove={(index) => render.jumpToMove(index, side === "left" ? "right" : "left")}
			/>
		</>
	);
}

function UnifiedDiffRow({ row, isCurrent, changeStart, render }: RowProps<UnifiedRow>) {
	const side: Side = row.type === "removed" ? "left" : "right";
	const typeClass = row.move
		? styles.moved
		: row.type === "added"
			? styles.added
			: row.type === "removed"
				? styles.removed
				: styles.equal;
	const sign = row.type === "added" ? "+" : row.type === "removed" ? "-" : " ";
	const lineNum = side === "left" ? row.leftNum : row.rightNum;
	return (
		<div
			className={`${styles.unifiedRow} ${typeClass} ${isCurrent ? styles.current : ""}`}
			data-change-start={changeStart}
			{...anchorProps(side, row.move)}
		>
			<span className={styles.num}>{row.leftNum ?? ""}</span>
			<span className={styles.num}>{row.rightNum ?? ""}</span>
			<span className={styles.sign}>{sign}</span>
			<CodeLine
				text={row.text}
				segments={row.segments}
				tokens={lineNum ? render.tokens[side]?.[lineNum - 1] ?? null : null}
				highlightClass={row.type === "added" ? styles.hlAdded : styles.hlRemoved}
				move={row.move}
				moveDirection={row.type === "removed" ? "to" : "from"}
				onJumpToMove={(index) => render.jumpToMove(index, side === "left" ? "right" : "left")}
			/>
		</div>
	);
}

interface CodeLineProps {
	text: string;
	segments: InlineSegment[] | null;
	tokens: SyntaxToken[] | null;
	highlightClass: string;
	move: RowMove | null;
	moveDirection: "to" | "from";
	onJumpToMove: (index: number) => void;
}

/** One line of code: syntax colours nested inside changed-text highlights, plus a move link. */
function CodeLine({ text, segments, tokens, highlightClass, move, moveDirection, onJumpToMove }: CodeLineProps) {
	const groups = groupTokensBySegments(text, tokens, segments);
	return (
		<span className={styles.code}>
			{move?.isStart && (
				<button type="button" className={styles.moveTag} onClick={() => onJumpToMove(move.index)}>
					<ArrowTurnDownRightIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
					moved {moveDirection} line {move.counterpart}
					{move.edited && " with edits"}
				</button>
			)}
			{text === ""
				? " "
				: groups.map((group, g) => {
						const content = group.tokens.map((token, t) =>
							token.kind ? (
								<span key={t} className={SYNTAX_CLASSES[token.kind]}>
									{token.text}
								</span>
							) : (
								token.text
							)
						);
						return group.changed ? (
							<span key={g} className={highlightClass}>
								{content}
							</span>
						) : (
							<span key={g}>{content}</span>
						);
					})}
		</span>
	);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** GitHub-style diffstat: counts plus five proportional blocks. */
function DiffStat({ added, removed, unchanged, moved }: { added: number; removed: number; unchanged: number; moved: number }) {
	const total = added + removed + unchanged || 1;
	const addBlocks = Math.round((added / total) * 5);
	const delBlocks = Math.min(5 - addBlocks, Math.round((removed / total) * 5));
	const blocks = [
		...Array(addBlocks).fill(styles.blockAdded),
		...Array(delBlocks).fill(styles.blockRemoved),
		...Array(5 - addBlocks - delBlocks).fill(styles.blockNeutral),
	];
	return (
		<div className="flex items-center gap-3 text-sm font-mono">
			<span className={styles.statAdded}>+{added}</span>
			<span className={styles.statRemoved}>−{removed}</span>
			{moved > 0 && <span className={styles.statMoved}>{moved} moved</span>}
			<span className="flex gap-0.5" aria-hidden="true">
				{blocks.map((cls, i) => (
					<span key={i} className={`${styles.statBlock} ${cls}`} />
				))}
			</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lineNumsOf(row: SplitRow | UnifiedRow) {
	if ("left" in row) return { left: row.left?.num ?? null, right: row.right?.num ?? null };
	return { left: row.leftNum, right: row.rightNum };
}

function patchBaseName(name: string): string {
	return name.replace(/\.[^.]+$/, "") || "changes";
}
