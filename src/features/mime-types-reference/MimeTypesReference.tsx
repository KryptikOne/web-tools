"use client";

import { useEffect, useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import styles from "./MimeTypesReference.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

interface MimeEntry {
	ext: string;
	type: string;
	description: string;
}

export default function MimeTypesReference() {
	const [entries, setEntries] = useState<MimeEntry[] | null>(null);
	const [query, setQuery] = useState("");
	const [loadError, setLoadError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		let cancelled = false;
		import("@/data/mime-types.json")
			.then((mod) => {
				if (cancelled) return;
				const data = (mod.default as MimeEntry[]) ?? [];
				setEntries(data);
			})
			.catch((err) => {
				if (cancelled) return;
				setLoadError(err instanceof Error ? err.message : "Failed to load MIME data");
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const filtered = useMemo<MimeEntry[]>(() => {
		if (!entries) return [];
		const q = query.trim().toLowerCase().replace(/^\./, "");
		if (!q) return entries;
		return entries.filter(
			(e) =>
				e.ext.toLowerCase().includes(q) ||
				e.type.toLowerCase().includes(q) ||
				e.description.toLowerCase().includes(q)
		);
	}, [entries, query]);

	return (
		<div className={styles.container}>
			<div className={`p-4 mb-6 ${styles.glassCard}`}>
				<label htmlFor="mime-search" className={`block text-sm font-medium mb-2 ${styles.cardTitle}`}>
					Search MIME types
				</label>
				<div className={styles.searchWrap}>
					<MagnifyingGlassIcon className={`w-4 h-4 ${styles.searchIcon}`} aria-hidden="true" />
					<input
						id="mime-search"
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search by extension (png), type (image/), or description (audio)..."
						className={styles.searchInput}
						spellCheck={false}
						autoComplete="off"
					/>
					{query && (
						<button
							type="button"
							onClick={() => setQuery("")}
							className={styles.clearBtn}
							aria-label="Clear search"
						>
							<XMarkIcon className="w-4 h-4" />
						</button>
					)}
				</div>
				<div className={`mt-2 text-xs ${styles.cardSubtitle}`}>
					{entries
						? `${filtered.length} of ${entries.length} entries`
						: "Loading dataset..."}
				</div>
			</div>

			{loadError && (
				<div className={`mb-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{loadError}
				</div>
			)}

			<div className={styles.glassCard}>
				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th scope="col">Extension</th>
								<th scope="col">MIME Type</th>
								<th scope="col">Description</th>
								<th scope="col" className={styles.actionCol}>
									<span className="sr-only">Copy</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 && entries && (
								<tr>
									<td colSpan={4} className={styles.emptyRow}>
										No matches.
									</td>
								</tr>
							)}
							{filtered.map((entry, idx) => {
								const fieldId = `${entry.ext}-${entry.type}-${idx}`;
								return (
									<tr key={fieldId}>
										<td>
											<code className={styles.ext}>.{entry.ext}</code>
										</td>
										<td>
											<code className={styles.mime}>{entry.type}</code>
										</td>
										<td className={styles.desc}>{entry.description}</td>
										<td className={styles.actionCol}>
											<button
												type="button"
												onClick={() => copy(entry.type, fieldId)}
												className={`${styles.copyBtn} ${
													isCopied(fieldId) ? styles.copied : ""
												}`}
												aria-label={`Copy MIME type ${entry.type}`}
											>
												{isCopied(fieldId) ? (
													<CheckIcon className="w-4 h-4" />
												) : (
													<ClipboardDocumentIcon className="w-4 h-4" />
												)}
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					About MIME types
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					A MIME (Multipurpose Internet Mail Extensions) type — also called a media
					type or content type — labels the format of a piece of data. Browsers and
					servers use these strings (for example in <code>Content-Type</code> headers
					and <code>&lt;input accept&gt;</code>) to decide how to handle a file. The
					dataset here covers common extensions; the IANA registry is the canonical
					source for everything else.
				</p>
			</div>
		</div>
	);
}
