"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ColorUtils } from "@/lib/colorUtils";
import { contrastRatio } from "@/lib/contrastUtils";
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon, SwatchIcon, BookmarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateColorPicker, setOklch, setAlpha, saveColor, loadColor, clearSavedColors, SavedColor } from "@/store/slices/colorPickerSlice";
import styles from "./ColorPicker.module.scss";

type AccessibilityLevel = "none" | "aa" | "aaa";

export default function ColorPicker() {
	const dispatch = useAppDispatch();
	const { oklch, alpha, savedColors } = useAppSelector((state) => state.colorPicker);

	// Local UI state (not persisted)
	const [inputValue, setInputValue] = useState("");
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
	const [hexCopied, setHexCopied] = useState(false);
	const [showColorList, setShowColorList] = useState(false);
	const [accessibilityLevel, setAccessibilityLevel] = useState<AccessibilityLevel>("none");

	// Hydrate from localStorage on mount
	useEffect(() => {
		dispatch(hydrateColorPicker());
	}, [dispatch]);

	// Check for color parameter in URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const colorParam = urlParams.get("color");
		if (colorParam) {
			const parsed = ColorUtils.parseColor(colorParam);
			if (parsed) {
				const [r, g, b] = parsed.rgb;
				const [l, c, h] = ColorUtils.rgbToOklch(r, g, b);
				dispatch(setOklch({ l, c, h }));
				if (parsed.alpha !== undefined) {
					dispatch(setAlpha(parsed.alpha));
				}
			}
		}
	}, [dispatch]);

	// Calculate RGB from OKLCH
	const rgb = useMemo(() => {
		return ColorUtils.oklchToRgb(oklch.l, oklch.c, oklch.h);
	}, [oklch]);

	// Calculate other formats
	const colorFormats = useMemo(() => {
		const [r, g, b] = rgb;
		const [h, s, l] = ColorUtils.rgbToHsl(r, g, b);
		const hex = ColorUtils.rgbToHex(r, g, b);

		return {
			hex: hex,
			hexa:
				hex +
				Math.round(alpha * 255)
					.toString(16)
					.padStart(2, "0"),
			rgb: `rgb(${r}, ${g}, ${b})`,
			rgba: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`,
			hsl: `hsl(${h}, ${s}%, ${l}%)`,
			hsla: `hsla(${h}, ${s}%, ${l}%, ${alpha.toFixed(2)})`,
			oklch: `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)})`,
			oklcha: `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)} / ${alpha.toFixed(2)})`,
		};
	}, [rgb, oklch, alpha]);

	// Handle input parsing
	const handleInputChange = (value: string) => {
		setInputValue(value);
		const parsed = ColorUtils.parseColor(value);
		if (parsed) {
			const [r, g, b] = parsed.rgb;
			const [l, c, h] = ColorUtils.rgbToOklch(r, g, b);
			dispatch(setOklch({ l, c, h }));
			if (parsed.alpha !== undefined) {
				dispatch(setAlpha(parsed.alpha));
			}
		}
	};

	const calculateContrast = contrastRatio;

	// Check if a color meets contrast requirements on both black and white
	const meetsContrastOnBothBackgrounds = useCallback(
		(testRgb: [number, number, number], level: AccessibilityLevel): boolean => {
			if (level === "none") return true;
			const minRatio = level === "aaa" ? 4.5 : 3;
			const contrastOnWhite = calculateContrast(testRgb, [255, 255, 255]);
			const contrastOnBlack = calculateContrast(testRgb, [0, 0, 0]);
			return contrastOnWhite >= minRatio && contrastOnBlack >= minRatio;
		},
		[calculateContrast],
	);

	// Generate accessible random color
	const generateAccessibleRandomColor = useCallback(
		(level: AccessibilityLevel) => {
			const maxAttempts = 100;

			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				const l = level === "aaa" ? Math.random() * 0.2 + 0.45 : Math.random() * 0.3 + 0.4;
				const c = Math.random() * 0.25;
				const h = Math.random() * 360;

				const testRgb = ColorUtils.oklchToRgb(l, c, h);

				if (meetsContrastOnBothBackgrounds(testRgb, level)) {
					return { l, c, h };
				}
			}

			return { l: 0.55, c: 0.12, h: Math.random() * 360 };
		},
		[meetsContrastOnBothBackgrounds],
	);

	// Generate random color (optionally accessible)
	const generateRandomColor = () => {
		if (accessibilityLevel !== "none") {
			const newColor = generateAccessibleRandomColor(accessibilityLevel);
			dispatch(setOklch(newColor));
		} else {
			const l = Math.random() * 0.3 + 0.5;
			const c = Math.random() * 0.25;
			const h = Math.random() * 360;
			dispatch(setOklch({ l, c, h }));
		}
		dispatch(setAlpha(1));
		setInputValue("");
	};

	// Copy to clipboard
	const copyToClipboard = async (text: string, format: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedFormat(format);
			setTimeout(() => setCopiedFormat(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Save color to palette
	const handleSaveColor = () => {
		const newColor: SavedColor = {
			hex: colorFormats.hex,
			oklch: { ...oklch },
			alpha,
			id: Date.now(),
		};
		dispatch(saveColor(newColor));
	};

	// Load saved color
	const handleLoadColor = (color: SavedColor) => {
		dispatch(loadColor(color));
		setInputValue("");
	};

	// WCAG compliance check
	const getWCAGRating = (contrast: number) => {
		if (contrast >= 7) return { level: "AAA", className: styles.aaa };
		if (contrast >= 4.5) return { level: "AA", className: styles.aa };
		if (contrast >= 3) return { level: "AA Large", className: styles.aaLarge };
		return { level: "Fail", className: styles.fail };
	};

	const contrastWhite = calculateContrast(rgb, [255, 255, 255]);
	const contrastBlack = calculateContrast(rgb, [0, 0, 0]);

	// Generate gradient for sliders
	const getLightnessGradient = () => {
		const steps = 10;
		const colors = [];
		for (let i = 0; i <= steps; i++) {
			const l = i / steps;
			const [r, g, b] = ColorUtils.oklchToRgb(l, oklch.c, oklch.h);
			colors.push(ColorUtils.rgbToHex(r, g, b));
		}
		return `linear-gradient(to right, ${colors.join(", ")})`;
	};

	const getChromaGradient = () => {
		const steps = 10;
		const colors = [];
		for (let i = 0; i <= steps; i++) {
			const c = (i / steps) * 0.4;
			const [r, g, b] = ColorUtils.oklchToRgb(oklch.l, c, oklch.h);
			colors.push(ColorUtils.rgbToHex(r, g, b));
		}
		return `linear-gradient(to right, ${colors.join(", ")})`;
	};

	const getHueGradient = () => {
		const steps = 12;
		const colors = [];
		for (let i = 0; i <= steps; i++) {
			const h = (i / steps) * 360;
			const [r, g, b] = ColorUtils.oklchToRgb(oklch.l, oklch.c, h);
			colors.push(ColorUtils.rgbToHex(r, g, b));
		}
		return `linear-gradient(to right, ${colors.join(", ")})`;
	};

	return (
		<div className={styles.container}>
			<div className={styles.grid}>
				<div>
					{/* Color Preview */}
					<div className={`mb-6 ${styles.glassCard}`}>
						<div className={`w-full h-50 relative overflow-hidden shadow-xl ${styles.colorPreview}`}>
							<div className={`w-full h-full ${styles.swatch}`} style={{ backgroundColor: colorFormats.rgba }}>
								<div className={`absolute bottom-4 left-4 right-4 flex justify-between items-end`}>
									<div
									className={`${styles.hexDisplay} ${hexCopied ? styles.hexCopied : ""}`}
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(colorFormats.hex);
											setHexCopied(true);
											setTimeout(() => setHexCopied(false), 600);
										} catch (err) {
											console.error("Failed to copy:", err);
										}
									}}
									title="Click to copy hex"
									style={{ cursor: "pointer" }}
								>
									<p className="font-mono text-2xl">{colorFormats.hex}</p>
								</div>
									<Button onClick={generateRandomColor} className={`${styles.btnRandom}`} title="Random Color">
										<ArrowPathIcon className="w-5 h-5" />
									</Button>
								</div>
							</div>
						</div>

						<div className={`flex gap-2 mt-4`}>
							<Button onClick={handleSaveColor} className={`flex-1 ${styles.btnSecondary}`}>
								<BookmarkIcon className="w-4 h-4" />
								Save
							</Button>
							<Button onClick={() => setShowColorList(!showColorList)} className={`flex-1 ${styles.btnSecondary}`}>
								<SwatchIcon className="w-4 h-4" />
								Saved ({savedColors.length})
							</Button>
						</div>

						{/* Accessibility Level Toggle for Random Colors */}
						<div className={`flex flex-col gap-2 mt-4 pt-4 ${styles.accessibilityToggle}`}>
							<span className={`text-xs ${styles.toggleLabel}`}>Random Color Accessibility:</span>
							<div className={`flex gap-1`}>
								<Button onClick={() => setAccessibilityLevel("none")} className={`flex-1 text-xs font-semibold ${styles.toggleBtn} ${accessibilityLevel === "none" ? styles.active : ""}`}>
									Any
								</Button>
								<Button onClick={() => setAccessibilityLevel("aa")} className={`flex-1 text-xs font-semibold ${styles.toggleBtn} ${accessibilityLevel === "aa" ? styles.active : ""}`}>
									AA+
								</Button>
								<Button onClick={() => setAccessibilityLevel("aaa")} className={`flex-1 text-xs font-semibold ${styles.toggleBtn} ${accessibilityLevel === "aaa" ? styles.active : ""}`}>
									AAA+
								</Button>
							</div>
						</div>
					</div>
					{/* Saved Colors Palette */}
					{showColorList && savedColors.length > 0 && (
						<div className={`mt-6 ${styles.glassCard}`}>
							<div className={`flex justify-between items-center mb-4 ${styles.savedColorsHeader}`}>
								<h3 className={styles.sectionTitle}>Saved Colors</h3>
								<Button onClick={() => dispatch(clearSavedColors())} className={styles.clearBtn} title="Clear all saved colors">
									<TrashIcon className="w-4 h-4" />
									Clear All
								</Button>
							</div>
							<div className={styles.savedColorsGrid}>
								{savedColors.map((color) => (
									<button key={color.id} onClick={() => handleLoadColor(color)} className={`aspect-square cursor-pointer ${styles.colorSwatch}`} style={{ backgroundColor: color.hex }} title={color.hex} />
								))}
							</div>
						</div>
					)}

					{/* OKLCH Sliders */}
					<div className={`mt-6 ${styles.glassCard}`}>
						<h3 className={styles.sectionTitle}>OKLCH Color Space</h3>

						<div className={styles.sliderGroup}>
							<div className={`flex justify-between mb-2`}>
								<label className={`text-sm ${styles.label}`}>Lightness</label>
								<span className={`font-mono text-sm ${styles.valueDisplay}`}>{(oklch.l * 100).toFixed(1)}%</span>
							</div>
							<input
								type="range"
								min="0"
								max="100"
								step="0.1"
								value={oklch.l * 100}
								onChange={(e) => dispatch(setOklch({ ...oklch, l: parseFloat(e.target.value) / 100 }))}
								className={`h-2 ${styles.slider}`}
								style={{ background: getLightnessGradient() }}
							/>
						</div>

						<div className={styles.sliderGroup}>
							<div className={`flex justify-between mb-2`}>
								<label className={`text-sm ${styles.label}`}>Chroma</label>
								<span className={`font-mono text-sm ${styles.valueDisplay}`}>{oklch.c.toFixed(3)}</span>
							</div>
							<input
								type="range"
								min="0"
								max="0.4"
								step="0.001"
								value={oklch.c}
								onChange={(e) => dispatch(setOklch({ ...oklch, c: parseFloat(e.target.value) }))}
								className={`h-2 ${styles.slider}`}
								style={{ background: getChromaGradient() }}
							/>
						</div>

						<div className={styles.sliderGroup}>
							<div className={`flex justify-between mb-2`}>
								<label className={`text-sm ${styles.label}`}>Hue</label>
								<span className={`font-mono text-sm ${styles.valueDisplay}`}>{oklch.h.toFixed(1)}°</span>
							</div>
							<input
								type="range"
								min="0"
								max="360"
								step="0.1"
								value={oklch.h}
								onChange={(e) => dispatch(setOklch({ ...oklch, h: parseFloat(e.target.value) }))}
								className={`h-2 ${styles.slider}`}
								style={{ background: getHueGradient() }}
							/>
						</div>

						<div className={styles.sliderGroup}>
							<div className={`flex justify-between mb-2`}>
								<label className={`text-sm ${styles.label}`}>Alpha</label>
								<span className={`font-mono text-sm ${styles.valueDisplay}`}>{(alpha * 100).toFixed(0)}%</span>
							</div>
							<input
								type="range"
								min="0"
								max="100"
								step="1"
								value={alpha * 100}
								onChange={(e) => dispatch(setAlpha(parseFloat(e.target.value) / 100))}
								className={`h-2 ${styles.slider}`}
								style={{ background: `linear-gradient(to right, transparent, ${colorFormats.hex})` }}
							/>
						</div>
					</div>
				</div>

				<div>
					{/* Input Field */}
					<div className={`mb-6 ${styles.glassCard}`}>
						<h3 className={styles.sectionTitle}>Color Input</h3>
						<input type="text" value={inputValue} onChange={(e) => handleInputChange(e.target.value)} placeholder="Enter any color format..." className={styles.inputField} />
						<p className={`text-xs mt-2 ${styles.inputHint}`}>Supports: HEX (#RGB, #RRGGBB, #RRGGBBAA), RGB(A), HSL(A), OKLCH</p>
					</div>

					{/* Color Formats */}
					<div className={styles.glassCard}>
						<h3 className={styles.sectionTitle}>All Formats</h3>

						{Object.entries(colorFormats).map(([format, value]) => (
							<div key={format} className={`flex justify-between items-center p-3 mb-2 ${styles.formatItem}`}>
								<span className={`text-xs uppercase tracking-wide min-w-15 ${styles.formatLabel}`}>{format}</span>
								<span className={`font-mono text-lg flex-1 mx-4 p-2 ${styles.formatValue}`}>{value}</span>
								<button onClick={() => copyToClipboard(value, format)} className={`${styles.copyBtn} ${copiedFormat === format ? styles.copied : ""}`} title="Copy to clipboard">
									{copiedFormat === format ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
								</button>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Contrast Checker Section */}
				<div className={`mt-6 ${styles.contrastCheckerContent}`}>
					<h3 className={styles.sectionTitle}>Contrast Checker</h3>

					{/* Current Color Contrast on White/Black */}
					<div className={`mb-8`}>
						<h4 className={`text-sm font-semibold mb-4 ${styles.subsectionTitle}`}>Current Color Contrast</h4>
						<div className={styles.contrastBoxes}>
							<div className={`p-4 ${styles.contrastBox} ${styles.white}`}>
								<div className={`flex justify-between items-center`}>
									<span>On White</span>
									<div>
										<span className={`font-mono text-base font-bold ${styles.contrastRatio}`}>{contrastWhite.toFixed(2)}:1</span>
										<span className={`inline-block px-2 py-1 ml-2 text-xs font-bold text-white ${styles.wcagBadge} ${getWCAGRating(contrastWhite).className}`}>{getWCAGRating(contrastWhite).level}</span>
									</div>
								</div>
							</div>

							<div className={`p-4 ${styles.contrastBox} ${styles.black}`}>
								<div className={`flex justify-between items-center`}>
									<span>On Black</span>
									<div>
										<span className={`font-mono text-base font-bold ${styles.contrastRatio}`}>{contrastBlack.toFixed(2)}:1</span>
										<span className={`inline-block px-2 py-1 ml-2 text-xs font-bold text-white ${styles.wcagBadge} ${getWCAGRating(contrastBlack).className}`}>{getWCAGRating(contrastBlack).level}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* WCAG Requirements Info */}
					<div className={`pt-8 ${styles.wcagInfo}`}>
						<h4 className={`text-sm font-semibold mb-4 ${styles.subsectionTitle}`}>WCAG Contrast Requirements</h4>
						<div className={`mb-4 ${styles.infoGrid}`}>
							<div>
								<h5 className={`text-xs font-semibold mb-2 ${styles.infoSubtitle}`}>Level AA (Minimum)</h5>
								<ul className={styles.infoList}>
									<li>Normal text: 4.5:1 minimum</li>
									<li>Large text: 3:1 minimum</li>
									<li>Large text is 18pt+ or 14pt+ bold</li>
								</ul>
							</div>
							<div>
								<h5 className={`text-xs font-semibold mb-2 ${styles.infoSubtitle}`}>Level AAA (Enhanced)</h5>
								<ul className={styles.infoList}>
									<li>Normal text: 7:1 minimum</li>
									<li>Large text: 4.5:1 minimum</li>
									<li>Best for maximum accessibility</li>
								</ul>
							</div>
						</div>
						<div className={`p-4 ${styles.noteBox}`}>
							<p className={`m-0 text-xs`}>
								<strong className="font-bold">Tip:</strong> Use the accessibility toggle above to generate random colors that meet AA or AAA on both light and dark backgrounds. To test a specific foreground and background pair, open the{" "}
								<Link href={`/tools/contrast-checker`} className={styles.inlineLink}>Contrast Checker</Link>.
							</p>
						</div>
					</div>
				</div>
		</div>
	);
}
