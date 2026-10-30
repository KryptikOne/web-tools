"use client";

import { useState, useMemo } from "react";
import diff, { type Difference } from "microdiff";
import { TrashIcon } from "@heroicons/react/24/outline";
import styles from "./JsonDiff.module.scss";

function safeParse(text: string): { value: unknown; error: string | null } {
	const trimmed = text.trim();
	if (!trimmed) return { value: undefined, error: null };
	try {
		return { value: JSON.parse(trimmed), error: null };
	} catch (err) {
		return { value: undefined, error: err instanceof Error ? err.message : "Invalid JSON" };
	}
}

function pathToString(path: (string | number)[]): string {
	if (path.length === 0) return "(root)";
	return path
		.map((seg, i) => {
			if (typeof seg === "number") return `[${seg}]`;
			return i === 0 ? seg : `.${seg}`;
		})
		.join("");
}

function formatValue(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

export default function JsonDiff() {
	const [left, setLeft] = useState("");
	const [right, setRight] = useState("");

	const result = useMemo(() => {
		const a = safeParse(left);
		const b = safeParse(right);
		if (a.error) return { error: `Left JSON: ${a.error}`, diffs: [] as Difference[] };
		if (b.error) return { error: `Right JSON: ${b.error}`, diffs: [] as Difference[] };
		if (a.value === undefined || b.value === undefined) {
			return { error: null, diffs: [] as Difference[] };
		}

		// microdiff requires object/array at the root
		const aRoot = a.value;
		const bRoot = b.value;
		const aIsObj = aRoot !== null && typeof aRoot === "object";
		const bIsObj = bRoot !== null && typeof bRoot === "object";
		if (!aIsObj || !bIsObj) {
			if (aRoot === bRoot) return { error: null, diffs: [] };
			return {
				error: null,
				diffs: [
					{
						type: "CHANGE",
						path: [],
						value: bRoot,
						oldValue: aRoot,
					} as Difference,
				],
			};
		}

		try {
			const diffs = diff(
				aRoot as Record<string, unknown>,
				bRoot as Record<string, unknown>
			);
			return { error: null, diffs };
		} catch (err) {
			return {
				error: err instanceof Error ? err.message : "Diff error",
				diffs: [] as Difference[],
			};
		}
	}, [left, right]);

	const groups = useMemo(() => {
		const created = result.diffs.filter((d) => d.type === "CREATE");
		const removed = result.diffs.filter((d) => d.type === "REMOVE");
		const changed = result.diffs.filter((d) => d.type === "CHANGE");
		return { created, removed, changed };
	}, [result.diffs]);

	return (
		<div className={styles.container}>
			<div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${styles.inputGrid}`}>
				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-3 flex-wrap gap-2">
						<h3 className={`text-base font-semibold m-0 ${styles.cardTitle}`}>JSON A (original)</h3>
						<button
							type="button"
							onClick={() => setLeft("")}
							className={styles.btnSecondary}
							disabled={!left}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
					<label htmlFor="json-diff-left" className="sr-only">Original JSON</label>
					<textarea
						id="json-diff-left"
						value={left}
						onChange={(e) => setLeft(e.target.value)}
						placeholder='{"a": 1}'
						className={styles.textarea}
						spellCheck={false}
					/>
				</div>

				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-3 flex-wrap gap-2">
						<h3 className={`text-base font-semibold m-0 ${styles.cardTitle}`}>JSON B (modified)</h3>
						<button
							type="button"
							onClick={() => setRight("")}
							className={styles.btnSecondary}
							disabled={!right}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
					<label htmlFor="json-diff-right" className="sr-only">Modified JSON</label>
					<textarea
						id="json-diff-right"
						value={right}
						onChange={(e) => setRight(e.target.value)}
						placeholder='{"a": 2}'
						className={styles.textarea}
						spellCheck={false}
					/>
				</div>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex items-center justify-between mb-4 flex-wrap gap-3">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Diff</h3>
					<div className="flex gap-2 flex-wrap text-xs">
						<span className={`${styles.badge} ${styles.badgeAdd}`}>
							+ {groups.created.length} added
						</span>
						<span className={`${styles.badge} ${styles.badgeRemove}`}>
							- {groups.removed.length} removed
						</span>
						<span className={`${styles.badge} ${styles.badgeChange}`}>
							~ {groups.changed.length} changed
						</span>
					</div>
				</div>

				{!result.error && result.diffs.length === 0 && (left.trim() || right.trim()) && (
					<p className={styles.muted}>No structural differences.</p>
				)}

				{groups.created.length > 0 && (
					<div className={styles.section}>
						<h4 className={`${styles.sectionTitle} ${styles.sectionAdd}`}>CREATE</h4>
						{groups.created.map((d, i) => (
							<div key={`c-${i}`} className={`${styles.diffRow} ${styles.add}`}>
								<div className={styles.diffPath}>{pathToString(d.path)}</div>
								<pre className={styles.diffValue}>{formatValue("value" in d ? d.value : null)}</pre>
							</div>
						))}
					</div>
				)}

				{groups.removed.length > 0 && (
					<div className={styles.section}>
						<h4 className={`${styles.sectionTitle} ${styles.sectionRemove}`}>REMOVE</h4>
						{groups.removed.map((d, i) => (
							<div key={`r-${i}`} className={`${styles.diffRow} ${styles.remove}`}>
								<div className={styles.diffPath}>{pathToString(d.path)}</div>
								<pre className={styles.diffValue}>{formatValue("oldValue" in d ? d.oldValue : null)}</pre>
							</div>
						))}
					</div>
				)}

				{groups.changed.length > 0 && (
					<div className={styles.section}>
						<h4 className={`${styles.sectionTitle} ${styles.sectionChange}`}>CHANGE</h4>
						{groups.changed.map((d, i) => (
							<div key={`u-${i}`} className={`${styles.diffRow} ${styles.change}`}>
								<div className={styles.diffPath}>{pathToString(d.path)}</div>
								<div className={styles.changeBody}>
									<div>
										<div className={styles.changeLabel}>before</div>
										<pre className={styles.diffValue}>
											{formatValue("oldValue" in d ? d.oldValue : null)}
										</pre>
									</div>
									<div>
										<div className={styles.changeLabel}>after</div>
										<pre className={styles.diffValue}>
											{formatValue("value" in d ? d.value : null)}
										</pre>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
