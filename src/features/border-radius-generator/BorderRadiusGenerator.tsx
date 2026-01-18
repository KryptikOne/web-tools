"use client";

import { useState, useCallback } from "react";
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon, LinkIcon } from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./BorderRadiusGenerator.module.scss";

interface CornerRadius {
	topLeft: number;
	topRight: number;
	bottomRight: number;
	bottomLeft: number;
}

const PRESETS = [
	{ name: "None", value: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 } },
	{ name: "Small", value: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 } },
	{ name: "Medium", value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
	{ name: "Large", value: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 } },
	{ name: "XL", value: { topLeft: 24, topRight: 24, bottomRight: 24, bottomLeft: 24 } },
	{ name: "Full", value: { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999 } },
	{ name: "Pill Left", value: { topLeft: 9999, topRight: 0, bottomRight: 0, bottomLeft: 9999 } },
	{ name: "Pill Right", value: { topLeft: 0, topRight: 9999, bottomRight: 9999, bottomLeft: 0 } },
	{ name: "Top Only", value: { topLeft: 16, topRight: 16, bottomRight: 0, bottomLeft: 0 } },
	{ name: "Bottom Only", value: { topLeft: 0, topRight: 0, bottomRight: 16, bottomLeft: 16 } },
	{ name: "Diagonal 1", value: { topLeft: 24, topRight: 0, bottomRight: 24, bottomLeft: 0 } },
	{ name: "Diagonal 2", value: { topLeft: 0, topRight: 24, bottomRight: 0, bottomLeft: 24 } },
];

