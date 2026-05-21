"use client";

import { useEffect, useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	PlusIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import styles from "./UrlParser.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type ParsedUrl = {
	href: string;
	protocol: string;
	username: string;
	password: string;
	host: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	hash: string;
	origin: string;
};

type ParseResult =
	| { ok: true; url: URL; parsed: ParsedUrl }
	| { ok: false; error: string };

type ParamRow = { id: number; key: string; value: string };

const DEFAULT_URL = "https://user:pass@example.com:8080/path/to/resource?foo=bar&baz=qux#section";

function parseUrl(input: string): ParseResult {
	const trimmed = input.trim();
	if (!trimmed) return { ok: false, error: "Enter a URL to parse" };
	try {
		const url = new URL(trimmed);
		return {
			ok: true,
			url,
			parsed: {
				href: url.href,
				protocol: url.protocol,
				username: url.username,
				password: url.password,
				host: url.host,
				hostname: url.hostname,
				port: url.port,
				pathname: url.pathname,
				search: url.search,
				hash: url.hash,
				origin: url.origin,
			},
		};
	} catch {
		return { ok: false, error: "Invalid URL. Include a protocol (e.g. https://)." };
	}
}

function rowsFromUrl(url: URL): ParamRow[] {
	let i = 0;
	const rows: ParamRow[] = [];
	url.searchParams.forEach((value, key) => {
		rows.push({ id: i++, key, value });
	});
	return rows;
}

function rebuildUrl(url: URL, rows: ParamRow[]): string {
	const params = new URLSearchParams();
	for (const row of rows) {
		if (row.key) params.append(row.key, row.value);
	}
	const next = new URL(url.href);
	next.search = params.toString();
	return next.href;
}

export default function UrlParser() {
	const [input, setInput] = useState(DEFAULT_URL);
	const [rows, setRows] = useState<ParamRow[]>([]);
	const [nextRowId, setNextRowId] = useState(0);
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => parseUrl(input), [input]);

	useEffect(() => {
		if (result.ok) {
			const fresh = rowsFromUrl(result.url);
			setRows(fresh);
			setNextRowId(fresh.length);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [result.ok ? result.url.href : ""]);

	const rebuiltUrl = useMemo(() => {
		if (!result.ok) return "";
		return rebuildUrl(result.url, rows);
	}, [result, rows]);

	const updateRow = (id: number, patch: Partial<ParamRow>) => {
		setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
	};

	const removeRow = (id: number) => {
		setRows((prev) => prev.filter((r) => r.id !== id));
	};

	const addRow = () => {
		setRows((prev) => [...prev, { id: nextRowId, key: "", value: "" }]);
		setNextRowId((n) => n + 1);
	};

	const applyRebuilt = () => {
		if (rebuiltUrl) setInput(rebuiltUrl);
	};

	const handleClear = () => setInput("");

	const fields: Array<{ label: string; key: keyof ParsedUrl; mono?: boolean }> = [
		{ label: "Origin", key: "origin", mono: true },
		{ label: "Protocol", key: "protocol", mono: true },
		{ label: "Username", key: "username" },
		{ label: "Password", key: "password" },
		{ label: "Host", key: "host", mono: true },
		{ label: "Hostname", key: "hostname", mono: true },
		{ label: "Port", key: "port", mono: true },
		{ label: "Pathname", key: "pathname", mono: true },
		{ label: "Search", key: "search", mono: true },
		{ label: "Hash", key: "hash", mono: true },
	];

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>URL</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Paste any URL — parsed using the native <code>URL</code> API.
						</p>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleClear}
							className={styles.btnSecondary}
							disabled={!input}
							type="button"
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				</div>

				<label htmlFor="url-input" className="sr-only">URL to parse</label>
				<textarea
					id="url-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="https://example.com/path?key=value#hash"
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{!result.ok && input.trim() && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{result.ok && (
				<>
					<div className={`mt-4 ${styles.glassCard}`}>
						<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
							Components
						</h3>
						<div className={styles.componentGrid}>
							{fields.map(({ label, key, mono }) => {
								const value = result.parsed[key];
								return (
									<div key={key} className={styles.componentRow}>
										<div className={styles.componentLabel}>{label}</div>
										<div className={`flex items-center gap-2 ${styles.componentValueWrap}`}>
											<code
												className={`${styles.componentValue} ${mono ? styles.mono : ""} ${value ? "" : styles.empty}`}
											>
												{value || "(empty)"}
											</code>
											{value && (
												<button
													type="button"
													onClick={() => copy(value, `field-${key}`)}
													className={`${styles.copyBtn} ${isCopied(`field-${key}`) ? styles.copied : ""}`}
													aria-label={`Copy ${label}`}
												>
													{isCopied(`field-${key}`) ? (
														<CheckIcon className="w-4 h-4" />
													) : (
														<ClipboardDocumentIcon className="w-4 h-4" />
													)}
												</button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className={`mt-4 ${styles.glassCard}`}>
						<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
							<div>
								<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
									Query Parameters
								</h3>
								<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
									Edit, add, or remove rows — the rebuilt URL updates below.
								</p>
							</div>
							<button onClick={addRow} className={styles.btnPrimary} type="button">
								<PlusIcon className="w-4 h-4" />
								Add row
							</button>
						</div>

						{rows.length === 0 ? (
							<p className={`text-sm m-0 ${styles.cardSubtitle}`}>
								No query parameters. Click <strong>Add row</strong> to add one.
							</p>
						) : (
							<div className={styles.paramTable}>
								<div className={`${styles.paramHeader} ${styles.paramRow}`}>
									<div>Key</div>
									<div>Value</div>
									<div aria-hidden="true" />
								</div>
								{rows.map((row) => (
									<div key={row.id} className={styles.paramRow}>
										<label className="sr-only" htmlFor={`pk-${row.id}`}>Param key</label>
										<input
											id={`pk-${row.id}`}
											className={styles.paramInput}
											value={row.key}
											onChange={(e) => updateRow(row.id, { key: e.target.value })}
											placeholder="key"
											spellCheck={false}
										/>
										<label className="sr-only" htmlFor={`pv-${row.id}`}>Param value</label>
										<input
											id={`pv-${row.id}`}
											className={styles.paramInput}
											value={row.value}
											onChange={(e) => updateRow(row.id, { value: e.target.value })}
											placeholder="value"
											spellCheck={false}
										/>
										<button
											type="button"
											onClick={() => removeRow(row.id)}
											className={styles.iconBtn}
											aria-label="Remove parameter"
										>
											<XMarkIcon className="w-4 h-4" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					<div className={`mt-4 ${styles.glassCard}`}>
						<div className="flex justify-between items-center mb-3 flex-wrap gap-4">
							<div>
								<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
									Rebuilt URL
								</h3>
								<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
									Rebuilt from edits via <code>URLSearchParams.toString()</code>.
								</p>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={applyRebuilt}
									className={styles.btnSecondary}
									disabled={rebuiltUrl === result.parsed.href}
								>
									Apply to input
								</button>
								<button
									type="button"
									onClick={() => copy(rebuiltUrl, "rebuilt")}
									className={`${styles.btnPrimary} ${isCopied("rebuilt") ? styles.copied : ""}`}
								>
									{isCopied("rebuilt") ? (
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
						</div>
						<code className={styles.rebuiltUrl}>{rebuiltUrl}</code>
					</div>
				</>
			)}
		</div>
	);
}
