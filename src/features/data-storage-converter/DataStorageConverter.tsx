"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./DataStorageConverter.module.scss";

type BaseMode = "binary" | "decimal";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	binaryMultiplier: number; // Base 1024
	decimalMultiplier: number; // Base 1000
}

// Storage units (base: bytes)
const STORAGE_UNITS: ConversionUnit[] = [
	{ id: "b", name: "Bytes", abbrev: "B", binaryMultiplier: 1, decimalMultiplier: 1 },
	{ id: "kb", name: "Kilobytes", abbrev: "KB", binaryMultiplier: 1024, decimalMultiplier: 1000 },
	{ id: "mb", name: "Megabytes", abbrev: "MB", binaryMultiplier: 1024 ** 2, decimalMultiplier: 1000 ** 2 },
	{ id: "gb", name: "Gigabytes", abbrev: "GB", binaryMultiplier: 1024 ** 3, decimalMultiplier: 1000 ** 3 },
	{ id: "tb", name: "Terabytes", abbrev: "TB", binaryMultiplier: 1024 ** 4, decimalMultiplier: 1000 ** 4 },
	{ id: "pb", name: "Petabytes", abbrev: "PB", binaryMultiplier: 1024 ** 5, decimalMultiplier: 1000 ** 5 },
	{ id: "kib", name: "Kibibytes", abbrev: "KiB", binaryMultiplier: 1024, decimalMultiplier: 1024 },
	{ id: "mib", name: "Mebibytes", abbrev: "MiB", binaryMultiplier: 1024 ** 2, decimalMultiplier: 1024 ** 2 },
	{ id: "gib", name: "Gibibytes", abbrev: "GiB", binaryMultiplier: 1024 ** 3, decimalMultiplier: 1024 ** 3 },
	{ id: "tib", name: "Tebibytes", abbrev: "TiB", binaryMultiplier: 1024 ** 4, decimalMultiplier: 1024 ** 4 },
];

const STORAGE_COMPARISON = [
	{ name: "1 TB HDD (advertised)", binary: "931.32 GiB", decimal: "1,000 GB", note: "Marketing uses decimal" },
	{ name: "256 GB SSD (advertised)", binary: "238.42 GiB", decimal: "256 GB", note: "~7% less usable" },
	{ name: "16 GB RAM", binary: "16 GiB", decimal: "17.18 GB", note: "RAM uses binary" },
	{ name: "4.7 GB DVD", binary: "4.38 GiB", decimal: "4.7 GB", note: "Optical uses decimal" },
];

const FILE_SIZE_ESTIMATES = [
	{ type: "Text document (1 page)", size: "~10 KB" },
	{ type: "MP3 song (4 min)", size: "~4 MB" },
	{ type: "FLAC song (4 min)", size: "~30 MB" },
	{ type: "Photo (12 MP JPEG)", size: "~4 MB" },
	{ type: "Photo (RAW)", size: "~25 MB" },
	{ type: "HD Video (1 min, 1080p)", size: "~150 MB" },
	{ type: "4K Video (1 min)", size: "~400 MB" },
	{ type: "Mobile app", size: "~50-200 MB" },
	{ type: "PC game", size: "~50-100 GB" },
	{ type: "Operating system", size: "~20-50 GB" },
];

