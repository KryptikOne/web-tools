"use client";

import { useState, useCallback, useMemo } from "react";
import { ArrowsRightLeftIcon, ClockIcon } from "@heroicons/react/24/outline";
import styles from "./BandwidthCalculator.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	bitsPerSecond: number;
}

// Bandwidth units (base: bits per second)
const BANDWIDTH_UNITS: ConversionUnit[] = [
	{ id: "bps", name: "Bits per second", abbrev: "bps", bitsPerSecond: 1 },
	{ id: "kbps", name: "Kilobits per second", abbrev: "Kbps", bitsPerSecond: 1000 },
	{ id: "mbps", name: "Megabits per second", abbrev: "Mbps", bitsPerSecond: 1000000 },
	{ id: "gbps", name: "Gigabits per second", abbrev: "Gbps", bitsPerSecond: 1000000000 },
	{ id: "Bps", name: "Bytes per second", abbrev: "B/s", bitsPerSecond: 8 },
	{ id: "kBps", name: "Kilobytes per second", abbrev: "KB/s", bitsPerSecond: 8000 },
	{ id: "mBps", name: "Megabytes per second", abbrev: "MB/s", bitsPerSecond: 8000000 },
	{ id: "gBps", name: "Gigabytes per second", abbrev: "GB/s", bitsPerSecond: 8000000000 },
];

// File size units for download calculator (in bytes)
const FILE_SIZES = [
	{ id: "mb", name: "Megabytes", abbrev: "MB", bytes: 1000000 },
	{ id: "gb", name: "Gigabytes", abbrev: "GB", bytes: 1000000000 },
	{ id: "tb", name: "Terabytes", abbrev: "TB", bytes: 1000000000000 },
];

const STREAMING_REQUIREMENTS = [
	{ quality: "Audio (Spotify Normal)", bitrate: "96 Kbps", perHour: "~43 MB" },
	{ quality: "Audio (Spotify High)", bitrate: "160 Kbps", perHour: "~72 MB" },
	{ quality: "Audio (Spotify Very High)", bitrate: "320 Kbps", perHour: "~144 MB" },
	{ quality: "SD Video (480p)", bitrate: "1.5 Mbps", perHour: "~0.7 GB" },
	{ quality: "HD Video (720p)", bitrate: "3 Mbps", perHour: "~1.4 GB" },
	{ quality: "Full HD (1080p)", bitrate: "5 Mbps", perHour: "~2.3 GB" },
	{ quality: "4K Ultra HD", bitrate: "25 Mbps", perHour: "~11 GB" },
	{ quality: "4K HDR", bitrate: "40 Mbps", perHour: "~18 GB" },
];

const COMMON_SPEEDS = [
	{ name: "3G Mobile", download: "1-5 Mbps", upload: "0.5-1 Mbps" },
	{ name: "4G LTE", download: "10-50 Mbps", upload: "5-20 Mbps" },
	{ name: "5G", download: "100-1000 Mbps", upload: "50-100 Mbps" },
	{ name: "Basic DSL", download: "5-15 Mbps", upload: "1-5 Mbps" },
	{ name: "Cable Internet", download: "25-300 Mbps", upload: "5-35 Mbps" },
	{ name: "Fiber (Basic)", download: "100-300 Mbps", upload: "100-300 Mbps" },
	{ name: "Fiber (Gigabit)", download: "1000 Mbps", upload: "1000 Mbps" },
	{ name: "Fiber (Multi-Gig)", download: "2000-5000 Mbps", upload: "2000-5000 Mbps" },
];

