"use client";

import { useCallback, useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	ClipboardDocumentCheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./EmailNormalizer.module.scss";

interface Options {
	trimLowercase: boolean;
	gmail: boolean;
	outlook: boolean;
}

interface Row {
	original: string;
	normalized: string | null;
	error: string | null;
	duplicate: boolean;
}

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);
const OUTLOOK_DOMAINS = new Set(["outlook.com", "hotmail.com", "live.com", "msn.com"]);

function parseEmails(raw: string): string[] {
	return raw
		.split(/[\s,]+/)
		.map((s) => s.trim())
		.filter(Boolean);
}

function splitAddress(email: string): { local: string; domain: string } | null {
	const at = email.lastIndexOf("@");
	if (at <= 0 || at === email.length - 1) return null;
	const local = email.slice(0, at);
	const domain = email.slice(at + 1);
	if (!local || !domain || domain.indexOf(".") === -1) return null;
	return { local, domain };
}

function normalizeEmail(input: string, opts: Options): { normalized: string | null; error: string | null } {
	let work = input;
	if (opts.trimLowercase) {
		work = work.trim().toLowerCase();
	} else {
		work = work.trim();
	}

	const parts = splitAddress(work);
	if (!parts) return { normalized: null, error: "Invalid email format" };

	let { local, domain } = parts;
	const lowerDomain = domain.toLowerCase();

	if (opts.gmail && GMAIL_DOMAINS.has(lowerDomain)) {
		const plusIdx = local.indexOf("+");
		if (plusIdx >= 0) local = local.slice(0, plusIdx);
		local = local.replace(/\./g, "");
		domain = "gmail.com";
	} else if (opts.outlook && OUTLOOK_DOMAINS.has(lowerDomain)) {
		const plusIdx = local.indexOf("+");
		if (plusIdx >= 0) local = local.slice(0, plusIdx);
		domain = lowerDomain;
	}

	if (!local) return { normalized: null, error: "Local part empty after normalization" };

	return { normalized: `${local}@${domain}`, error: null };
}