const STORAGE_CAPACITY_EXAMPLES = [
	{ capacity: "64 GB", songs: "~16,000", photos: "~16,000", hdVideo: "~7 hrs" },
	{ capacity: "128 GB", songs: "~32,000", photos: "~32,000", hdVideo: "~14 hrs" },
	{ capacity: "256 GB", songs: "~64,000", photos: "~64,000", hdVideo: "~28 hrs" },
	{ capacity: "512 GB", songs: "~128,000", photos: "~128,000", hdVideo: "~57 hrs" },
	{ capacity: "1 TB", songs: "~250,000", photos: "~250,000", hdVideo: "~111 hrs" },
	{ capacity: "2 TB", songs: "~500,000", photos: "~500,000", hdVideo: "~222 hrs" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function DataStorageConverter() {
	const [fromUnit, setFromUnit] = useState<string>("gb");
	const [toUnit, setToUnit] = useState<string>("mb");
	const [inputValue, setInputValue] = useState<string>("1");
	const [baseMode, setBaseMode] = useState<BaseMode>("binary");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = STORAGE_UNITS.find((u) => u.id === fromUnit);
		const to = STORAGE_UNITS.find((u) => u.id === toUnit);

		if (!from || !to) return "";

		const fromMultiplier = baseMode === "binary" ? from.binaryMultiplier : from.decimalMultiplier;
		const toMultiplier = baseMode === "binary" ? to.binaryMultiplier : to.decimalMultiplier;

		const bytes = value * fromMultiplier;
		const result = bytes / toMultiplier;

		return formatNumber(result);
	}, [inputValue, fromUnit, toUnit, baseMode]);

	const swapUnits = () => {
		const temp = fromUnit;
		setFromUnit(toUnit);
		setToUnit(temp);
	};

	const result = convert();

	return (
		<div className={styles.container}>
			{/* Converter Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Data Storage Converter</h2>

				{/* Base Mode Toggle */}
				<div className={styles.modeToggle}>
					<button
						className={`${styles.modeBtn} ${baseMode === "binary" ? styles.active : ""}`}
						onClick={() => setBaseMode("binary")}
					>
						Binary (1024)
					</button>
					<button
						className={`${styles.modeBtn} ${baseMode === "decimal" ? styles.active : ""}`}
						onClick={() => setBaseMode("decimal")}
					>
						Decimal (1000)
					</button>
				</div>
				<p className={styles.modeHint}>
					{baseMode === "binary"
						? "Binary: Used by operating systems, RAM (1 KB = 1,024 bytes)"
						: "Decimal: Used by storage manufacturers, networking (1 KB = 1,000 bytes)"}
				</p>

				{/* Converter Interface */}
				<div className={styles.converterGrid}>
					<div className={styles.converterInput}>
						<label className={styles.inputLabel}>From</label>
						<div className={styles.inputRow}>
							<input
								type="number"
								inputMode="decimal"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								className={styles.numberInput}
								placeholder="Enter value"
							/>
							<select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={styles.unitSelect}>
								{STORAGE_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>

					<button className={styles.swapButton} onClick={swapUnits} title="Swap units">
						<ArrowsRightLeftIcon className="w-5 h-5" />
					</button>

					<div className={styles.converterInput}>
						<label className={styles.inputLabel}>To</label>
						<div className={styles.inputRow}>
							<div className={styles.resultDisplay}>{result || "—"}</div>
							<select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={styles.unitSelect}>
								{STORAGE_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{result && (
					<div className={styles.resultSummary}>
						<span className={styles.resultText}>
							{inputValue} {STORAGE_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {STORAGE_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			{/* Binary vs Decimal Comparison */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Binary vs Decimal: Why Drives Seem Smaller</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Storage</th>
								<th>Binary (OS shows)</th>
								<th>Decimal (Marketed)</th>
								<th>Note</th>
							</tr>
						</thead>
						<tbody>
							{STORAGE_COMPARISON.map((row, i) => (
								<tr key={i}>
									<td>{row.name}</td>
									<td>{row.binary}</td>
									<td>{row.decimal}</td>
									<td className={styles.mutedCell}>{row.note}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Charts Grid */}
			<div className={styles.chartsGrid}>
				{/* File Size Estimates */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Common File Sizes</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>File Type</th>
									<th>Typical Size</th>
								</tr>
							</thead>
							<tbody>
								{FILE_SIZE_ESTIMATES.map((row, i) => (
									<tr key={i}>
										<td>{row.type}</td>
										<td>{row.size}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Storage Capacity Examples */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>How Much Can You Store?</h3>
					<p className={styles.chartSubtitle}>Approximate counts based on average file sizes</p>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Capacity</th>
									<th>Songs</th>
									<th>Photos</th>
									<th>HD Video</th>
								</tr>
							</thead>
							<tbody>
								{STORAGE_CAPACITY_EXAMPLES.map((row, i) => (
									<tr key={i}>
										<td className={styles.boldCell}>{row.capacity}</td>
										<td>{row.songs}</td>
										<td>{row.photos}</td>
										<td>{row.hdVideo}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Quick Tips */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Binary vs Decimal</h4>
						<p>1 GB (decimal) = 1,000 MB, but 1 GiB (binary) = 1,024 MiB. OS uses binary, manufacturers use decimal.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>The ~7% Difference</h4>
						<p>A &quot;1 TB&quot; drive shows as ~931 GB because: 1,000⁴ ÷ 1,024⁴ ≈ 0.909</p>
					</div>
					<div className={styles.tipCard}>
						<h4>IEC Units (KiB, MiB, GiB)</h4>
						<p>These unambiguous units always mean binary (1024-based). Use them for precision.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Quick Mental Math</h4>
						<p>1 GB ≈ 1 billion bytes. 1 TB ≈ 1 trillion bytes. Each step is roughly 1000× (decimal) or 1024× (binary).</p>
					</div>
				</div>
			</div>
		</div>
	);
}
