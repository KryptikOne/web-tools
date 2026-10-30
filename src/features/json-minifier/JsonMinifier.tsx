"use client";

import { useState, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import { formatBytes } from "@/lib/formatUtils";
import styles from "./JsonMinifier.module.scss";

function byteSize(text: string): number {
	return new TextEncoder().encode(text).length;
}

export default function JsonMinifier() {
	const [input, setInput] = useState("");
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) {
			return { output: "", error: null as string | null, before: 0, after: 0 };
		}
		try {
			const parsed = JSON.parse(input);
			const output = JSON.stringify(parsed);
			return {
				output,
				error: null,
				before: byteSize(input),
				after: byteSize(output),
			};
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Invalid JSON",
				before: byteSize(input),
				after: 0,
			};
		}
	}, [input]);

	const savedPercent = result.before > 0 && result.after > 0
		? Math.max(0, ((result.before - result.after) / result.before) * 100)
		: 0;

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>JSON input</h3>
					<button
						type="button"
						onClick={() => setInput("")}
						className={styles.btnSecondary}
						disabled={!input}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
				<label htmlFor="json-min-input" className="sr-only">JSON to minify</label>
				<textarea
					id="json-min-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Paste JSON to minify..."
					className={styles.textarea}
					spellCheck={false}
				/>
				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{input.length} characters · {formatBytes(result.before)}</span>
				</div>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Minified output
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							All whitespace removed while preserving semantics.
						</p>
					</div>
					<button
						type="button"
						onClick={() => copy(result.output, "min")}
						className={`${styles.btnPrimary} ${isCopied("min") ? styles.copied : ""}`}
						disabled={!result.output}
					>
						{isCopied("min") ? (
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
				<label htmlFor="json-min-output" className="sr-only">Minified JSON</label>
				<textarea
					id="json-min-output"
					value={result.output}
					readOnly
					placeholder="Minified JSON will appear here"
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
				{result.output && (
					<div className={`grid grid-cols-3 gap-3 mt-4 ${styles.statGrid}`}>
						<div className={styles.statCard}>
							<div className={styles.statLabel}>Before</div>
							<div className={styles.statValue}>{formatBytes(result.before)}</div>
						</div>
						<div className={styles.statCard}>
							<div className={styles.statLabel}>After</div>
							<div className={styles.statValue}>{formatBytes(result.after)}</div>
						</div>
						<div className={styles.statCard}>
							<div className={styles.statLabel}>Saved</div>
							<div className={styles.statValue}>{savedPercent.toFixed(1)}%</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
