"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./TextCaseConverter.module.scss";
import {
	toUpperCase,
	toLowerCase,
	toTitleCase,
	toSentenceCase,
	toCamelCase,
	toPascalCase,
	toSnakeCase,
	toKebabCase,
	toConstantCase,
	toDotCase,
	toPathCase,
	toAlternatingCase,
	toInverseCase,
} from "@/lib/textCaseUtils";

type CaseType =
	| "uppercase"
	| "lowercase"
	| "title"
	| "sentence"
	| "camel"
	| "pascal"
	| "snake"
	| "kebab"
	| "constant"
	| "dot"
	| "path"
	| "alternating"
	| "inverse";

interface CaseOption {
	key: CaseType;
	label: string;
	example: string;
}

const CASE_OPTIONS: CaseOption[] = [
	{ key: "uppercase", label: "UPPERCASE", example: "HELLO WORLD" },
	{ key: "lowercase", label: "lowercase", example: "hello world" },
	{ key: "title", label: "Title Case", example: "Hello World" },
	{ key: "sentence", label: "Sentence case", example: "Hello world" },
	{ key: "camel", label: "camelCase", example: "helloWorld" },
	{ key: "pascal", label: "PascalCase", example: "HelloWorld" },
	{ key: "snake", label: "snake_case", example: "hello_world" },
	{ key: "kebab", label: "kebab-case", example: "hello-world" },
	{ key: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
	{ key: "dot", label: "dot.case", example: "hello.world" },
	{ key: "path", label: "path/case", example: "hello/world" },
	{ key: "alternating", label: "aLtErNaTiNg", example: "hElLo WoRlD" },
	{ key: "inverse", label: "InVeRsE", example: "hELLO wORLD" },
];

const CONVERTERS: Record<CaseType, (text: string) => string> = {
	uppercase: toUpperCase,
	lowercase: toLowerCase,
	title: toTitleCase,
	sentence: toSentenceCase,
	camel: toCamelCase,
	pascal: toPascalCase,
	snake: toSnakeCase,
	kebab: toKebabCase,
	constant: toConstantCase,
	dot: toDotCase,
	path: toPathCase,
	alternating: toAlternatingCase,
	inverse: toInverseCase,
};

export default function TextCaseConverter() {
	const [inputText, setInputText] = useState("");
	const [activeCase, setActiveCase] = useState<CaseType>("uppercase");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const outputText = useMemo(() => {
		if (!inputText) return "";
		return CONVERTERS[activeCase](inputText);
	}, [inputText, activeCase]);

	const stats = useMemo(() => {
		const charCount = inputText.length;
		const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
		return { charCount, wordCount };
	}, [inputText]);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const handleClear = () => {
		setInputText("");
	};

	return (
		<div className={styles.container}>
			{/* Case Selection Buttons */}
			<div className={styles.glassCard}>
				<h3 className={styles.sectionTitle}>Conversion Type</h3>
				<div className="flex flex-wrap gap-2">
					{CASE_OPTIONS.map((option) => (
						<button
							key={option.key}
							onClick={() => setActiveCase(option.key)}
							className={`${styles.caseBtn} ${activeCase === option.key ? styles.active : ""}`}
							title={option.example}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{/* Converter Grid */}
			<div className={`grid gap-6 mt-6 ${styles.grid}`}>
				{/* Input Panel */}
				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Input Text
						</h3>
						<button
							onClick={handleClear}
							className={styles.btnSecondary}
							disabled={!inputText}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>

					<textarea
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						placeholder="Type or paste your text here..."
						className={styles.textarea}
						spellCheck={false}
					/>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>{stats.charCount} characters</span>
						<span>{stats.wordCount} words</span>
					</div>
				</div>

				{/* Output Panel */}
				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							{CASE_OPTIONS.find((o) => o.key === activeCase)?.label ?? "Output"}
						</h3>
						<button
							onClick={() => handleCopy(outputText, "output")}
							className={`${styles.btnPrimary} ${copiedField === "output" ? styles.copied : ""}`}
							disabled={!outputText}
						>
							{copiedField === "output" ? (
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

					<textarea
						value={outputText}
						readOnly
						placeholder="Converted text will appear here..."
						className={`${styles.textarea} ${styles.readOnly}`}
						spellCheck={false}
					/>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>{outputText.length} characters</span>
					</div>
				</div>
			</div>

			{/* All Conversions Preview */}
			{inputText && (
				<div className={`mt-6 ${styles.glassCard}`}>
					<h3 className={styles.sectionTitle}>All Conversions</h3>
					<div className={`flex flex-col gap-2 ${styles.previewList}`}>
						{CASE_OPTIONS.map((option) => {
							const converted = CONVERTERS[option.key](inputText);
							const isCopied = copiedField === option.key;
							return (
								<div
									key={option.key}
									className={`flex items-center gap-3 ${styles.previewRow}`}
								>
									<span className={`text-xs font-medium shrink-0 ${styles.previewLabel}`}>
										{option.label}
									</span>
									<span className={`flex-1 text-sm truncate ${styles.previewText}`}>
										{converted}
									</span>
									<button
										onClick={() => handleCopy(converted, option.key)}
										className={`${styles.copyBtn} ${isCopied ? styles.copied : ""}`}
										title={`Copy ${option.label}`}
									>
										{isCopied ? (
											<CheckIcon className={styles.copyIcon} />
										) : (
											<ClipboardDocumentIcon className={styles.copyIcon} />
										)}
									</button>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
