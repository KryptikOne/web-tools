"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowsRightLeftIcon, ClipboardDocumentIcon, CheckIcon, LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import styles from "./AspectRatioCalculator.module.scss";

interface AspectRatio {
	name: string;
	ratio: string;
	width: number;
	height: number;
	use: string;
}

const COMMON_RATIOS: AspectRatio[] = [
	{ name: "Square", ratio: "1:1", width: 1, height: 1, use: "Social media, profile pics" },
	{ name: "Classic TV", ratio: "4:3", width: 4, height: 3, use: "Old TVs, presentations" },
	{ name: "Photo", ratio: "3:2", width: 3, height: 2, use: "35mm film, DSLR photos" },
	{ name: "Widescreen", ratio: "16:9", width: 16, height: 9, use: "HD video, monitors" },
	{ name: "Ultrawide", ratio: "21:9", width: 21, height: 9, use: "Ultrawide monitors, cinema" },
	{ name: "Super Ultrawide", ratio: "32:9", width: 32, height: 9, use: "Super ultrawide monitors" },
	{ name: "Cinema", ratio: "2.39:1", width: 2.39, height: 1, use: "Anamorphic widescreen" },
	{ name: "IMAX", ratio: "1.43:1", width: 1.43, height: 1, use: "IMAX film format" },
	{ name: "Portrait Photo", ratio: "2:3", width: 2, height: 3, use: "Portrait orientation" },
	{ name: "Instagram Portrait", ratio: "4:5", width: 4, height: 5, use: "Instagram portrait posts" },
	{ name: "Instagram Story", ratio: "9:16", width: 9, height: 16, use: "Stories, Reels, TikTok" },
	{ name: "A4 Paper", ratio: "1:1.414", width: 1, height: 1.414, use: "A-series paper (ISO 216)" },
];

const RESOLUTION_PRESETS = [
	{ name: "HD (720p)", width: 1280, height: 720, ratio: "16:9" },
	{ name: "Full HD (1080p)", width: 1920, height: 1080, ratio: "16:9" },
	{ name: "2K (QHD)", width: 2560, height: 1440, ratio: "16:9" },
	{ name: "4K (UHD)", width: 3840, height: 2160, ratio: "16:9" },
	{ name: "8K (UHD)", width: 7680, height: 4320, ratio: "16:9" },
	{ name: "Instagram Square", width: 1080, height: 1080, ratio: "1:1" },
	{ name: "Instagram Portrait", width: 1080, height: 1350, ratio: "4:5" },
	{ name: "Instagram Story", width: 1080, height: 1920, ratio: "9:16" },
	{ name: "Twitter Post", width: 1200, height: 675, ratio: "16:9" },
	{ name: "Facebook Cover", width: 820, height: 312, ratio: "2.63:1" },
	{ name: "YouTube Thumbnail", width: 1280, height: 720, ratio: "16:9" },
	{ name: "LinkedIn Banner", width: 1584, height: 396, ratio: "4:1" },
];

function gcd(a: number, b: number): number {
	a = Math.abs(Math.round(a));
	b = Math.abs(Math.round(b));
	while (b) {
		const t = b;
		b = a % b;
		a = t;
	}
	return a;
}

function simplifyRatio(width: number, height: number): string {
	if (width <= 0 || height <= 0) return "—";
	const divisor = gcd(width, height);
	const w = Math.round(width / divisor);
	const h = Math.round(height / divisor);
	// If numbers are too large, show decimal ratio
	if (w > 100 || h > 100) {
		const decimal = width / height;
		return `${decimal.toFixed(2)}:1`;
	}
	return `${w}:${h}`;
}

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(2).replace(/\.?0+$/, "");
}