const BITS_VS_BYTES = [
	{ speed: "100 Mbps", bitsNotation: "100 Mbps", bytesNotation: "12.5 MB/s", note: "Divide by 8" },
	{ speed: "1 Gbps", bitsNotation: "1,000 Mbps", bytesNotation: "125 MB/s", note: "Gigabit internet" },
	{ speed: "10 Gbps", bitsNotation: "10,000 Mbps", bytesNotation: "1.25 GB/s", note: "Data center" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

function formatDuration(seconds: number): string {
	if (seconds < 1) return "< 1 second";
	if (seconds < 60) return `${Math.round(seconds)} second${Math.round(seconds) !== 1 ? "s" : ""}`;
	if (seconds < 3600) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.round(seconds % 60);
		return secs > 0 ? `${mins} min ${secs} sec` : `${mins} minute${mins !== 1 ? "s" : ""}`;
	}
	if (seconds < 86400) {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.round((seconds % 3600) / 60);
		return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hour${hours !== 1 ? "s" : ""}`;
	}
	const days = Math.floor(seconds / 86400);
	const hours = Math.round((seconds % 86400) / 3600);
	return hours > 0 ? `${days} day${days !== 1 ? "s" : ""} ${hours} hr` : `${days} day${days !== 1 ? "s" : ""}`;
}

export default function BandwidthCalculator() {
	const [fromUnit, setFromUnit] = useState<string>("mbps");
	const [toUnit, setToUnit] = useState<string>("mBps");
	const [inputValue, setInputValue] = useState<string>("100");

	// Download time calculator state
	const [fileSize, setFileSize] = useState<string>("1");
	const [fileSizeUnit, setFileSizeUnit] = useState<string>("gb");
	const [downloadSpeed, setDownloadSpeed] = useState<string>("100");
	const [downloadSpeedUnit, setDownloadSpeedUnit] = useState<string>("mbps");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = BANDWIDTH_UNITS.find((u) => u.id === fromUnit);
		const to = BANDWIDTH_UNITS.find((u) => u.id === toUnit);

		if (!from || !to) return "";

		const bps = value * from.bitsPerSecond;
		const result = bps / to.bitsPerSecond;

		return formatNumber(result);
	}, [inputValue, fromUnit, toUnit]);

	const downloadTime = useMemo(() => {
		const size = parseFloat(fileSize);
		const speed = parseFloat(downloadSpeed);

		if (isNaN(size) || isNaN(speed) || size <= 0 || speed <= 0) return null;

		const sizeUnit = FILE_SIZES.find((u) => u.id === fileSizeUnit);
		const speedUnit = BANDWIDTH_UNITS.find((u) => u.id === downloadSpeedUnit);

		if (!sizeUnit || !speedUnit) return null;

		const totalBytes = size * sizeUnit.bytes;
		const bytesPerSecond = (speed * speedUnit.bitsPerSecond) / 8;
		const seconds = totalBytes / bytesPerSecond;

		return {
			seconds,
			formatted: formatDuration(seconds),
		};
	}, [fileSize, fileSizeUnit, downloadSpeed, downloadSpeedUnit]);

	const swapUnits = () => {
		const temp = fromUnit;
		setFromUnit(toUnit);
		setToUnit(temp);
	};

	const result = convert();

	return (
		<div className={styles.container}>
			{/* Bandwidth Converter Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Bandwidth Converter</h2>

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
								{BANDWIDTH_UNITS.map((unit) => (
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
								{BANDWIDTH_UNITS.map((unit) => (
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
							{inputValue} {BANDWIDTH_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {BANDWIDTH_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			{/* Download Time Calculator */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>
					<ClockIcon className="w-5 h-5 inline mr-2" />
					Download Time Calculator
				</h3>

				<div className={styles.downloadCalcGrid}>
					<div className={styles.calcInput}>
						<label className={styles.inputLabel}>File Size</label>
						<div className={styles.inputRow}>
							<input
								type="number"
								inputMode="decimal"
								value={fileSize}
								onChange={(e) => setFileSize(e.target.value)}
								className={styles.numberInput}
								placeholder="Size"
							/>
							<select value={fileSizeUnit} onChange={(e) => setFileSizeUnit(e.target.value)} className={styles.unitSelectSmall}>
								{FILE_SIZES.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.abbrev}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className={styles.calcInput}>
						<label className={styles.inputLabel}>Connection Speed</label>
						<div className={styles.inputRow}>
							<input
								type="number"
								inputMode="decimal"
								value={downloadSpeed}
								onChange={(e) => setDownloadSpeed(e.target.value)}
								className={styles.numberInput}
								placeholder="Speed"
							/>
							<select value={downloadSpeedUnit} onChange={(e) => setDownloadSpeedUnit(e.target.value)} className={styles.unitSelectSmall}>
								{BANDWIDTH_UNITS.slice(0, 4).map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.abbrev}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className={styles.calcResult}>
						<label className={styles.inputLabel}>Download Time</label>
						<div className={styles.timeResult}>
							{downloadTime ? downloadTime.formatted : "—"}
						</div>
					</div>
				</div>
			</div>

			{/* Bits vs Bytes */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Bits vs Bytes: ISP vs Real Speed</h3>
				<p className={styles.chartSubtitle}>ISPs advertise in Mbps (bits), but downloads show MB/s (bytes). Divide by 8!</p>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Advertised</th>
								<th>In Bits</th>
								<th>Actual Download</th>
								<th>Note</th>
							</tr>
						</thead>
						<tbody>
							{BITS_VS_BYTES.map((row, i) => (
								<tr key={i}>
									<td className={styles.boldCell}>{row.speed}</td>
									<td>{row.bitsNotation}</td>
									<td>{row.bytesNotation}</td>
									<td className={styles.mutedCell}>{row.note}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Reference Charts */}
			<div className={styles.chartsGrid}>
				{/* Streaming Requirements */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Streaming Requirements</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Quality</th>
									<th>Bitrate</th>
									<th>Per Hour</th>
								</tr>
							</thead>
							<tbody>
								{STREAMING_REQUIREMENTS.map((row, i) => (
									<tr key={i}>
										<td>{row.quality}</td>
										<td>{row.bitrate}</td>
										<td className={styles.mutedCell}>{row.perHour}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Common Connection Speeds */}
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Common Connection Speeds</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Type</th>
									<th>Download</th>
									<th>Upload</th>
								</tr>
							</thead>
							<tbody>
								{COMMON_SPEEDS.map((row, i) => (
									<tr key={i}>
										<td>{row.name}</td>
										<td>{row.download}</td>
										<td>{row.upload}</td>
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
						<h4>Mbps vs MB/s</h4>
						<p>ISPs use Mbps (megabits). Downloads show MB/s (megabytes). 100 Mbps = 12.5 MB/s. Always divide by 8!</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Bandwidth vs Throughput</h4>
						<p>Bandwidth is max capacity. Actual throughput is usually 70-90% due to overhead and congestion.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>4K Streaming</h4>
						<p>Netflix recommends 25 Mbps for 4K. For multiple streams, multiply by number of devices.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Upload Matters Too</h4>
						<p>Video calls need 3-4 Mbps upload. Cloud backup and streaming yourself needs good upload speed.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
