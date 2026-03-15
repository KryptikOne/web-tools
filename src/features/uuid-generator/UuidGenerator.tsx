"use client";

import { useState, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	ClipboardDocumentCheckIcon,
	TrashIcon,
	PlusIcon,
	CheckCircleIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import styles from "./UuidGenerator.module.scss";

type UuidFormat = "standard" | "no-hyphens" | "uppercase" | "lowercase" | "braces" | "urn";

const FORMAT_OPTIONS: { value: UuidFormat; label: string; example: string }[] = [
	{ value: "standard", label: "Standard", example: "550e8400-e29b-41d4-a716-446655440000" },
	{ value: "no-hyphens", label: "No Hyphens", example: "550e8400e29b41d4a716446655440000" },
	{ value: "uppercase", label: "Uppercase", example: "550E8400-E29B-41D4-A716-446655440000" },
	{ value: "lowercase", label: "Lowercase", example: "550e8400-e29b-41d4-a716-446655440000" },
	{ value: "braces", label: "Braces", example: "{550e8400-e29b-41d4-a716-446655440000}" },
	{ value: "urn", label: "URN", example: "urn:uuid:550e8400-e29b-41d4-a716-446655440000" },
];

function generateRawUuid(): string {
	return crypto.randomUUID();
}

function formatUuid(uuid: string, format: UuidFormat): string {
	const lower = uuid.toLowerCase();
	switch (format) {
		case "standard":
			return lower;
		case "no-hyphens":
			return lower.replace(/-/g, "");
		case "uppercase":
			return uuid.toUpperCase();
		case "lowercase":
			return lower;
		case "braces":
			return `{${lower}}`;
		case "urn":
			return `urn:uuid:${lower}`;
	}
}

const UUID_REGEX = /^\{?(?:urn:uuid:)?([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})\}?$/i;

function validateUuid(input: string): { valid: boolean; version: number | null } {
	const match = input.trim().match(UUID_REGEX);
	if (!match) return { valid: false, version: null };

	const versionChar = match[3]?.[0];
	if (!versionChar) return { valid: false, version: null };

	const version = parseInt(versionChar, 16);
	if (version < 1 || version > 8) return { valid: true, version: null };

	return { valid: true, version };
}

export default function UuidGenerator() {
	const [format, setFormat] = useState<UuidFormat>("standard");
	const [bulkCount, setBulkCount] = useState(5);
	const [generatedUuids, setGeneratedUuids] = useState<string[]>([]);
	const [history, setHistory] = useState<string[]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);
	const [validateInput, setValidateInput] = useState("");
	const [validationResult, setValidationResult] = useState<{ valid: boolean; version: number | null } | null>(null);

	const addToHistory = useCallback((uuids: string[]) => {
		setHistory((prev) => [...uuids, ...prev].slice(0, 100));
	}, []);

	const handleGenerateSingle = useCallback(() => {
		const uuid = formatUuid(generateRawUuid(), format);
		setGeneratedUuids([uuid]);
		addToHistory([uuid]);
	}, [format, addToHistory]);

	const handleGenerateBulk = useCallback(() => {
		const count = Math.max(1, Math.min(1000, bulkCount));
		const uuids = Array.from({ length: count }, () => formatUuid(generateRawUuid(), format));
		setGeneratedUuids(uuids);
		addToHistory(uuids);
	}, [format, bulkCount, addToHistory]);

	const handleCopy = useCallback(async (text: string, index: number) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch {
			// Clipboard write failed silently
		}
	}, []);

	const handleCopyAll = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(generatedUuids.join("\n"));
			setCopiedAll(true);
			setTimeout(() => setCopiedAll(false), 2000);
		} catch {
			// Clipboard write failed silently
		}
	}, [generatedUuids]);

	const handleValidate = useCallback(() => {
		if (!validateInput.trim()) {
			setValidationResult(null);
			return;
		}
		setValidationResult(validateUuid(validateInput));
	}, [validateInput]);

	const handleClear = useCallback(() => {
		setGeneratedUuids([]);
	}, []);

	const handleClearHistory = useCallback(() => {
		setHistory([]);
	}, []);

	const handleBulkCountChange = (value: string) => {
		const num = parseInt(value, 10);
		if (!isNaN(num)) {
			setBulkCount(Math.max(1, Math.min(1000, num)));
		}
	};

	return (
		<div className={styles.container}>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				{/* Generation Controls */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Generate UUIDs</h2>

					{/* Format Selection */}
					<div className="mb-4">
						<label className={`block mb-2 text-sm font-medium ${styles.label}`}>Format</label>
						<div className="flex flex-wrap gap-2">
							{FORMAT_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									className={`${styles.formatBtn} ${format === opt.value ? styles.active : ""}`}
									onClick={() => setFormat(opt.value)}
									title={opt.example}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					{/* Single Generate */}
					<div className="mb-4">
						<Button onClick={handleGenerateSingle} className={`w-full justify-center gap-2 ${styles.primaryBtn}`}>
							<PlusIcon className="w-5 h-5" />
							Generate UUID
						</Button>
					</div>

					{/* Bulk Generate */}
					<div className="flex gap-3 items-end">
						<div className="flex-1">
							<label className={`block mb-2 text-sm font-medium ${styles.label}`}>Count (1-1000)</label>
							<input
								type="number"
								min={1}
								max={1000}
								value={bulkCount}
								onChange={(e) => handleBulkCountChange(e.target.value)}
								className={styles.inputField}
								aria-label="UUID count"
							/>
						</div>
						<Button onClick={handleGenerateBulk} className={`gap-2 ${styles.secondaryBtn}`}>
							Generate Bulk
						</Button>
					</div>
				</div>

				{/* UUID Validator */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Validate UUID</h2>
					<div className="mb-4">
						<label className={`block mb-2 text-sm font-medium ${styles.label}`}>Paste a UUID to validate</label>
						<input
							type="text"
							value={validateInput}
							onChange={(e) => {
								setValidateInput(e.target.value);
								setValidationResult(null);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleValidate();
							}}
							placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
							className={styles.inputField}
						/>
					</div>
					<Button onClick={handleValidate} className={`w-full justify-center gap-2 mb-4 ${styles.secondaryBtn}`}>
						Validate
					</Button>

					{validationResult && (
						<div className={`flex items-center gap-3 p-4 ${styles.validationResult} ${validationResult.valid ? styles.valid : styles.invalid}`}>
							{validationResult.valid ? (
								<>
									<CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
									<div>
										<p className="font-semibold">Valid UUID</p>
										<p className="text-sm opacity-80">
											{validationResult.version ? `Version ${validationResult.version} (v${validationResult.version})` : "Version could not be determined"}
										</p>
									</div>
								</>
							) : (
								<>
									<XCircleIcon className="w-6 h-6 flex-shrink-0" />
									<div>
										<p className="font-semibold">Invalid UUID</p>
										<p className="text-sm opacity-80">The input does not match any recognized UUID format.</p>
									</div>
								</>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Generated UUIDs List */}
			{generatedUuids.length > 0 && (
				<div className={`mb-6 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4">
						<h2 className={styles.sectionTitle}>
							Generated UUIDs <span className={`text-sm font-normal ${styles.countBadge}`}>({generatedUuids.length})</span>
						</h2>
						<div className="flex gap-2">
							<Button onClick={handleCopyAll} className={`gap-2 ${styles.copyAllBtn}`}>
								{copiedAll ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
								{copiedAll ? "Copied!" : "Copy All"}
							</Button>
							<Button onClick={handleClear} className={`gap-2 ${styles.clearBtn}`}>
								<TrashIcon className="w-4 h-4" />
								Clear
							</Button>
						</div>
					</div>
					<div className={styles.uuidList}>
						{generatedUuids.map((uuid, index) => (
							<div key={`${uuid}-${index}`} className={`flex items-center gap-3 ${styles.uuidRow}`}>
								<span className={`text-sm ${styles.rowIndex}`}>{index + 1}</span>
								<code className={`flex-1 text-sm ${styles.uuidText}`}>{uuid}</code>
								<button onClick={() => handleCopy(uuid, index)} className={styles.copyBtn} title="Copy to clipboard">
									{copiedIndex === index ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* History */}
			{history.length > 0 && (
				<div className={`mb-6 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4">
						<h2 className={styles.sectionTitle}>History</h2>
						<Button onClick={handleClearHistory} className={`gap-2 ${styles.clearBtn}`}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</Button>
					</div>
					<div className={styles.historyList}>
						{history.map((uuid, index) => (
							<div key={`history-${uuid}-${index}`} className={`flex items-center gap-3 ${styles.historyRow}`}>
								<code className={`flex-1 text-sm ${styles.uuidText}`}>{uuid}</code>
								<button onClick={() => handleCopy(uuid, -(index + 1))} className={styles.copyBtn} title="Copy to clipboard">
									{copiedIndex === -(index + 1) ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Info */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>About UUIDs</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className={`p-4 ${styles.infoItem}`}>
						<h3 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>What is a UUID?</h3>
						<p className={`text-sm leading-relaxed ${styles.infoText}`}>
							A Universally Unique Identifier (UUID) is a 128-bit identifier that is unique across space and time. UUIDs are commonly used as database primary keys, session tokens, and distributed system identifiers.
						</p>
					</div>
					<div className={`p-4 ${styles.infoItem}`}>
						<h3 className={`font-semibold mb-2 ${styles.infoSubtitle}`}>Version 4 (Random)</h3>
						<p className={`text-sm leading-relaxed ${styles.infoText}`}>
							This tool generates version 4 UUIDs, which are created using cryptographically strong random values. The probability of a collision is negligible for all practical purposes.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