export default function AspectRatioCalculator() {
	const [width, setWidth] = useState<string>("1920");
	const [height, setHeight] = useState<string>("1080");
	const [lockedDimension, setLockedDimension] = useState<"width" | "height" | null>(null);
	const [copiedCell, setCopiedCell] = useState<string | null>(null);

	// Calculate derived values
	const widthNum = parseFloat(width) || 0;
	const heightNum = parseFloat(height) || 0;
	const ratio = simplifyRatio(widthNum, heightNum);
	const decimalRatio = heightNum > 0 ? (widthNum / heightNum).toFixed(4) : "—";
	const pixels = widthNum > 0 && heightNum > 0 ? (widthNum * heightNum).toLocaleString() : "—";
	const megapixels = widthNum > 0 && heightNum > 0 ? ((widthNum * heightNum) / 1000000).toFixed(2) : "—";

	const applyRatio = useCallback((ratioWidth: number, ratioHeight: number) => {
		if (lockedDimension === "width" && widthNum > 0) {
			const newHeight = Math.round(widthNum / (ratioWidth / ratioHeight));
			setHeight(newHeight.toString());
		} else if (lockedDimension === "height" && heightNum > 0) {
			const newWidth = Math.round(heightNum * (ratioWidth / ratioHeight));
			setWidth(newWidth.toString());
		} else {
			// Default: keep width, calculate height
			if (widthNum > 0) {
				const newHeight = Math.round(widthNum / (ratioWidth / ratioHeight));
				setHeight(newHeight.toString());
			}
		}
	}, [lockedDimension, widthNum, heightNum]);

	const applyPreset = useCallback((presetWidth: number, presetHeight: number) => {
		setWidth(presetWidth.toString());
		setHeight(presetHeight.toString());
	}, []);

	const swapDimensions = () => {
		const temp = width;
		setWidth(height);
		setHeight(temp);
	};

	const handleWidthChange = (value: string) => {
		setWidth(value);
		if (lockedDimension === "height" && heightNum > 0 && ratio !== "—") {
			// Maintain ratio when height is locked
			const [rw, rh] = ratio.split(":").map(parseFloat);
			if (rw && rh) {
				const newHeight = Math.round(parseFloat(value) / (rw / rh));
				if (!isNaN(newHeight) && newHeight > 0) {
					setHeight(newHeight.toString());
				}
			}
		}
	};

	const handleHeightChange = (value: string) => {
		setHeight(value);
		if (lockedDimension === "width" && widthNum > 0 && ratio !== "—") {
			// Maintain ratio when width is locked
			const [rw, rh] = ratio.split(":").map(parseFloat);
			if (rw && rh) {
				const newWidth = Math.round(parseFloat(value) * (rw / rh));
				if (!isNaN(newWidth) && newWidth > 0) {
					setWidth(newWidth.toString());
				}
			}
		}
	};

	const copyToClipboard = async (text: string, cellId: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCell(cellId);
			setTimeout(() => setCopiedCell(null), 1500);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div className={styles.container}>
			{/* Calculator Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Aspect Ratio Calculator</h2>

				{/* Dimension Inputs */}
				<div className={styles.calculatorGrid}>
					<div className={styles.dimensionInput}>
						<div className={styles.inputHeader}>
							<label className={styles.inputLabel}>Width</label>
							<button
								className={`${styles.lockButton} ${lockedDimension === "width" ? styles.locked : ""}`}
								onClick={() => setLockedDimension(lockedDimension === "width" ? null : "width")}
								title={lockedDimension === "width" ? "Unlock width" : "Lock width"}
							>
								{lockedDimension === "width" ? (
									<LockClosedIcon className="w-4 h-4" />
								) : (
									<LockOpenIcon className="w-4 h-4" />
								)}
							</button>
						</div>
						<div className={styles.inputRow}>
							<input
								type="number"
								inputMode="numeric"
								value={width}
								onChange={(e) => handleWidthChange(e.target.value)}
								className={styles.numberInput}
								placeholder="Width"
							/>
							<span className={styles.unitLabel}>px</span>
						</div>
					</div>

					<button className={styles.swapButton} onClick={swapDimensions} title="Swap dimensions">
						<ArrowsRightLeftIcon className="w-5 h-5" />
					</button>

					<div className={styles.dimensionInput}>
						<div className={styles.inputHeader}>
							<label className={styles.inputLabel}>Height</label>
							<button
								className={`${styles.lockButton} ${lockedDimension === "height" ? styles.locked : ""}`}
								onClick={() => setLockedDimension(lockedDimension === "height" ? null : "height")}
								title={lockedDimension === "height" ? "Unlock height" : "Lock height"}
							>
								{lockedDimension === "height" ? (
									<LockClosedIcon className="w-4 h-4" />
								) : (
									<LockOpenIcon className="w-4 h-4" />
								)}
							</button>
						</div>
						<div className={styles.inputRow}>
							<input
								type="number"
								inputMode="numeric"
								value={height}
								onChange={(e) => handleHeightChange(e.target.value)}
								className={styles.numberInput}
								placeholder="Height"
							/>
							<span className={styles.unitLabel}>px</span>
						</div>
					</div>
				</div>

				{/* Results */}
				<div className={styles.resultsGrid}>
					<div className={styles.resultCard} onClick={() => copyToClipboard(ratio, "ratio")}>
						<span className={styles.resultLabel}>Aspect Ratio</span>
						<span className={styles.resultValue}>{ratio}</span>
						{copiedCell === "ratio" && <CheckIcon className={styles.copiedIcon} />}
					</div>
					<div className={styles.resultCard} onClick={() => copyToClipboard(decimalRatio, "decimal")}>
						<span className={styles.resultLabel}>Decimal Ratio</span>
						<span className={styles.resultValue}>{decimalRatio}</span>
						{copiedCell === "decimal" && <CheckIcon className={styles.copiedIcon} />}
					</div>
					<div className={styles.resultCard} onClick={() => copyToClipboard(pixels, "pixels")}>
						<span className={styles.resultLabel}>Total Pixels</span>
						<span className={styles.resultValue}>{pixels}</span>
						{copiedCell === "pixels" && <CheckIcon className={styles.copiedIcon} />}
					</div>
					<div className={styles.resultCard} onClick={() => copyToClipboard(`${megapixels} MP`, "mp")}>
						<span className={styles.resultLabel}>Megapixels</span>
						<span className={styles.resultValue}>{megapixels} MP</span>
						{copiedCell === "mp" && <CheckIcon className={styles.copiedIcon} />}
					</div>
				</div>

				{/* Copy Full Dimensions */}
				{widthNum > 0 && heightNum > 0 && (
					<div className={styles.copyDimensions}>
						<button
							className={styles.copyBtn}
							onClick={() => copyToClipboard(`${width}x${height}`, "dimensions")}
						>
							{copiedCell === "dimensions" ? (
								<CheckIcon className={styles.copyIcon} />
							) : (
								<ClipboardDocumentIcon className={styles.copyIcon} />
							)}
							<span>Copy {width} × {height}</span>
						</button>
					</div>
				)}
			</div>

			{/* Common Aspect Ratios */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Common Aspect Ratios</h3>
				<p className={styles.chartSubtitle}>Click to apply ratio (keeps {lockedDimension || "width"} fixed)</p>
				<div className={styles.ratiosGrid}>
					{COMMON_RATIOS.map((item, i) => (
						<div
							key={i}
							className={`${styles.ratioCard} ${ratio === item.ratio ? styles.active : ""}`}
							onClick={() => applyRatio(item.width, item.height)}
						>
							<div className={styles.ratioPreview} style={{ aspectRatio: `${item.width}/${item.height}` }} />
							<div className={styles.ratioInfo}>
								<span className={styles.ratioName}>{item.name}</span>
								<span className={styles.ratioValue}>{item.ratio}</span>
								<span className={styles.ratioUse}>{item.use}</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Resolution Presets */}
			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Resolution Presets</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Name</th>
								<th>Dimensions</th>
								<th>Ratio</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{RESOLUTION_PRESETS.map((preset, i) => (
								<tr key={i}>
									<td>{preset.name}</td>
									<td className={styles.monoCell}>{preset.width} × {preset.height}</td>
									<td>{preset.ratio}</td>
									<td>
										<button
											className={styles.applyBtn}
											onClick={() => applyPreset(preset.width, preset.height)}
										>
											Apply
										</button>
									</td>
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
						<h4>Lock Dimensions</h4>
						<p>Click the lock icon to fix width or height, then select a ratio to calculate the other dimension automatically.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>16:9 Standard</h4>
						<p>16:9 is the most common aspect ratio for modern displays, video, and streaming platforms.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Social Media</h4>
						<p>Use 1:1 for feed posts, 4:5 for portrait posts, and 9:16 for Stories/Reels/TikTok.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Print vs Screen</h4>
						<p>Photos are often 3:2 or 4:3, while screens are typically 16:9. Cropping may be needed when converting.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
