"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	CalculatorIcon,
	InformationCircleIcon,
	ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import styles from "./FileSizeCalculator.module.scss";

// --- Types ---

type UnitId = "b" | "kb" | "mb" | "gb" | "tb" | "pb";
type BaseMode = "binary" | "decimal";

interface SizeUnit {
	id: UnitId;
	name: string;
	abbrevBinary: string;
	abbrevDecimal: string;
	powerBinary: number; // exponent of 1024
	powerDecimal: number; // exponent of 1000
}

interface FileReference {
	label: string;
	size: string;
	bytes: number;
}

// --- Constants ---

const SIZE_UNITS: SizeUnit[] = [
	{ id: "b", name: "Bytes", abbrevBinary: "B", abbrevDecimal: "B", powerBinary: 0, powerDecimal: 0 },
	{ id: "kb", name: "Kilobytes", abbrevBinary: "KiB", abbrevDecimal: "KB", powerBinary: 1, powerDecimal: 1 },
	{ id: "mb", name: "Megabytes", abbrevBinary: "MiB", abbrevDecimal: "MB", powerBinary: 2, powerDecimal: 2 },
	{ id: "gb", name: "Gigabytes", abbrevBinary: "GiB", abbrevDecimal: "GB", powerBinary: 3, powerDecimal: 3 },
	{ id: "tb", name: "Terabytes", abbrevBinary: "TiB", abbrevDecimal: "TB", powerBinary: 4, powerDecimal: 4 },
	{ id: "pb", name: "Petabytes", abbrevBinary: "PiB", abbrevDecimal: "PB", powerBinary: 5, powerDecimal: 5 },
];

const COMMON_FILE_REFERENCES: FileReference[] = [
	{ label: "Plain text email", size: "~20 KB", bytes: 20_000 },
	{ label: "Average photo (JPEG)", size: "~5 MB", bytes: 5_000_000 },
	{ label: "RAW photo", size: "~25 MB", bytes: 25_000_000 },
	{ label: "MP3 song (4 min)", size: "~4 MB", bytes: 4_000_000 },
	{ label: "FLAC song (4 min)", size: "~30 MB", bytes: 30_000_000 },
	{ label: "HD movie (1080p)", size: "~4.5 GB", bytes: 4_500_000_000 },
	{ label: "4K movie", size: "~20 GB", bytes: 20_000_000_000 },
	{ label: "AAA video game", size: "~80 GB", bytes: 80_000_000_000 },
	{ label: "macOS install", size: "~13 GB", bytes: 13_000_000_000 },
	{ label: "Windows 11 ISO", size: "~5.5 GB", bytes: 5_500_000_000 },
];

// --- Helpers ---

function getBase(mode: BaseMode): number {
	return mode === "binary" ? 1024 : 1000;
}

function getAbbrev(unit: SizeUnit, mode: BaseMode): string {
	return mode === "binary" ? unit.abbrevBinary : unit.abbrevDecimal;
}

function toBytes(value: number, unitId: UnitId, mode: BaseMode): number {
	const unit = SIZE_UNITS.find((u) => u.id === unitId);
	if (!unit) return 0;
	const base = getBase(mode);
	const power = mode === "binary" ? unit.powerBinary : unit.powerDecimal;
	return value * Math.pow(base, power);
}

function fromBytes(bytes: number, unitId: UnitId, mode: BaseMode): number {
	const unit = SIZE_UNITS.find((u) => u.id === unitId);
	if (!unit) return 0;
	const base = getBase(mode);
	const power = mode === "binary" ? unit.powerBinary : unit.powerDecimal;
	return bytes / Math.pow(base, power);
}

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1_000_000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(Math.abs(num) < 1 ? 6 : 4).replace(/\.?0+$/, "");
}

// --- Component ---

