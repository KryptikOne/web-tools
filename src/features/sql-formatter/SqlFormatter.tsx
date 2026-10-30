"use client";

import { useState, useMemo } from "react";
import { format, type SqlLanguage, type KeywordCase } from "sql-formatter";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./SqlFormatter.module.scss";

const DIALECTS: { value: SqlLanguage; label: string }[] = [
	{ value: "sql", label: "Standard SQL" },
	{ value: "mysql", label: "MySQL" },
	{ value: "mariadb", label: "MariaDB" },
	{ value: "postgresql", label: "PostgreSQL" },
	{ value: "sqlite", label: "SQLite" },
	{ value: "transactsql", label: "T-SQL (MS SQL)" },
	{ value: "bigquery", label: "BigQuery" },
	{ value: "redshift", label: "Redshift" },
	{ value: "snowflake", label: "Snowflake" },
];

const KEYWORD_CASES: { value: KeywordCase; label: string }[] = [
	{ value: "preserve", label: "Preserve" },
	{ value: "upper", label: "UPPERCASE" },
	{ value: "lower", label: "lowercase" },
];

export default function SqlFormatter() {
	const [input, setInput] = useState("");
	const [dialect, setDialect] = useState<SqlLanguage>("postgresql");
	const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
	const [tabWidth, setTabWidth] = useState<2 | 4>(2);

	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!input.trim()) return { output: "", error: null as string | null };
		try {
			const formatted = format(input, {
				language: dialect,
				keywordCase,
				tabWidth,
			});
			return { output: formatted, error: null };
		} catch (err) {
			return {
				output: "",
				error: err instanceof Error ? err.message : "Format error",
			};
		}
	}, [input, dialect, keywordCase, tabWidth]);

	return (
		<div className={styles.container}>
			<div className={`flex flex-wrap gap-4 mb-6 p-4 ${styles.optionsBar}`}>
				<label className={`flex items-center gap-2 text-sm ${styles.optionLabel}`}>
					Dialect
					<select
						value={dialect}
						onChange={(e) => setDialect(e.target.value as SqlLanguage)}
						className={styles.select}
						aria-label="SQL dialect"
					>
						{DIALECTS.map((d) => (
							<option key={d.value} value={d.value}>{d.label}</option>
						))}
					</select>
				</label>

				<label className={`flex items-center gap-2 text-sm ${styles.optionLabel}`}>
					Keyword case
					<select
						value={keywordCase}
						onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
						className={styles.select}
						aria-label="Keyword case"
					>
						{KEYWORD_CASES.map((c) => (
							<option key={c.value} value={c.value}>{c.label}</option>
						))}
					</select>
				</label>

				<label className={`flex items-center gap-2 text-sm ${styles.optionLabel}`}>
					Indent
					<select
						value={tabWidth}
						onChange={(e) => setTabWidth(Number(e.target.value) as 2 | 4)}
						className={styles.select}
						aria-label="Indent width"
					>
						<option value={2}>2 spaces</option>
						<option value={4}>4 spaces</option>
					</select>
				</label>
			</div>

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>SQL input</h3>
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
				<label htmlFor="sql-input" className="sr-only">SQL to format</label>
				<textarea
					id="sql-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="SELECT * FROM users WHERE id = 1;"
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
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Formatted SQL</h3>
					<button
						type="button"
						onClick={() => copy(result.output, "sql")}
						className={`${styles.btnPrimary} ${isCopied("sql") ? styles.copied : ""}`}
						disabled={!result.output}
					>
						{isCopied("sql") ? (
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
				<label htmlFor="sql-output" className="sr-only">Formatted SQL</label>
				<textarea
					id="sql-output"
					value={result.output}
					readOnly
					placeholder="Formatted SQL will appear here"
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
			</div>
		</div>
	);
}
