"use client";

import { useState, useCallback, useMemo, useDeferredValue, useRef, type DragEvent } from "react";
import {
	ArrowsRightLeftIcon,
	TrashIcon,
	DocumentArrowUpIcon,
	CheckCircleIcon,
	BeakerIcon,
} from "@heroicons/react/24/outline";
import { useIsMobile } from "@/hooks/useIsMobile";
import { diffLines, splitLines, type DiffOptions } from "@/lib/diffUtils";
import DiffResults, { type ViewMode } from "./DiffResults";
import { SAMPLE_MODIFIED, SAMPLE_NAMES, SAMPLE_ORIGINAL } from "./sampleText";
import styles from "./DiffChecker.module.scss";

const DEFAULT_NAMES = { left: "original", right: "modified" };

const OPTION_LABELS: Array<[keyof DiffOptions, string]> = [
	["ignoreWhitespace", "Ignore whitespace"],
	["ignoreCase", "Ignore case"],
	["trimLines", "Trim lines"],
];

export default function DiffChecker() {
	const [original, setOriginal] = useState("");
	const [modified, setModified] = useState("");
	const [names, setNames] = useState(DEFAULT_NAMES);
	const [options, setOptions] = useState<DiffOptions>({
		ignoreWhitespace: false,
		ignoreCase: false,
		trimLines: false,
	});
	const isMobile = useIsMobile();
	const [viewChoice, setViewChoice] = useState<ViewMode | null>(null);
	const view: ViewMode = viewChoice ?? (isMobile ? "unified" : "split");

	// Keep typing responsive on large inputs; the diff catches up a frame later.
	const deferredOriginal = useDeferredValue(original);
	const deferredModified = useDeferredValue(modified);
	const diff = useMemo(
		() => diffLines(deferredOriginal, deferredModified, options),
		[deferredOriginal, deferredModified, options]
	);

	const hasInput = Boolean(original || modified);
	const isIdentical = Boolean(original && modified) && diff.stats.changes === 0;
	const activeIgnores = OPTION_LABELS.filter(([key]) => options[key]).map(([, label]) => label.toLowerCase());

	const handleSwap = useCallback(() => {
		setOriginal(modified);
		setModified(original);
		setNames((prev) => ({ left: prev.right, right: prev.left }));
	}, [original, modified]);

	const handleClear = useCallback(() => {
		setOriginal("");
		setModified("");
		setNames(DEFAULT_NAMES);
	}, []);

	const handleSample = useCallback(() => {
		setOriginal(SAMPLE_ORIGINAL);
		setModified(SAMPLE_MODIFIED);
		setNames(SAMPLE_NAMES);
	}, []);

	const toggleOption = useCallback((key: keyof DiffOptions) => {
		setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	return (
		<div className={styles.container}>
			{/* Options Bar */}
			<div className={`flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-6 md:py-4 mb-6 ${styles.optionsBar}`}>
				{OPTION_LABELS.map(([key, label]) => (
					<label
						key={key}
						className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}
					>
						<input
							type="checkbox"
							checked={options[key]}
							onChange={() => toggleOption(key)}
							className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
						/>
						{label}
					</label>
				))}

				<div className="flex flex-wrap items-center gap-2 md:ml-auto">
					<button type="button" onClick={handleSample} className={styles.btnSecondary} title="Load an example that shows every kind of change">
						<BeakerIcon className="w-4 h-4" />
						Sample
					</button>
					<button
						type="button"
						onClick={handleSwap}
						className={styles.btnSecondary}
						title="Swap original and modified"
						disabled={!hasInput}
					>
						<ArrowsRightLeftIcon className="w-4 h-4" />
						Swap
					</button>
					<button type="button" onClick={handleClear} className={styles.btnSecondary} disabled={!hasInput}>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
			</div>

			{/* Input Panels */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
				<InputPane
					title="Original"
					value={original}
					onChange={setOriginal}
					fileName={names.left === DEFAULT_NAMES.left ? null : names.left}
					onFileName={(left) => setNames((prev) => ({ ...prev, left }))}
					placeholder="Paste original text here, or drop a file…"
				/>
				<InputPane
					title="Modified"
					value={modified}
					onChange={setModified}
					fileName={names.right === DEFAULT_NAMES.right ? null : names.right}
					onFileName={(right) => setNames((prev) => ({ ...prev, right }))}
					placeholder="Paste modified text here, or drop a file…"
				/>
			</div>

			{isIdentical && (
				<div className={`flex items-center gap-3 px-6 py-5 ${styles.glassCard}`}>
					<CheckCircleIcon className={`w-6 h-6 shrink-0 ${styles.statAdded}`} />
					<p className="text-sm m-0">
						<span className="font-semibold">No differences.</span>{" "}
						<span className={styles.mutedText}>
							The texts are identical{activeIgnores.length ? ` (${activeIgnores.join(", ")})` : ""}.
						</span>
					</p>
				</div>
			)}

			{hasInput && !isIdentical && (
				<DiffResults diff={diff} options={options} names={names} view={view} onViewChange={setViewChoice} />
			)}
		</div>
	);
}

interface InputPaneProps {
	title: string;
	value: string;
	onChange: (value: string) => void;
	fileName: string | null;
	onFileName: (name: string) => void;
	placeholder: string;
}

function InputPane({ title, value, onChange, fileName, onFileName, placeholder }: InputPaneProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const loadFile = async (file: File | undefined) => {
		if (!file) return;
		onChange(await file.text());
		onFileName(file.name);
	};

	const handleDrop = (e: DragEvent<HTMLTextAreaElement>) => {
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (!file) return;
		e.preventDefault();
		loadFile(file);
	};

	return (
		<div className={styles.glassCard}>
			<div className="flex items-center gap-3 mb-3">
				<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>{title}</h3>
				{fileName && <span className={`text-xs font-mono truncate ${styles.mutedText}`}>{fileName}</span>}
				<span className={`text-xs ml-auto shrink-0 ${styles.mutedText}`}>{splitLines(value).length} lines</span>
				<button
					type="button"
					className={styles.iconBtn}
					onClick={() => fileInputRef.current?.click()}
					title={`Open a file as ${title.toLowerCase()}`}
					aria-label={`Open file as ${title.toLowerCase()}`}
				>
					<DocumentArrowUpIcon className="w-4 h-4" />
				</button>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					aria-label={`${title} file`}
					onChange={(e) => {
						loadFile(e.target.files?.[0]);
						e.target.value = "";
					}}
				/>
			</div>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onDragOver={(e) => {
					if (e.dataTransfer.types.includes("Files")) {
						e.preventDefault();
						setIsDragging(true);
					}
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				placeholder={placeholder}
				aria-label={`${title} text`}
				className={`${styles.textarea} ${isDragging ? styles.dragging : ""}`}
				spellCheck={false}
			/>
		</div>
	);
}
