"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./DataStorageConverter.module.scss";

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

export default function DataStorageConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("data")!} initialUnitId="gb" initialValue="1" />
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