export default function FileSizeCalculator() {
	// Converter state
	const [inputValue, setInputValue] = useState<string>("1");
	const [inputUnit, setInputUnit] = useState<UnitId>("gb");
	const [baseMode, setBaseMode] = useState<BaseMode>("decimal");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Storage planner state
	const [itemSize, setItemSize] = useState<string>("5");
	const [itemUnit, setItemUnit] = useState<UnitId>("mb");
	const [storageSize, setStorageSize] = useState<string>("64");
	const [storageUnit, setStorageUnit] = useState<UnitId>("gb");

	// Conversions to all units
	const conversions = useMemo(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value) || value < 0) return null;

		const bytes = toBytes(value, inputUnit, baseMode);

		return SIZE_UNITS.map((unit) => ({
			unit,
			value: fromBytes(bytes, unit.id, baseMode),
			abbrev: getAbbrev(unit, baseMode),
		}));
	}, [inputValue, inputUnit, baseMode]);

	// Storage planner calculation
	const storagePlanResult = useMemo(() => {
		const item = parseFloat(itemSize);
		const storage = parseFloat(storageSize);

		if (isNaN(item) || isNaN(storage) || item <= 0 || storage <= 0) return null;

		const itemBytes = toBytes(item, itemUnit, baseMode);
		const storageBytes = toBytes(storage, storageUnit, baseMode);
		const count = Math.floor(storageBytes / itemBytes);
		const usedBytes = count * itemBytes;
		const remainingBytes = storageBytes - usedBytes;
		const percentUsed = (usedBytes / storageBytes) * 100;

		return {
			count,
			percentUsed,
			remaining: formatBytesHuman(remainingBytes, baseMode),
		};
	}, [itemSize, itemUnit, storageSize, storageUnit, baseMode]);

	const copyToClipboard = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const copyAllResults = useCallback(() => {
		if (!conversions) return;
		const text = conversions.map((c) => `${formatNumber(c.value)} ${c.abbrev}`).join("\n");
		copyToClipboard(text, "all");
	}, [conversions, copyToClipboard]);

	return (
		<div className={styles.container}>
			{/* Unit Converter */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>File Size Converter</h2>

				{/* Base Mode Toggle */}
				<div className="flex items-center gap-3 mb-6">
					<span className={`text-sm font-medium ${baseMode === "binary" ? "text-white" : "opacity-50"}`}>
						Binary (1024)
					</span>
					<button
						onClick={() => setBaseMode(baseMode === "binary" ? "decimal" : "binary")}
						className={styles.toggleBtn}
						title="Toggle between binary and decimal"
					>
						<div className={`${styles.toggleTrack} ${baseMode === "decimal" ? styles.toggleActive : ""}`}>
							<div className={styles.toggleThumb} />
						</div>
					</button>
					<span className={`text-sm font-medium ${baseMode === "decimal" ? "text-white" : "opacity-50"}`}>
						Decimal (1000)
					</span>
				</div>

				{/* Input */}
				<div className="flex gap-3 mb-6">
					<input
						type="number"
						inputMode="decimal"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						className={styles.numberInput}
						placeholder="Enter value"
						min="0"
					/>
					<select
						value={inputUnit}
						onChange={(e) => setInputUnit(e.target.value as UnitId)}
						className={styles.unitSelect}
					>
						{SIZE_UNITS.map((unit) => (
							<option key={unit.id} value={unit.id}>
								{unit.name} ({getAbbrev(unit, baseMode)})
							</option>
						))}
					</select>
				</div>

				{/* Conversion Results */}
				{conversions && (
					<div className={styles.resultsGrid}>
						{conversions.map((c) => (
							<div
								key={c.unit.id}
								className={`${styles.resultItem} ${c.unit.id === inputUnit ? styles.resultItemActive : ""}`}
							>
								<span className={styles.resultLabel}>{c.abbrev}</span>
								<div className="flex items-center gap-2">
									<span className={styles.resultValue}>{formatNumber(c.value)}</span>
									<button
										className={`${styles.copyBtnSmall} ${copiedField === c.unit.id ? styles.copied : ""}`}
										onClick={() => copyToClipboard(formatNumber(c.value), c.unit.id)}
										title={`Copy ${c.abbrev} value`}
									>
										{copiedField === c.unit.id ? (
											<CheckIcon className="w-3.5 h-3.5" />
										) : (
											<ClipboardDocumentIcon className="w-3.5 h-3.5" />
										)}
									</button>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Copy All */}
				<div className="flex justify-end mt-4">
					<button className={styles.copyAllBtn} onClick={copyAllResults}>
						{copiedField === "all" ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied!
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="w-4 h-4" />
								Copy All
							</>
						)}
					</button>
				</div>
			</div>

			{/* Storage Planner */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>
					<CalculatorIcon className="w-5 h-5 inline mr-2" />
					Storage Planner
				</h3>
				<p className={styles.chartSubtitle}>How many items fit in a given storage space?</p>

				<div className={styles.plannerGrid}>
					{/* Item size */}
					<div className="flex flex-col gap-2">
						<label className={styles.inputLabel}>Item Size</label>
						<div className="flex gap-2">
							<input
								type="number"
								inputMode="decimal"
								value={itemSize}
								onChange={(e) => setItemSize(e.target.value)}
								className={styles.numberInput}
								placeholder="Size"
								min="0"
							/>
							<select
								value={itemUnit}
								onChange={(e) => setItemUnit(e.target.value as UnitId)}
								className={styles.unitSelectSmall}
							>
								{SIZE_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{getAbbrev(unit, baseMode)}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Arrow */}
					<div className="flex items-end justify-center pb-3">
						<ArrowsRightLeftIcon className="w-5 h-5 opacity-40" />
					</div>

					{/* Storage size */}
					<div className="flex flex-col gap-2">
						<label className={styles.inputLabel}>Storage Capacity</label>
						<div className="flex gap-2">
							<input
								type="number"
								inputMode="decimal"
								value={storageSize}
								onChange={(e) => setStorageSize(e.target.value)}
								className={styles.numberInput}
								placeholder="Size"
								min="0"
							/>
							<select
								value={storageUnit}
								onChange={(e) => setStorageUnit(e.target.value as UnitId)}
								className={styles.unitSelectSmall}
							>
								{SIZE_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{getAbbrev(unit, baseMode)}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Result */}
				{storagePlanResult && (
					<div className={styles.plannerResult}>
						<div className={styles.plannerCount}>
							<span className={styles.plannerCountNumber}>
								{storagePlanResult.count.toLocaleString()}
							</span>
							<span className={styles.plannerCountLabel}>items fit</span>
						</div>
						<div className={styles.plannerMeta}>
							<div className={styles.plannerBar}>
								<div
									className={styles.plannerBarFill}
									style={{ width: `${Math.min(storagePlanResult.percentUsed, 100)}%` }}
								/>
							</div>
							<span className={styles.plannerMetaText}>
								{storagePlanResult.percentUsed.toFixed(1)}% used &middot; {storagePlanResult.remaining} remaining
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Common File Size References */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>
					<InformationCircleIcon className="w-5 h-5 inline mr-2" />
					Common File Sizes
				</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Type</th>
								<th>Typical Size</th>
								<th>In Bytes</th>
							</tr>
						</thead>
						<tbody>
							{COMMON_FILE_REFERENCES.map((ref, i) => (
								<tr key={i}>
									<td>{ref.label}</td>
									<td className={styles.boldCell}>{ref.size}</td>
									<td className={styles.mutedCell}>{ref.bytes.toLocaleString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Binary vs Decimal</h4>
						<p>
							Hard drive manufacturers use decimal (1 GB = 1,000,000,000 bytes).
							Operating systems typically use binary (1 GiB = 1,073,741,824 bytes).
							This is why your 500 GB drive shows ~465 GiB.
						</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Storage Labels</h4>
						<p>
							IEC standard uses KiB, MiB, GiB for binary (1024-based) and KB, MB, GB for decimal (1000-based).
							Most software still uses KB/MB/GB for both, which can be confusing.
						</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Cloud Storage</h4>
						<p>
							Free tiers: Google Drive 15 GB, iCloud 5 GB, OneDrive 5 GB, Dropbox 2 GB.
							Photos and videos are usually the biggest space consumers.
						</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Memory vs Storage</h4>
						<p>
							RAM (memory) is measured the same way but is much faster and more expensive.
							8 GB RAM is common for laptops; 256 GB-1 TB is typical for storage.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

// --- Utility used in component ---

function formatBytesHuman(bytes: number, mode: BaseMode): string {
	if (bytes === 0) return "0 B";
	const base = getBase(mode);
	const units = SIZE_UNITS;
	let unitIndex = 0;
	let value = bytes;

	while (value >= base && unitIndex < units.length - 1) {
		value /= base;
		unitIndex++;
	}

	const abbrev = getAbbrev(units[unitIndex], mode);
	return `${formatNumber(value)} ${abbrev}`;
}
