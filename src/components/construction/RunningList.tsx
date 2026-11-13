"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardDocumentIcon, CheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";
import type { MarkReference } from "@/lib/construction/spacingUtils";
import styles from "./RunningList.module.scss";

export interface RunningListProps {
	title: string;
	/** Cumulative positions from the start, in inches */
	positions: number[];
	reference?: MarkReference;
	onReferenceChange?: (ref: MarkReference) => void;
	/** Optional label for each row (member name, tread number, …) */
	labelFor?: (index: number) => string;
	className?: string;
}

const REFERENCE_OPTIONS: { value: MarkReference; label: string }[] = [
	{ value: "near", label: "Near" },
	{ value: "center", label: "Center" },
	{ value: "far", label: "Far" },
];

const ORDINALS = ["2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

/**
 * Running measurements for marking out on site: every position measured from the same start point,
 * each rounded on its own so the list never drifts. Includes a large-text step-through mode.
 */
export default function RunningList({ title, positions, reference, onReferenceChange, labelFor, className = "" }: RunningListProps) {
	const { format } = useConstructionUnits();
	const { copy, isCopied } = useClipboard();
	const [every, setEvery] = useState(0);
	const [onlyHighlighted, setOnlyHighlighted] = useState(false);
	const [markOut, setMarkOut] = useState<number | null>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	const rows = positions.map((p, i) => ({
		index: i + 1,
		label: labelFor?.(i) ?? "",
		text: format(p),
		highlight: every > 0 && (i + 1) % every === 0,
	}));
	const visible = onlyHighlighted && every > 0 ? rows.filter((r) => r.highlight) : rows;

	useEffect(() => {
		if (markOut !== null) dialogRef.current?.focus();
	}, [markOut]);

	const copyAll = () => copy(visible.map((r) => [r.index, r.label, r.text].filter(Boolean).join("\t")).join("\n"));

	const current = markOut === null ? null : visible[markOut];

	return (
		<section className={`${styles.wrap} ${className}`} aria-label={`${title} mark-out`}>
			<div className={styles.toolbar}>
				<h3 className={styles.title}>{title}</h3>
				<div className={styles.controls}>
					{onReferenceChange && reference && (
						<SegmentedControl<MarkReference> label="Reference" size="sm" fill={false} value={reference} onChange={onReferenceChange} options={REFERENCE_OPTIONS} />
					)}
					<label className={styles.control}>
						<span>Highlight every</span>
						<select className={styles.select} value={every} onChange={(e) => setEvery(Number(e.target.value))}>
							<option value={0}>None</option>
							{ORDINALS.map((o, i) => (
								<option key={o} value={i + 2}>
									{o}
								</option>
							))}
						</select>
					</label>
					<label className={`${styles.control} ${every === 0 ? styles.disabled : ""}`}>
						<input type="checkbox" checked={onlyHighlighted} disabled={every === 0} onChange={(e) => setOnlyHighlighted(e.target.checked)} />
						<span>Only highlighted</span>
					</label>
					<button type="button" className={styles.btn} onClick={copyAll} disabled={visible.length === 0}>
						{isCopied() ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
						{isCopied() ? "Copied" : "Copy"}
					</button>
					<button type="button" className={styles.btn} onClick={() => setMarkOut(0)} disabled={visible.length === 0}>
						Mark-out
					</button>
				</div>
			</div>

			<div className={styles.tableWrap}>
				<table className={styles.table} aria-label={title}>
					<thead>
						<tr>
							<th scope="col">#</th>
							{labelFor && <th scope="col">Mark</th>}
							<th scope="col">Position</th>
						</tr>
					</thead>
					<tbody>
						{visible.map((r) => (
							<tr key={r.index} className={r.highlight ? styles.highlight : undefined}>
								<td className={styles.num}>{r.index}</td>
								{labelFor && <td>{r.label}</td>}
								<td className={styles.pos}>{r.text}</td>
							</tr>
						))}
					</tbody>
				</table>
				{visible.length === 0 && <p className={styles.empty}>Nothing to mark out yet.</p>}
			</div>

			{current && markOut !== null && (
				<div
					ref={dialogRef}
					role="dialog"
					aria-modal="true"
					aria-label={`${title} mark-out`}
					tabIndex={-1}
					className={styles.markOut}
					onKeyDown={(e) => {
						if (e.key === "Escape") setMarkOut(null);
						if (e.key === "ArrowRight") setMarkOut(Math.min(markOut + 1, visible.length - 1));
						if (e.key === "ArrowLeft") setMarkOut(Math.max(markOut - 1, 0));
					}}
				>
					<button type="button" className={styles.close} onClick={() => setMarkOut(null)} aria-label="Close mark-out">
						<XMarkIcon className="w-6 h-6" />
					</button>
					<div className={styles.markOutCount}>
						{title} · {current.index} of {rows.length}
						{current.label && ` · ${current.label}`}
					</div>
					<div className={styles.markOutValue}>{current.text}</div>
					<div className={styles.markOutNav}>
						<button type="button" className={styles.navBtn} onClick={() => setMarkOut(Math.max(markOut - 1, 0))} disabled={markOut === 0}>
							<ChevronLeftIcon className="w-5 h-5" />
							Prev
						</button>
						<button
							type="button"
							className={styles.navBtn}
							onClick={() => setMarkOut(Math.min(markOut + 1, visible.length - 1))}
							disabled={markOut >= visible.length - 1}
						>
							Next
							<ChevronRightIcon className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}
		</section>
	);
}