export default function BorderRadiusGenerator() {
	const [radius, setRadius] = useState<CornerRadius>({
		topLeft: 16,
		topRight: 16,
		bottomRight: 16,
		bottomLeft: 16,
	});
	const [linked, setLinked] = useState(true);
	const [unit, setUnit] = useState<"px" | "%" | "rem" | "em">("px");
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [previewSize, setPreviewSize] = useState({ width: 200, height: 150 });
	const [previewColor, setPreviewColor] = useState("#b5fe67");

	const formatValue = useCallback(
		(value: number): string => {
			if (unit === "rem" || unit === "em") {
				return `${(value / 16).toFixed(2)}${unit}`;
			}
			return `${value}${unit}`;
		},
		[unit]
	);

	const getCssValue = useCallback((): string => {
		const { topLeft, topRight, bottomRight, bottomLeft } = radius;

		// Check if all corners are the same
		if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
			return formatValue(topLeft);
		}

		// Check if we can use shorthand (top-left/bottom-right and top-right/bottom-left)
		if (topLeft === bottomRight && topRight === bottomLeft) {
			return `${formatValue(topLeft)} ${formatValue(topRight)}`;
		}

		// Check if we can use 3-value shorthand
		if (topRight === bottomLeft) {
			return `${formatValue(topLeft)} ${formatValue(topRight)} ${formatValue(bottomRight)}`;
		}

		// Full 4-value notation
		return `${formatValue(topLeft)} ${formatValue(topRight)} ${formatValue(bottomRight)} ${formatValue(bottomLeft)}`;
	}, [radius, formatValue]);

	const getCssCode = useCallback((): string => {
		return `border-radius: ${getCssValue()};`;
	}, [getCssValue]);

	const handleRadiusChange = (corner: keyof CornerRadius, value: number) => {
		if (linked) {
			setRadius({
				topLeft: value,
				topRight: value,
				bottomRight: value,
				bottomLeft: value,
			});
		} else {
			setRadius((prev) => ({
				...prev,
				[corner]: value,
			}));
		}
	};

	const applyPreset = (preset: (typeof PRESETS)[0]) => {
		setRadius(preset.value);
		setLinked(preset.value.topLeft === preset.value.topRight && preset.value.topRight === preset.value.bottomRight && preset.value.bottomRight === preset.value.bottomLeft);
	};

	const resetRadius = () => {
		setRadius({ topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 });
		setLinked(true);
	};

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const getPreviewStyle = (): React.CSSProperties => {
		return {
			width: previewSize.width,
			height: previewSize.height,
			background: previewColor,
			borderRadius: `${radius.topLeft}px ${radius.topRight}px ${radius.bottomRight}px ${radius.bottomLeft}px`,
		};
	};

	return (
		<div className={styles.container}>
			<div className={styles.mainGrid}>
				{/* Preview Section */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Preview</h2>
					<div className={styles.previewContainer}>
						<div className={styles.previewBox} style={getPreviewStyle()} />
					</div>

					<div className={styles.previewControls}>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Width</label>
							<input type="range" min="100" max="300" value={previewSize.width} onChange={(e) => setPreviewSize((prev) => ({ ...prev, width: parseInt(e.target.value) }))} className={styles.slider} />
							<span className={styles.valueLabel}>{previewSize.width}px</span>
						</div>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Height</label>
							<input type="range" min="50" max="250" value={previewSize.height} onChange={(e) => setPreviewSize((prev) => ({ ...prev, height: parseInt(e.target.value) }))} className={styles.slider} />
							<span className={styles.valueLabel}>{previewSize.height}px</span>
						</div>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Color</label>
							<ColorPickerPopover color={previewColor} onChange={setPreviewColor} swatchSize="sm" />
							<span className={styles.valueLabel}>{previewColor}</span>
						</div>
					</div>
				</div>

				{/* Controls Section */}
				<div className={styles.glassCard}>
					<div className={styles.controlsHeader}>
						<h2 className={styles.sectionTitle}>Border Radius</h2>
						<div className={styles.headerActions}>
							<button className={`${styles.linkBtn} ${linked ? styles.active : ""}`} onClick={() => setLinked(!linked)} title={linked ? "Unlink corners" : "Link corners"}>
								<LinkIcon className={styles.linkIcon} />
							</button>
							<button className={styles.resetBtn} onClick={resetRadius} title="Reset">
								<ArrowPathIcon className={styles.resetIcon} />
							</button>
						</div>
					</div>

					<div className={styles.unitSelector}>
						{(["px", "%", "rem", "em"] as const).map((u) => (
							<button key={u} className={`${styles.unitBtn} ${unit === u ? styles.active : ""}`} onClick={() => setUnit(u)}>
								{u}
							</button>
						))}
					</div>

					<div className={styles.cornersGrid}>
						<div className={styles.cornerControl}>
							<label className={styles.cornerLabel}>Top Left</label>
							<div className={styles.cornerInputRow}>
								<input type="range" min="0" max="100" value={radius.topLeft} onChange={(e) => handleRadiusChange("topLeft", parseInt(e.target.value))} className={styles.slider} />
								<input type="number" min="0" value={radius.topLeft} onChange={(e) => handleRadiusChange("topLeft", parseInt(e.target.value) || 0)} className={styles.numberInput} />
							</div>
						</div>

						<div className={styles.cornerControl}>
							<label className={styles.cornerLabel}>Top Right</label>
							<div className={styles.cornerInputRow}>
								<input type="range" min="0" max="100" value={radius.topRight} onChange={(e) => handleRadiusChange("topRight", parseInt(e.target.value))} className={styles.slider} />
								<input type="number" min="0" value={radius.topRight} onChange={(e) => handleRadiusChange("topRight", parseInt(e.target.value) || 0)} className={styles.numberInput} />
							</div>
						</div>

						<div className={styles.cornerControl}>
							<label className={styles.cornerLabel}>Bottom Left</label>
							<div className={styles.cornerInputRow}>
								<input type="range" min="0" max="100" value={radius.bottomLeft} onChange={(e) => handleRadiusChange("bottomLeft", parseInt(e.target.value))} className={styles.slider} />
								<input type="number" min="0" value={radius.bottomLeft} onChange={(e) => handleRadiusChange("bottomLeft", parseInt(e.target.value) || 0)} className={styles.numberInput} />
							</div>
						</div>

						<div className={styles.cornerControl}>
							<label className={styles.cornerLabel}>Bottom Right</label>
							<div className={styles.cornerInputRow}>
								<input type="range" min="0" max="100" value={radius.bottomRight} onChange={(e) => handleRadiusChange("bottomRight", parseInt(e.target.value))} className={styles.slider} />
								<input type="number" min="0" value={radius.bottomRight} onChange={(e) => handleRadiusChange("bottomRight", parseInt(e.target.value) || 0)} className={styles.numberInput} />
							</div>
						</div>
					</div>

					{/* CSS Output */}
					<div className={styles.outputSection}>
						<div className={styles.outputHeader}>
							<span className={styles.outputLabel}>CSS</span>
							<button className={`${styles.copyBtn} ${copiedField === "css" ? styles.copied : ""}`} onClick={() => copyToClipboard(getCssCode(), "css")} title="Copy to clipboard">
								{copiedField === "css" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<code className={styles.outputCode}>{getCssCode()}</code>
					</div>
				</div>
			</div>

			{/* Presets Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Presets</h2>
				<div className={styles.presetsGrid}>
					{PRESETS.map((preset) => (
						<button key={preset.name} className={styles.presetBtn} onClick={() => applyPreset(preset)}>
							<div
								className={styles.presetPreview}
								style={{
									borderRadius: `${preset.value.topLeft}px ${preset.value.topRight}px ${preset.value.bottomRight}px ${preset.value.bottomLeft}px`,
								}}
							/>
							<span className={styles.presetName}>{preset.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* Info Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>About Border Radius</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Shorthand Syntax</h3>
						<p className={styles.infoText}>
							<code>border-radius</code> accepts 1-4 values: one value applies to all corners, two values set top-left/bottom-right and top-right/bottom-left pairs, three values set top-left, horizontal pairs, and bottom-right, four values set each corner individually (clockwise from top-left).
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Units</h3>
						<p className={styles.infoText}>
							Use <code>px</code> for fixed sizes, <code>%</code> for responsive curves relative to the element size, and <code>rem</code>/<code>em</code> for scalable designs that respect user font preferences.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Pill Shapes</h3>
						<p className={styles.infoText}>Use a very large value (like 9999px or 50%) to create pill-shaped buttons or fully rounded elements. The browser caps the radius at half the element&apos;s smallest dimension.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Elliptical Corners</h3>
						<p className={styles.infoText}>
							For elliptical corners, use the syntax <code>border-radius: 10px / 20px</code>
							where the first value is horizontal radius and the second is vertical. This creates oval-shaped corners instead of circular ones.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
