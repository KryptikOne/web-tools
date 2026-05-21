"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	ClipboardDocumentCheckIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./CrontabCheatsheet.module.scss";
import { CRON_CATEGORIES, CRON_FIELDS, CRON_OPERATORS, CronEntry } from "./data";

const ALL = "All";

export default function CrontabCheatsheet() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>(ALL);
	const { copy, isCopied } = useClipboard();

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return CRON_CATEGORIES.map((cat) => ({
			...cat,
			entries: cat.entries.filter((e) => {
				if (activeCategory !== ALL && cat.name !== activeCategory) return false;
				if (!q) return true;
				return (
					e.expression.toLowerCase().includes(q) ||
					e.description.toLowerCase().includes(q) ||
					e.example.toLowerCase().includes(q)
				);
			}),
		})).filter((cat) => cat.entries.length > 0);
	}, [query, activeCategory]);

	const totalShown = filtered.reduce((n, cat) => n + cat.entries.length, 0);
	const totalAll = CRON_CATEGORIES.reduce((n, cat) => n + cat.entries.length, 0);

	return (
		<div className={styles.container}>
			<div className={`p-4 mb-4 ${styles.controlBar}`}>
				<div className={`flex items-center gap-2 ${styles.searchWrap}`}>
					<MagnifyingGlassIcon className={`w-5 h-5 ${styles.searchIcon}`} />
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search expressions, descriptions, or examples..."
						className={styles.searchInput}
						aria-label="Search cron expressions"
					/>
					{query && (
						<button onClick={() => setQuery("")} className={styles.clearBtn} aria-label="Clear search">
							<XMarkIcon className="w-4 h-4" />
						</button>
					)}
				</div>

				<div className="flex flex-wrap gap-2 mt-3">
					<button
						onClick={() => setActiveCategory(ALL)}
						className={`${styles.chip} ${activeCategory === ALL ? styles.chipActive : ""}`}
					>
						All
					</button>
					{CRON_CATEGORIES.map((cat) => (
						<button
							key={cat.name}
							onClick={() => setActiveCategory(cat.name)}
							className={`${styles.chip} ${activeCategory === cat.name ? styles.chipActive : ""}`}
						>
							{cat.name}
						</button>
					))}
				</div>

				<p className={`mt-3 text-xs ${styles.countText}`}>
					Showing <strong>{totalShown}</strong> of {totalAll} entries.
				</p>
			</div>

			<div className={`mb-6 ${styles.glassCard}`}>
				<h2 className={`text-lg font-semibold mb-3 ${styles.categoryTitle}`}>Field reference</h2>
				<div className={styles.fieldDiagram}>
					<pre className={styles.fieldArt}>{`
*    *    *    *    *
|    |    |    |    |
|    |    |    |    +---- Day of week  (0-6, 0 = Sun)
|    |    |    +--------- Month        (1-12)
|    |    +-------------- Day of month (1-31)
|    +------------------- Hour         (0-23)
+------------------------ Minute       (0-59)
`}</pre>
				</div>

				<div className={styles.fieldGrid}>
					{CRON_FIELDS.map((f) => (
						<div key={f.name} className={styles.fieldRow}>
							<div className={styles.fieldName}>{f.name}</div>
							<code className={styles.fieldRange}>{f.range}</code>
							<div className={styles.fieldNotes}>{f.notes}</div>
						</div>
					))}
				</div>

				<h3 className={`text-base font-semibold mt-5 mb-2 ${styles.categoryTitle}`}>Operators</h3>
				<div className={styles.opGrid}>
					{CRON_OPERATORS.map((op) => (
						<div key={op.symbol} className={styles.opRow}>
							<code className={styles.opSymbol}>{op.symbol}</code>
							<span className={styles.opMeaning}>{op.meaning}</span>
						</div>
					))}
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className={`${styles.glassCard} ${styles.emptyState}`}>
					No entries match your search.
				</div>
			) : (
				filtered.map((cat) => (
					<section key={cat.name} className={`mb-6 ${styles.glassCard}`}>
						<h2 className={`text-lg font-semibold mb-4 ${styles.categoryTitle}`}>{cat.name}</h2>
						<div className={styles.cardGrid}>
							{cat.entries.map((e, i) => (
								<CronCard
									key={`${cat.name}-${i}`}
									entry={e}
									fieldId={`${cat.name}-${i}`}
									copy={copy}
									isCopied={isCopied}
								/>
							))}
						</div>
					</section>
				))
			)}
		</div>
	);
}

interface CronCardProps {
	entry: CronEntry;
	fieldId: string;
	copy: (text: string, field?: string) => Promise<boolean>;
	isCopied: (field?: string) => boolean;
}

function CronCard({ entry, fieldId, copy, isCopied }: CronCardProps) {
	const copied = isCopied(fieldId);
	return (
		<button
			type="button"
			onClick={() => copy(entry.expression, fieldId)}
			className={`${styles.cronCard} ${copied ? styles.cronCardCopied : ""}`}
			title="Click to copy expression"
		>
			<div className={styles.cronHeader}>
				<code className={styles.cronExpr}>{entry.expression}</code>
				<span className={styles.copyHint} aria-hidden>
					{copied ? (
						<ClipboardDocumentCheckIcon className="w-4 h-4" />
					) : (
						<ClipboardDocumentIcon className="w-4 h-4" />
					)}
				</span>
			</div>
			<p className={styles.cronDesc}>{entry.description}</p>
			<span className={styles.exampleText}>{entry.example}</span>
		</button>
	);
}