export default function EmailNormalizer() {
	const [input, setInput] = useState("");
	const [opts, setOpts] = useState<Options>({
		trimLowercase: true,
		gmail: true,
		outlook: true,
	});
	const { copy, isCopied } = useClipboard();

	const rows = useMemo<Row[]>(() => {
		const emails = parseEmails(input);
		const counts = new Map<string, number>();
		const intermediate = emails.map((email) => {
			const { normalized, error } = normalizeEmail(email, opts);
			if (normalized) counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
			return { original: email, normalized, error };
		});
		return intermediate.map((row) => ({
			...row,
			duplicate: row.normalized ? (counts.get(row.normalized) ?? 0) > 1 : false,
		}));
	}, [input, opts]);

	const stats = useMemo(() => {
		const total = rows.length;
		const valid = rows.filter((r) => r.normalized).length;
		const invalid = rows.filter((r) => r.error).length;
		const unique = new Set(rows.filter((r) => r.normalized).map((r) => r.normalized!)).size;
		const duplicates = valid - unique;
		return { total, valid, invalid, unique, duplicates };
	}, [rows]);

	const uniqueNormalized = useMemo(
		() => Array.from(new Set(rows.filter((r) => r.normalized).map((r) => r.normalized!))),
		[rows]
	);

	const handleCopyAll = useCallback(() => {
		if (!uniqueNormalized.length) return;
		copy(uniqueNormalized.join("\n"), "all-unique");
	}, [uniqueNormalized, copy]);

	const handleClear = useCallback(() => setInput(""), []);

	const toggleOption = useCallback((key: keyof Options) => {
		setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	return (
		<div className={styles.container}>
			<div className={`mb-4 p-4 ${styles.optionsBar}`}>
				<div className="flex flex-wrap gap-x-6 gap-y-3">
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={opts.trimLowercase}
							onChange={() => toggleOption("trimLowercase")}
							className={styles.checkbox}
						/>
						Trim &amp; lowercase
					</label>
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={opts.gmail}
							onChange={() => toggleOption("gmail")}
							className={styles.checkbox}
						/>
						Gmail / Googlemail rules (strip dots, drop <code>+tag</code>, normalize domain)
					</label>
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={opts.outlook}
							onChange={() => toggleOption("outlook")}
							className={styles.checkbox}
						/>
						Outlook / Live / Hotmail rules (drop <code>+tag</code>)
					</label>
				</div>
			</div>

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-3 flex-wrap gap-3">
					<h2 className={`text-lg font-semibold ${styles.cardTitle}`}>Emails to normalize</h2>
					<button onClick={handleClear} disabled={!input} className={styles.btnSecondary}>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={"One email per line, or comma-separated.\nExample:\nJane.Doe+work@gmail.com\njane.doe@googlemail.com\nfoo+spam@outlook.com"}
					className={styles.textarea}
					spellCheck={false}
					aria-label="Emails to normalize"
				/>
				<div className={`flex justify-between mt-2 text-xs ${styles.cardFooter}`}>
					<span>{rows.length} email{rows.length === 1 ? "" : "s"} parsed</span>
				</div>
			</div>

			{rows.length > 0 && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<div className="flex flex-wrap justify-between items-center mb-4 gap-3">
						<div className="flex flex-wrap gap-3">
							<span className={styles.statChip}>Total <strong>{stats.total}</strong></span>
							<span className={styles.statChip}>Valid <strong>{stats.valid}</strong></span>
							{stats.invalid > 0 && (
								<span className={`${styles.statChip} ${styles.statChipBad}`}>Invalid <strong>{stats.invalid}</strong></span>
							)}
							<span className={styles.statChip}>Unique <strong>{stats.unique}</strong></span>
							{stats.duplicates > 0 && (
								<span className={`${styles.statChip} ${styles.statChipWarn}`}>Duplicates <strong>{stats.duplicates}</strong></span>
							)}
						</div>
						<button
							onClick={handleCopyAll}
							disabled={!uniqueNormalized.length}
							className={`${styles.btnPrimary} ${isCopied("all-unique") ? styles.copied : ""}`}
						>
							{isCopied("all-unique") ? (
								<>
									<ClipboardDocumentCheckIcon className="w-4 h-4" />
									Copied!
								</>
							) : (
								<>
									<ClipboardDocumentIcon className="w-4 h-4" />
									Copy {stats.unique} unique
								</>
							)}
						</button>
					</div>

					<div className={styles.tableWrap}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th>#</th>
									<th>Original</th>
									<th>Normalized</th>
									<th>Status</th>
									<th aria-label="Actions"></th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row, i) => {
									const fieldId = `row-${i}`;
									return (
										<tr key={i} className={row.duplicate ? styles.rowDup : ""}>
											<td className={styles.rowIndex}>{i + 1}</td>
											<td className={styles.codeCell}>{row.original}</td>
											<td className={styles.codeCell}>{row.normalized ?? "—"}</td>
											<td>
												{row.error ? (
													<span className={`${styles.badge} ${styles.badgeError}`}>{row.error}</span>
												) : row.duplicate ? (
													<span className={`${styles.badge} ${styles.badgeWarn}`}>Duplicate</span>
												) : (
													<span className={`${styles.badge} ${styles.badgeOk}`}>Unique</span>
												)}
											</td>
											<td>
												{row.normalized && (
													<button
														onClick={() => copy(row.normalized!, fieldId)}
														className={styles.copyBtn}
														title="Copy normalized"
														aria-label="Copy normalized email"
													>
														{isCopied(fieldId) ? (
															<ClipboardDocumentCheckIcon className="w-4 h-4" />
														) : (
															<ClipboardDocumentIcon className="w-4 h-4" />
														)}
													</button>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 ${styles.cardTitle}`}>How normalization works</h3>
				<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Gmail / Googlemail</h4>
						<p className={`text-sm m-0 ${styles.infoText}`}>
							Gmail ignores dots in the local part and treats anything after <code>+</code> as a tag. <code>j.doe+sales@googlemail.com</code> and <code>jdoe@gmail.com</code> resolve to the same mailbox.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Outlook / Live / Hotmail</h4>
						<p className={`text-sm m-0 ${styles.infoText}`}>
							Outlook accepts <code>+tag</code> aliases that route to the base address. Dots are <em>not</em> ignored — only <code>+tag</code> suffixes are stripped.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Why normalize?</h4>
						<p className={`text-sm m-0 ${styles.infoText}`}>
							Useful for deduplicating mailing lists, abuse detection, and account-uniqueness checks where users may try to register variants of the same address.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Caveats</h4>
						<p className={`text-sm m-0 ${styles.infoText}`}>
							Other providers may also support tagging, but their rules vary. When in doubt, leave the address untouched and rely on the trim/lowercase pass alone.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
