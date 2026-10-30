"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ChevronRightIcon,
	ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./JsonPrettifier.module.scss";

type IndentChoice = "2" | "4" | "tab";

function indentString(choice: IndentChoice): string | number {
	if (choice === "tab") return "\t";
	return Number(choice);
}

function sortKeysDeep<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((v) => sortKeysDeep(v)) as unknown as T;
	}
	if (value && typeof value === "object") {
		const obj = value as Record<string, unknown>;
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(obj).sort()) {
			sorted[key] = sortKeysDeep(obj[key]);
		}
		return sorted as unknown as T;
	}
	return value;
}

interface TreeNodeProps {
	name: string | null;
	value: unknown;
	depth: number;
}

function TreeNode({ name, value, depth }: TreeNodeProps) {
	const [open, setOpen] = useState(depth < 2);

	const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
	const isArray = Array.isArray(value);
	const isComplex = isObject || isArray;

	if (!isComplex) {
		const display =
			value === null
				? <span className={styles.tokenNull}>null</span>
				: typeof value === "string"
					? <span className={styles.tokenString}>&quot;{value}&quot;</span>
					: typeof value === "number"
						? <span className={styles.tokenNumber}>{String(value)}</span>
						: typeof value === "boolean"
							? <span className={styles.tokenBool}>{String(value)}</span>
							: <span>{String(value)}</span>;
		return (
			<div className={styles.treeRow}>
				{name !== null && <span className={styles.treeKey}>{name}:</span>}
				{display}
			</div>
		);
	}

	const entries = isArray
		? (value as unknown[]).map((v, i) => [String(i), v] as const)
		: Object.entries(value as Record<string, unknown>);
	const count = entries.length;
	const openBrace = isArray ? "[" : "{";
	const closeBrace = isArray ? "]" : "}";

	return (
		<div className={styles.treeNode}>
			<button
				type="button"
				className={styles.treeToggle}
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-label={open ? "Collapse" : "Expand"}
			>
				{open
					? <ChevronDownIcon className="w-3.5 h-3.5" />
					: <ChevronRightIcon className="w-3.5 h-3.5" />}
				{name !== null && <span className={styles.treeKey}>{name}:</span>}
				<span className={styles.treeBrace}>
					{openBrace}
					{!open && <span className={styles.treeCount}> {count} {isArray ? "items" : "keys"} </span>}
					{!open && closeBrace}
				</span>
			</button>
			{open && (
				<div className={styles.treeChildren}>
					{entries.map(([k, v]) => (
						<TreeNode
							key={k}
							name={isArray ? `[${k}]` : k}
							value={v}
							depth={depth + 1}
						/>
					))}
					<div className={styles.treeBrace}>{closeBrace}</div>
				</div>
			)}
		</div>
	);
}

export default function JsonPrettifier() {
	const [input, setInput] = useState("");
	const [indent, setIndent] = useState<IndentChoice>("2");
	const [sortKeys, setSortKeys] = useState(false);
	const [showTree, setShowTree] = useState(false);
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) return { pretty: "", parsed: undefined as unknown, error: null as string | null };
		try {
			const parsedRaw = JSON.parse(input);
			const parsed = sortKeys ? sortKeysDeep(parsedRaw) : parsedRaw;
			const pretty = JSON.stringify(parsed, null, indentString(indent));
			return { pretty, parsed, error: null };
		} catch (err) {
			return {
				pretty: "",
				parsed: undefined,
				error: err instanceof Error ? err.message : "Invalid JSON",
			};
		}
	}, [input, indent, sortKeys]);

	const handleClear = useCallback(() => setInput(""), []);

	return (
		<div className={styles.container}>
			<div className={`flex flex-wrap gap-6 mb-6 p-4 ${styles.optionsBar}`}>
				<label className={`flex items-center gap-2 text-sm ${styles.checkboxLabel}`}>
					Indent
					<select
						value={indent}
						onChange={(e) => setIndent(e.target.value as IndentChoice)}
						className={styles.select}
						aria-label="Indent size"
					>
						<option value="2">2 spaces</option>
						<option value="4">4 spaces</option>
						<option value="tab">Tab</option>
					</select>
				</label>
				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
					<input
						type="checkbox"
						checked={sortKeys}
						onChange={(e) => setSortKeys(e.target.checked)}
						className={styles.checkbox}
					/>
					Sort keys alphabetically
				</label>
				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
					<input
						type="checkbox"
						checked={showTree}
						onChange={(e) => setShowTree(e.target.checked)}
						className={styles.checkbox}
					/>
					Show tree view
				</label>
			</div>

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>JSON input</h3>
					<button
						type="button"
						onClick={handleClear}
						className={styles.btnSecondary}
						disabled={!input}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
				<label htmlFor="json-pretty-input" className="sr-only">JSON input</label>
				<textarea
					id="json-pretty-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder='{"hello": "world"}'
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						Formatted output
					</h3>
					<button
						type="button"
						onClick={() => copy(result.pretty, "pretty")}
						className={`${styles.btnPrimary} ${isCopied("pretty") ? styles.copied : ""}`}
						disabled={!result.pretty}
					>
						{isCopied("pretty") ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="w-4 h-4" />
								Copy
							</>
						)}
					</button>
				</div>
				<label htmlFor="json-pretty-output" className="sr-only">Formatted JSON</label>
				<textarea
					id="json-pretty-output"
					value={result.pretty}
					readOnly
					placeholder="Formatted JSON will appear here"
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
			</div>

			{showTree && result.parsed !== undefined && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
						Tree view
					</h3>
					<div className={styles.tree}>
						<TreeNode name={null} value={result.parsed} depth={0} />
					</div>
				</div>
			)}
		</div>
	);
}
