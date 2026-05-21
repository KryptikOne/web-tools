"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	PlusIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import styles from "./SlugifyString.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type SeparatorPreset = "-" | "_" | "custom";

interface Replacement {
	id: number;
	from: string;
	to: string;
}

interface SlugifyOptions {
	separator: string;
	lowercase: boolean;
	stripAccents: boolean;
	maxLength: number;
	replacements: Replacement[];
}

function applyReplacements(text: string, replacements: Replacement[]): string {
	let out = text;
	for (const r of replacements) {
		if (!r.from) continue;
		// Plain string replacement, escape regex chars.
		const escaped = r.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		out = out.replace(new RegExp(escaped, "g"), r.to);
	}
	return out;
}

function slugify(text: string, opts: SlugifyOptions): string {
	let s = text;

	s = applyReplacements(s, opts.replacements);

	if (opts.stripAccents) {
		// NFKD splits accented chars into base + combining marks; strip the marks.
		s = s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
	}

	if (opts.lowercase) s = s.toLowerCase();

	const sep = opts.separator;
	const sepEscaped = sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// Non-alphanumeric becomes separator.
	s = s.replace(/[^a-zA-Z0-9]+/g, sep);

	// Collapse repeats and trim.
	if (sep) {
		s = s.replace(new RegExp(`${sepEscaped}+`, "g"), sep);
		s = s.replace(new RegExp(`^${sepEscaped}|${sepEscaped}$`, "g"), "");
	}

	if (opts.maxLength > 0 && s.length > opts.maxLength) {
		s = s.slice(0, opts.maxLength);
		if (sep) {
			s = s.replace(new RegExp(`${sepEscaped}$`), "");
		}
	}

	return s;
}

export default function SlugifyString() {
	const [input, setInput] = useState(
		"Héllo World! This is a Test — Slugify Me, please."
	);
	const [separatorPreset, setSeparatorPreset] = useState<SeparatorPreset>("-");
	const [customSeparator, setCustomSeparator] = useState("-");
	const [lowercase, setLowercase] = useState(true);
	const [stripAccents, setStripAccents] = useState(true);
	const [maxLength, setMaxLength] = useState(0);
	const [replacements, setReplacements] = useState<Replacement[]>([]);
	const [nextId, setNextId] = useState(0);

	const { copy, isCopied } = useClipboard();

	const separator =
		separatorPreset === "custom" ? customSeparator : separatorPreset;

	const result = useMemo(
		() =>
			slugify(input, {
				separator,
				lowercase,
				stripAccents,
				maxLength,
				replacements,
			}),
		[input, separator, lowercase, stripAccents, maxLength, replacements]
	);

	const addReplacement = () => {
		setReplacements((prev) => [...prev, { id: nextId, from: "", to: "" }]);
		setNextId((n) => n + 1);
	};

	const updateReplacement = (id: number, patch: Partial<Replacement>) => {
		setReplacements((prev) =>
			prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
		);
	};

	const removeReplacement = (id: number) => {
		setReplacements((prev) => prev.filter((r) => r.id !== id));
	};

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between mb-4 flex-wrap gap-3">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Input</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Type or paste text to convert into a URL-safe slug.
						</p>
					</div>
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
				<label htmlFor="slug-input" className="sr-only">Text to slugify</label>
				<textarea
					id="slug-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					className={styles.textarea}
					placeholder="Enter text..."
					spellCheck={false}
				/>
			</div>

			<div className={`mt-4 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Options</h3>

				<div className={styles.optGrid}>
					<div className={styles.field}>
						<span className={styles.label}>Separator</span>
						<div className={styles.segmented} role="radiogroup" aria-label="Separator">
							{(["-", "_", "custom"] as SeparatorPreset[]).map((opt) => (
								<button
									key={opt}
									type="button"
									role="radio"
									aria-checked={separatorPreset === opt}
									onClick={() => setSeparatorPreset(opt)}
									className={`${styles.segBtn} ${separatorPreset === opt ? styles.segActive : ""}`}
								>
									{opt === "-" ? "Dash (-)" : opt === "_" ? "Underscore (_)" : "Custom"}
								</button>
							))}
						</div>
					</div>

					{separatorPreset === "custom" && (
						<div className={styles.field}>
							<label htmlFor="slug-custom-sep" className={styles.label}>
								Custom separator
							</label>
							<input
								id="slug-custom-sep"
								type="text"
								value={customSeparator}
								onChange={(e) => setCustomSeparator(e.target.value)}
								className={styles.input}
								maxLength={3}
								spellCheck={false}
							/>
						</div>
					)}

					<div className={styles.field}>
						<label htmlFor="slug-maxlen" className={styles.label}>
							Max length (0 = unlimited)
						</label>
						<input
							id="slug-maxlen"
							type="number"
							min={0}
							max={500}
							value={maxLength}
							onChange={(e) =>
								setMaxLength(Math.max(0, Math.min(500, Number(e.target.value) || 0)))
							}
							className={styles.input}
						/>
					</div>

					<div className={`${styles.field} ${styles.checkboxGroup}`}>
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={lowercase}
								onChange={(e) => setLowercase(e.target.checked)}
								className={styles.checkbox}
							/>
							Lowercase
						</label>
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={stripAccents}
								onChange={(e) => setStripAccents(e.target.checked)}
								className={styles.checkbox}
							/>
							Strip accents (NFKD)
						</label>
					</div>
				</div>

				<div className="mt-5">
					<div className="flex items-center justify-between mb-2 flex-wrap gap-3">
						<div>
							<h4 className={`text-sm font-semibold m-0 ${styles.cardTitle}`}>
								Custom replacements
							</h4>
							<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
								Applied before slugification. Plain text matches (case-sensitive).
							</p>
						</div>
						<button type="button" onClick={addReplacement} className={styles.btnPrimary}>
							<PlusIcon className="w-4 h-4" />
							Add
						</button>
					</div>

					{replacements.length > 0 && (
						<div className={styles.replList}>
							{replacements.map((r) => (
								<div key={r.id} className={styles.replRow}>
									<label className="sr-only" htmlFor={`rf-${r.id}`}>From</label>
									<input
										id={`rf-${r.id}`}
										className={styles.input}
										value={r.from}
										onChange={(e) =>
											updateReplacement(r.id, { from: e.target.value })
										}
										placeholder="from"
										spellCheck={false}
									/>
									<span className={styles.replArrow} aria-hidden="true">→</span>
									<label className="sr-only" htmlFor={`rt-${r.id}`}>To</label>
									<input
										id={`rt-${r.id}`}
										className={styles.input}
										value={r.to}
										onChange={(e) =>
											updateReplacement(r.id, { to: e.target.value })
										}
										placeholder="to"
										spellCheck={false}
									/>
									<button
										type="button"
										onClick={() => removeReplacement(r.id)}
										className={styles.iconBtn}
										aria-label="Remove replacement"
									>
										<XMarkIcon className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex items-center justify-between mb-3 flex-wrap gap-3">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Slug</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							{result.length} characters
						</p>
					</div>
					<button
						type="button"
						onClick={() => copy(result, "slug")}
						className={`${styles.btnPrimary} ${isCopied("slug") ? styles.copied : ""}`}
						disabled={!result}
					>
						{isCopied("slug") ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied!
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="w-4 h-4" />
								Copy
							</>
						)}
					</button>
				</div>
				<code className={styles.output}>{result || "(empty)"}</code>
			</div>
		</div>
	);
}
