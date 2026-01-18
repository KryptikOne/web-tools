"use client";

import { useState, useCallback } from "react";
import { ClipboardDocumentIcon, CheckIcon, PlusIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import styles from "./BoxShadowGenerator.module.scss";

interface Shadow {
	id: string;
	offsetX: number;
	offsetY: number;
	blur: number;
	spread: number;
	color: string;
	opacity: number;
	inset: boolean;
}

const DEFAULT_SHADOW: Omit<Shadow, "id"> = {
	offsetX: 0,
	offsetY: 10,
	blur: 30,
	spread: 0,
	color: "#000000",
	opacity: 25,
	inset: false,
};

const PRESETS = [
	{
		name: "Subtle",
		shadows: [{ ...DEFAULT_SHADOW, offsetY: 1, blur: 3, opacity: 10 }],
	},
	{
		name: "Medium",
		shadows: [{ ...DEFAULT_SHADOW, offsetY: 4, blur: 6, spread: -1, opacity: 15 }],
	},
	{
		name: "Large",
		shadows: [{ ...DEFAULT_SHADOW, offsetY: 10, blur: 15, spread: -3, opacity: 20 }],
	},
	{
		name: "Soft",
		shadows: [{ ...DEFAULT_SHADOW, offsetY: 25, blur: 50, spread: -12, opacity: 25 }],
	},
	{
		name: "Hard",
		shadows: [{ ...DEFAULT_SHADOW, offsetX: 5, offsetY: 5, blur: 0, opacity: 30 }],
	},
	{
		name: "Layered",
		shadows: [
			{ ...DEFAULT_SHADOW, offsetY: 1, blur: 2, opacity: 6 },
			{ ...DEFAULT_SHADOW, offsetY: 2, blur: 4, opacity: 6 },
			{ ...DEFAULT_SHADOW, offsetY: 5, blur: 10, opacity: 8 },
			{ ...DEFAULT_SHADOW, offsetY: 10, blur: 20, opacity: 10 },
		],
	},
	{
		name: "Glow",
		shadows: [{ ...DEFAULT_SHADOW, offsetY: 0, blur: 40, spread: 10, color: "#667eea", opacity: 50 }],
	},
	{
		name: "Inset",
		shadows: [{ ...DEFAULT_SHADOW, offsetY: 4, blur: 8, opacity: 20, inset: true }],
	},
	{
		name: "Float",
		shadows: [
			{ ...DEFAULT_SHADOW, offsetY: 20, blur: 25, spread: -5, opacity: 20 },
			{ ...DEFAULT_SHADOW, offsetY: 8, blur: 10, spread: -6, opacity: 15 },
		],
	},
	{
		name: "Neumorphism",
		shadows: [
			{ ...DEFAULT_SHADOW, offsetX: 10, offsetY: 10, blur: 20, color: "#000000", opacity: 15 },
			{ ...DEFAULT_SHADOW, offsetX: -10, offsetY: -10, blur: 20, color: "#ffffff", opacity: 80 },
		],
	},
	{
		name: "Sharp",
		shadows: [
			{ ...DEFAULT_SHADOW, offsetY: 0, blur: 0, spread: 1, opacity: 5 },
			{ ...DEFAULT_SHADOW, offsetY: 1, blur: 2, opacity: 6 },
			{ ...DEFAULT_SHADOW, offsetY: 6, blur: 12, spread: -2, opacity: 12 },
		],
	},
	{
		name: "3D Button",
		shadows: [
			{ ...DEFAULT_SHADOW, offsetY: 4, blur: 0, color: "#4a5568", opacity: 100 },
			{ ...DEFAULT_SHADOW, offsetY: 6, blur: 10, opacity: 20 },
		],
	},
];

export default function BoxShadowGenerator() {
	const [shadows, setShadows] = useState<Shadow[]>([{ ...DEFAULT_SHADOW, id: crypto.randomUUID() }]);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [previewBg, setPreviewBg] = useState("#ffffff");
	const [previewBoxBg, setPreviewBoxBg] = useState("#b5fe67");
	const [previewSize, setPreviewSize] = useState({ width: 200, height: 150 });
	const [previewRadius, setPreviewRadius] = useState(12);

	const generateId = () => crypto.randomUUID();

	const hexToRgba = (hex: string, opacity: number): string => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
	};

	const getShadowCss = useCallback((shadow: Shadow): string => {
		const { offsetX, offsetY, blur, spread, color, opacity, inset } = shadow;
		const rgba = hexToRgba(color, opacity);
		return `${inset ? "inset " : ""}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${rgba}`;
	}, []);

	const getFullCssValue = useCallback((): string => {
		return shadows.map(getShadowCss).join(", ");
	}, [shadows, getShadowCss]);

	const getCssCode = useCallback((): string => {
		return `box-shadow: ${getFullCssValue()};`;
	}, [getFullCssValue]);

	const updateShadow = (id: string, updates: Partial<Shadow>) => {
		setShadows((prev) => prev.map((shadow) => (shadow.id === id ? { ...shadow, ...updates } : shadow)));
	};

	const addShadow = () => {
		setShadows((prev) => [...prev, { ...DEFAULT_SHADOW, id: generateId() }]);
	};

	const removeShadow = (id: string) => {
		if (shadows.length > 1) {
			setShadows((prev) => prev.filter((shadow) => shadow.id !== id));
		}
	};

	const applyPreset = (preset: (typeof PRESETS)[0]) => {
		setShadows(preset.shadows.map((s) => ({ ...s, id: generateId() })));
	};

	const resetShadows = () => {
		setShadows([{ ...DEFAULT_SHADOW, id: generateId() }]);
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

	return (
		<div className={styles.container}>
			<div className={styles.mainGrid}>
				{/* Preview Section */}
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Preview</h2>
					<div className={styles.previewContainer} style={{ background: previewBg }}>
						<div
							className={styles.previewBox}
							style={{
								width: previewSize.width,
								height: previewSize.height,
								background: previewBoxBg,
								borderRadius: previewRadius,
								boxShadow: getFullCssValue(),
							}}
						/>
					</div>

					<div className={styles.previewControls}>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Background</label>
							<ColorPickerPopover color={previewBg} onChange={setPreviewBg} swatchSize="md" />
							<span className={styles.valueLabel}>{previewBg}</span>
						</div>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Box Color</label>
							<ColorPickerPopover color={previewBoxBg} onChange={setPreviewBoxBg} swatchSize="md" />
							<span className={styles.valueLabel}>{previewBoxBg}</span>
						</div>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Width</label>
							<input
								type="range"
								min="100"
								max="300"
								value={previewSize.width}
								onChange={(e) => setPreviewSize((prev) => ({ ...prev, width: parseInt(e.target.value) }))}
								className={styles.slider}
							/>
							<span className={styles.valueLabel}>{previewSize.width}px</span>
						</div>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Height</label>
							<input
								type="range"
								min="50"
								max="250"
								value={previewSize.height}
								onChange={(e) => setPreviewSize((prev) => ({ ...prev, height: parseInt(e.target.value) }))}
								className={styles.slider}
							/>
							<span className={styles.valueLabel}>{previewSize.height}px</span>
						</div>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Radius</label>
							<input type="range" min="0" max="100" value={previewRadius} onChange={(e) => setPreviewRadius(parseInt(e.target.value))} className={styles.slider} />
							<span className={styles.valueLabel}>{previewRadius}px</span>
						</div>
					</div>
				</div>

				{/* Controls Section */}
				<div className={styles.glassCard}>
					<div className={styles.controlsHeader}>
						<h2 className={styles.sectionTitle}>Shadow Layers</h2>
						<div className={styles.headerActions}>
							<button className={styles.addBtn} onClick={addShadow} title="Add shadow layer">
								<PlusIcon className={styles.btnIcon} />
								Add Layer
							</button>
							<button className={styles.resetBtn} onClick={resetShadows} title="Reset">
								<ArrowPathIcon className={styles.btnIcon} />
							</button>
						</div>
					</div>

					<div className={styles.shadowsList}>
						{shadows.map((shadow, index) => (
							<div key={shadow.id} className={styles.shadowItem}>
								<div className={styles.shadowHeader}>
									<span className={styles.shadowLabel}>Layer {index + 1}</span>
									<div className={styles.shadowActions}>
										<label className={styles.insetToggle}>
											<input type="checkbox" checked={shadow.inset} onChange={(e) => updateShadow(shadow.id, { inset: e.target.checked })} />
											<span>Inset</span>
										</label>
										{shadows.length > 1 && (
											<button className={styles.deleteBtn} onClick={() => removeShadow(shadow.id)} title="Remove layer">
												<TrashIcon className={styles.deleteIcon} />
											</button>
										)}
									</div>
								</div>

								<div className={styles.shadowControls}>
									<div className={styles.controlGroup}>
										<label>X Offset</label>
										<input
											type="range"
											min="-50"
											max="50"
											value={shadow.offsetX}
											onChange={(e) => updateShadow(shadow.id, { offsetX: parseInt(e.target.value) })}
											className={styles.slider}
										/>
										<input
											type="number"
											value={shadow.offsetX}
											onChange={(e) => updateShadow(shadow.id, { offsetX: parseInt(e.target.value) || 0 })}
											className={styles.numberInput}
										/>
									</div>

									<div className={styles.controlGroup}>
										<label>Y Offset</label>
										<input
											type="range"
											min="-50"
											max="50"
											value={shadow.offsetY}
											onChange={(e) => updateShadow(shadow.id, { offsetY: parseInt(e.target.value) })}
											className={styles.slider}
										/>
										<input
											type="number"
											value={shadow.offsetY}
											onChange={(e) => updateShadow(shadow.id, { offsetY: parseInt(e.target.value) || 0 })}
											className={styles.numberInput}
										/>
									</div>

									<div className={styles.controlGroup}>
										<label>Blur</label>
										<input
											type="range"
											min="0"
											max="100"
											value={shadow.blur}
											onChange={(e) => updateShadow(shadow.id, { blur: parseInt(e.target.value) })}
											className={styles.slider}
										/>
										<input
											type="number"
											min="0"
											value={shadow.blur}
											onChange={(e) => updateShadow(shadow.id, { blur: parseInt(e.target.value) || 0 })}
											className={styles.numberInput}
										/>
									</div>

									<div className={styles.controlGroup}>
										<label>Spread</label>
										<input
											type="range"
											min="-50"
											max="50"
											value={shadow.spread}
											onChange={(e) => updateShadow(shadow.id, { spread: parseInt(e.target.value) })}
											className={styles.slider}
										/>
										<input
											type="number"
											value={shadow.spread}
											onChange={(e) => updateShadow(shadow.id, { spread: parseInt(e.target.value) || 0 })}
											className={styles.numberInput}
										/>
									</div>

									<div className={styles.controlGroup}>
										<label>Opacity</label>
										<input
											type="range"
											min="0"
											max="100"
											value={shadow.opacity}
											onChange={(e) => updateShadow(shadow.id, { opacity: parseInt(e.target.value) })}
											className={styles.slider}
										/>
										<input
											type="number"
											min="0"
											max="100"
											value={shadow.opacity}
											onChange={(e) => updateShadow(shadow.id, { opacity: Math.min(100, parseInt(e.target.value) || 0) })}
											className={styles.numberInput}
										/>
									</div>

									<div className={styles.controlGroup}>
										<label>Color</label>
										<ColorPickerPopover color={shadow.color} onChange={(color) => updateShadow(shadow.id, { color })} swatchSize="sm" />
										<span className={styles.colorValue}>{shadow.color}</span>
									</div>
								</div>
							</div>
						))}
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
							<div className={styles.presetPreviewWrapper}>
								<div
									className={styles.presetPreview}
									style={{
										boxShadow: preset.shadows.map((s) => getShadowCss({ ...s, id: "" })).join(", "),
									}}
								/>
							</div>
							<span className={styles.presetName}>{preset.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* Info Section */}
			<div className={styles.glassCard} style={{ marginTop: "1.5rem" }}>
				<h2 className={styles.sectionTitle}>About Box Shadow</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Syntax</h3>
						<p className={styles.infoText}>
							<code>box-shadow: offset-x offset-y blur spread color</code>
							<br />
							Add <code>inset</code> keyword at the start for inner shadows. Multiple shadows can be combined with commas.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Layered Shadows</h3>
						<p className={styles.infoText}>
							Combine multiple shadow layers for more realistic depth effects. Layered shadows with varying blur and opacity create smoother, more natural-looking shadows than a single
							layer.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Performance</h3>
						<p className={styles.infoText}>
							Box shadows can impact rendering performance, especially with large blur values or many layers. Use <code>will-change: transform</code>
							on animated elements with shadows.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Colored Shadows</h3>
						<p className={styles.infoText}>
							For a more natural look, use a shadow color derived from the element&apos;s background rather than pure black. This creates a more cohesive and modern design aesthetic.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
