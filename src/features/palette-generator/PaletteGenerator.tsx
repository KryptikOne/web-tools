"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
	BookmarkIcon,
	LockClosedIcon,
	LockOpenIcon,
	PlusIcon,
	MinusIcon,
	AdjustmentsHorizontalIcon,
	TrashIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import { ColorUtils } from "@/lib/colorUtils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	hydrateFromStorage,
	setPalette,
	setHarmony,
	setBaseHue,
	setSaturation,
	setLightness,
	toggleLock,
	updateColor,
	addColor,
	removeLastColor,
	savePalette,
	loadSavedPalette,
	loadPreset,
	removeSavedPalette,
	clearSavedPalettes,
	HarmonyType,
	PaletteColor,
} from "@/store/slices/paletteSlice";
import styles from "./PaletteGenerator.module.scss";

const HARMONY_INFO: Record<HarmonyType, { name: string; description: string; angles: number[] }> = {
	analogous: {
		name: "Analogous",
		description: "Colors adjacent on the color wheel, creating harmonious combinations",
		angles: [-30, -15, 0, 15, 30],
	},
	monochromatic: {
		name: "Monochromatic",
		description: "Variations of a single hue with different lightness and saturation",
		angles: [0, 0, 0, 0, 0],
	},
	complementary: {
		name: "Complementary",
		description: "Colors opposite on the color wheel for high contrast",
		angles: [0, 180],
	},
	"split-complementary": {
		name: "Split Complementary",
		description: "A color and the two colors adjacent to its complement",
		angles: [0, 150, 210],
	},
	triadic: {
		name: "Triadic",
		description: "Three colors equally spaced on the color wheel (120° apart)",
		angles: [0, 120, 240],
	},
	tetradic: {
		name: "Tetradic",
		description: "Four colors forming a rectangle on the color wheel",
		angles: [0, 60, 180, 240],
	},
	square: {
		name: "Square",
		description: "Four colors equally spaced on the color wheel (90° apart)",
		angles: [0, 90, 180, 270],
	},
};

const PRESET_PALETTES = [
	{ id: 1, name: "Muted Spectrum", colors: ["#001219", "#005f73", "#0a9396", "#94d2bd", "#e9d8a6", "#ee9b00", "#ca6702", "#bb3e03", "#ae2012", "#9b2226"] },
	{ id: 2, name: "Black & Yellow", colors: ["#000000", "#14213d", "#fca311", "#e5e5e5", "#ffffff"] },
	{ id: 3, name: "Lookin' Real Beachy", colors: ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"] },
	{ id: 4, name: "Golden Twilight", colors: ["#000814", "#001d3d", "#003566", "#ffc300", "#ffd60a"] },
	{ id: 5, name: "Earthy", colors: ["#0a0908", "#22333b", "#eae0d5", "#c6ac8f", "#5e503f"] },
	{ id: 6, name: "Ocean Sunset", colors: ["#001427", "#708d81", "#f4d58d", "#bf0603", "#8d0801"] },
	{ id: 7, name: "Tropical Warmth", colors: ["#001524", "#15616d", "#ffecd1", "#ff7d00", "#78290f"] },
	{ id: 8, name: "Monochrome Harmony", colors: ["#cfdbd5", "#e8eddf", "#f5cb5c", "#242423", "#333533"] },
	{ id: 9, name: "Fiery Red", colors: ["#220901", "#621708", "#941b0c", "#bc3908", "#f6aa1c"] },
	{ id: 10, name: "Cool Coastal Vibes", colors: ["#2b2d42", "#8d99ae", "#edf2f4", "#ef233c", "#d90429"] },
	{ id: 11, name: "Dark Sunset", colors: ["#335c67", "#fff3b0", "#e09f3e", "#9e2a2b", "#540b0e"] },
	{ id: 12, name: "Fiery Ocean", colors: ["#780000", "#c1121f", "#fdf0d5", "#003049", "#669bbc"] },
	{ id: 13, name: "Warm Autumn Glow", colors: ["#003049", "#d62828", "#f77f00", "#fcbf49", "#eae2b7"] },
	{ id: 14, name: "Summer Ocean Breeze", colors: ["#e63946", "#f1faee", "#a8dadc", "#457b9d", "#1d3557"] },
	{ id: 15, name: "Ocean Serenity", colors: ["#01161e", "#124559", "#598392", "#aec3b0", "#eff6e0"] },
	{ id: 16, name: "Autumn Harvest", colors: ["#6f1d1b", "#bb9457", "#432818", "#99582a", "#ffe6a7"] },
	{ id: 17, name: "Muted Wine Night", colors: ["#e1cfb6", "#c79b68", "#47596f", "#671827", "#3d2832"] },
	{ id: 18, name: "Olive Crush", colors: ["#c9cba3", "#ffe1a8", "#e26d5c", "#723d46", "#472d30"] },
	{ id: 19, name: "Forest Walk", colors: ["#2b3a42", "#506266", "#a7c4bc", "#e6ebe0", "#f4f1de"] },
	{ id: 20, name: "Crispy", colors: ["#fffcf2", "#ccc5b9", "#403d39", "#252422", "#eb5e28"] },
	{ id: 21, name: "Dusk", colors: ["#0b132b", "#1c2541", "#3a506b", "#5bc0be", "#6fffe9"] },
	{ id: 22, name: "Soft Neopolitan", colors: ["#463f3a", "#8a817c", "#bcb8b1", "#f4f3ee", "#e0afa0"] },
	{ id: 23, name: "Desert Sunset", colors: ["#2e1f27", "#7d5a5f", "#c9ada7", "#f2e9e4", "#f7882f"] },
	{ id: 24, name: "Calm Ocean", colors: ["#dbe9ee", "#a9c5d8", "#6b8ea3", "#395870", "#1b2a41"] },
	{ id: 25, name: "Casual Cadence", colors: ["#0a0908", "#22333b", "#eae0d5", "#c6ac8f", "#5e503f"] },
	{ id: 26, name: "Vibrant Fiesta", colors: ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"] },
	{ id: 27, name: "Boldness", colors: ["#001524", "#15616d", "#ffecd1", "#ff7d00", "#78290f"] },
	{ id: 28, name: "On Brand", colors: ["#d9ed92", "#b5e48c", "#99d98c", "#76c893", "#52b69a", "#34a0a4", "#168aad", "#1a759f", "#1e6091", "#184e77"] },
	{ id: 29, name: "Soft Pastels", colors: ["#f6d6ad", "#f4a261", "#e76f51", "#2a9d8f", "#264653"] },
	{ id: 30, name: "Nautical Dreams", colors: ["#01161e", "#124559", "#598392", "#aec3b0", "#eff6e0"] },
	{ id: 31, name: "Dark Wine Night", colors: ["#11151c", "#212d40", "#364156", "#7d4e57", "#d66853"] },
	{ id: 32, name: "Gotham Moonrise", colors: ["#f1dac4", "#a69cac", "#474973", "#161b33", "#0d0c1d"] },
	{ id: 33, name: "Grimmace", colors: ["#bfc3ba", "#a9aca9", "#60495a", "#3f3244", "#2f2235"] },
	{ id: 34, name: "Soft Nautical Dreams", colors: ["#4c5760", "#93a8ac", "#d7ceb2", "#a59e8c", "#66635b"] },
	{ id: 35, name: "Sunset Boulevard", colors: ["#3f0d12", "#a71d31", "#f1f0cc", "#d5bf86", "#8d775f"] },
	{ id: 36, name: "Solar Flare Meets Grimmace", colors: ["#44355b", "#31263e", "#221e22", "#eca72c", "#ee5622"] },
];

// Generate a color with specific OKLCH values
function generateColorFromOklch(l: number, c: number, h: number): string {
	const [r, g, b] = ColorUtils.oklchToRgb(l, c, h);
	return ColorUtils.rgbToHex(r, g, b);
}

// Get OKLCH values from hex
function hexToOklch(hex: string): { l: number; c: number; h: number } {
	const rgb = ColorUtils.hexToRgb(hex);
	if (!rgb) return { l: 0.6, c: 0.15, h: 0 };
	const [l, c, h] = ColorUtils.rgbToOklch(rgb[0], rgb[1], rgb[2]);
	return { l, c, h };
}

export default function PaletteGenerator() {
	const dispatch = useAppDispatch();
	const { palette, harmony, baseHue, saturation, lightness, savedPalettes } = useAppSelector((state) => state.palette);

	const [isHydrated, setIsHydrated] = useState(false);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);
	const [copiedCss, setCopiedCss] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [activePresetId, setActivePresetId] = useState<number | null>(null);
	// Track if we should skip regeneration (after loading preset/saved palette or on initial hydration)
	const skipRegenerateRef = useRef(true); // Start as true to skip first regeneration after hydration

	const colorCount = palette.length;

	// Hydrate from localStorage on mount
	useEffect(() => {
		dispatch(hydrateFromStorage());
		// Use a small delay to allow Redux state to settle before marking as hydrated
		// This prevents the regeneration effect from firing during hydration
		requestAnimationFrame(() => {
			setIsHydrated(true);
		});
	}, [dispatch]);

	// Generate palette based on harmony settings
	const generatePalette = () => {
		const newPalette: PaletteColor[] = [];
		const harmonyAngles = HARMONY_INFO[harmony].angles;

		for (let i = 0; i < colorCount; i++) {
			const existingColor = palette.find((c) => c.id === i && c.locked);
			if (existingColor) {
				newPalette.push(existingColor);
				continue;
			}

			let hue: number;
			let l = lightness;
			let c = saturation;

			if (harmony === "monochromatic") {
				hue = baseHue;
				const step = i / (colorCount - 1 || 1);
				l = 0.3 + step * 0.5;
				c = saturation * (0.5 + step * 0.5);
			} else {
				const angleIndex = i % harmonyAngles.length;
				const baseAngle = harmonyAngles[angleIndex];
				const variation = Math.floor(i / harmonyAngles.length) * 10;
				hue = (baseHue + baseAngle + variation) % 360;
				if (hue < 0) hue += 360;
				l = lightness + (i % 2 === 0 ? 0.05 : -0.05);
				l = Math.max(0.2, Math.min(0.85, l));
			}

			const hex = generateColorFromOklch(l, c, hue);
			newPalette.push({ id: i, hex, locked: false });
		}

		dispatch(setPalette(newPalette));
	};

	// Regenerate when harmony or settings change (only after hydration)
	useEffect(() => {
		if (!isHydrated) return;

		if (skipRegenerateRef.current) {
			skipRegenerateRef.current = false;
			return;
		}

		generatePalette();
	}, [harmony, baseHue, saturation, lightness, colorCount, isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

	// Shuffle palette with new hue
	const shufflePalette = () => {
		skipRegenerateRef.current = false;
		const newHue = Math.random() * 360;
		dispatch(setBaseHue(newHue));
		setActivePresetId(null);
	};

	// Copy single color
	const copyColor = async (hex: string, index: number) => {
		try {
			await navigator.clipboard.writeText(hex);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Copy all colors
	const copyAllColors = async () => {
		try {
			const colorsText = palette.map((c) => c.hex).join(", ");
			await navigator.clipboard.writeText(colorsText);
			setCopiedAll(true);
			setTimeout(() => setCopiedAll(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Handle loading saved palette
	const handleLoadSavedPalette = (saved: (typeof savedPalettes)[0]) => {
		skipRegenerateRef.current = true;
		dispatch(loadSavedPalette(saved));
		setActivePresetId(null);

		// Extract base hue from first color
		const oklch = hexToOklch(saved.colors[0]);
		dispatch(setBaseHue(oklch.h));
		dispatch(setLightness(oklch.l));
		dispatch(setSaturation(oklch.c));
	};

	// Handle loading preset
	const handleLoadPreset = (preset: (typeof PRESET_PALETTES)[0]) => {
		skipRegenerateRef.current = true;
		dispatch(loadPreset(preset.colors));
		setActivePresetId(preset.id);
	};

	// Handle adding color
	const handleAddColor = () => {
		if (colorCount >= 8) return;
		setActivePresetId(null);

		const harmonyAngles = HARMONY_INFO[harmony].angles;
		const newIndex = colorCount;
		let hue: number;
		let l = lightness;
		let c = saturation;

		if (harmony === "monochromatic") {
			hue = baseHue;
			const step = newIndex / colorCount;
			l = 0.3 + step * 0.5;
			c = saturation * (0.5 + step * 0.5);
		} else {
			const angleIndex = newIndex % harmonyAngles.length;
			const baseAngle = harmonyAngles[angleIndex];
			const variation = Math.floor(newIndex / harmonyAngles.length) * 10;
			hue = (baseHue + baseAngle + variation) % 360;
			if (hue < 0) hue += 360;
			l = lightness + (newIndex % 2 === 0 ? 0.05 : -0.05);
			l = Math.max(0.2, Math.min(0.85, l));
		}

		const hex = generateColorFromOklch(l, c, hue);
		dispatch(addColor(hex));
	};

	// Generate CSS/SCSS output
	const cssOutput = useMemo(() => {
		return palette.map((c, i) => `--color-${i + 1}: ${c.hex};`).join("\n");
	}, [palette]);

	// Get hue gradient for slider
	const hueGradient = useMemo(() => {
		const colors = [];
		for (let i = 0; i <= 360; i += 30) {
			const hex = generateColorFromOklch(lightness, saturation, i);
			colors.push(hex);
		}
		return `linear-gradient(to right, ${colors.join(", ")})`;
	}, [lightness, saturation]);

	return (
		<div className={styles.container}>
			{/* Main Palette Display */}
			<div className={`flex mb-6 ${styles.paletteDisplay}`}>
				{palette.map((color, index) => (
					<div key={color.id} className={`flex-1 relative cursor-pointer ${styles.colorSwatch}`} style={{ backgroundColor: color.hex }}>
						<div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${styles.swatchOverlay}`}>
							<span className={`font-mono text-xl font-semibold text-white ${styles.hexLabel}`}>{color.hex.toUpperCase()}</span>
							<div className="flex gap-2">
								<button className={`flex items-center justify-center p-2 ${styles.actionBtn}`} onClick={() => dispatch(toggleLock(color.id))} title={color.locked ? "Unlock color" : "Lock color"}>
									{color.locked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
								</button>
								<button className={`flex items-center justify-center p-2 ${styles.actionBtn} ${copiedIndex === index ? styles.copied : ""}`} onClick={() => copyColor(color.hex, index)} title="Copy color">
									{copiedIndex === index ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
								</button>
								<ColorPickerPopover color={color.hex} onChange={(hex) => { dispatch(updateColor({ id: color.id, hex })); setActivePresetId(null); }} swatchSize="lg" showHex={true} />
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Controls */}
			<div className={`flex justify-between items-center gap-4 mb-6 flex-wrap ${styles.controls}`}>
				<div className="flex gap-3 flex-wrap">
					<Button onClick={shufflePalette} className={styles.btnPrimary}>
						<ArrowPathIcon className="w-5 h-5" />
						Generate
					</Button>
					<Button onClick={() => dispatch(savePalette())} className={styles.btnSecondary}>
						<BookmarkIcon className="w-5 h-5" />
						Save
					</Button>
					<Button onClick={copyAllColors} className={`${styles.btnSecondary} ${copiedAll ? styles.copied : ""}`}>
						{copiedAll ? <CheckIcon className="w-5 h-5" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
						{copiedAll ? "Copied!" : "Copy All"}
					</Button>
					<Button onClick={() => setShowSettings(!showSettings)} className={`${styles.btnSecondary} ${showSettings ? styles.active : ""}`}>
						<AdjustmentsHorizontalIcon className="w-5 h-5" />
						Settings
					</Button>
				</div>

				<div className="flex items-center gap-3">
					<Button onClick={() => { dispatch(removeLastColor()); setActivePresetId(null); }} className={`flex items-center justify-center p-2 ${styles.countBtn}`} disabled={colorCount <= 2}>
						<MinusIcon className="w-4 h-4" />
					</Button>
					<span className={`text-sm font-medium text-center min-w-18 ${styles.countLabel}`}>{colorCount} colors</span>
					<Button onClick={handleAddColor} className={`flex items-center justify-center p-2 ${styles.countBtn}`} disabled={colorCount >= 8}>
						<PlusIcon className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* Settings Panel */}
			{showSettings && (
				<div className={`grid grid-cols-2 gap-6 mb-6 ${styles.settingsPanel}`}>
					<div className={`mb-6 ${styles.glassCard}`}>
						<h3 className={`text-base font-semibold mb-4 ${styles.sectionTitle}`}>Color Harmony</h3>
						<div className={`grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 mb-4 ${styles.harmonyGrid}`}>
							{(Object.keys(HARMONY_INFO) as HarmonyType[]).map((type) => (
								<button
									key={type}
									className={`px-3 py-2.5 text-xs font-medium text-center cursor-pointer ${styles.harmonyBtn} ${harmony === type ? styles.active : ""}`}
									onClick={() => {
										skipRegenerateRef.current = false;
										dispatch(setHarmony(type));
										setActivePresetId(null);
									}}
								>
									<span className="block">{HARMONY_INFO[type].name}</span>
								</button>
							))}
						</div>
						<p className={`text-xs leading-relaxed m-0 ${styles.harmonyDescription}`}>{HARMONY_INFO[harmony].description}</p>
					</div>

					<div className={`mb-6 ${styles.glassCard}`}>
						<h3 className={`text-base font-semibold mb-4 ${styles.sectionTitle}`}>Adjustments</h3>

						<div className={`mb-5 last:mb-0 ${styles.sliderGroup}`}>
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.label}`}>Base Hue</label>
								<span className={`text-sm font-mono ${styles.valueDisplay}`}>{Math.round(baseHue)}°</span>
							</div>
							<input
								type="range"
								min="0"
								max="360"
								step="1"
								value={baseHue}
								onChange={(e) => {
									skipRegenerateRef.current = false;
									dispatch(setBaseHue(parseFloat(e.target.value)));
									setActivePresetId(null);
								}}
								className={`h-2 ${styles.slider}`}
								style={{ background: hueGradient }}
							/>
						</div>

						<div className={`mb-5 last:mb-0 ${styles.sliderGroup}`}>
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.label}`}>Saturation</label>
								<span className={`text-sm font-mono ${styles.valueDisplay}`}>{Math.round(saturation * 100)}%</span>
							</div>
							<input
								type="range"
								min="0.05"
								max="0.3"
								step="0.01"
								value={saturation}
								onChange={(e) => {
									skipRegenerateRef.current = false;
									dispatch(setSaturation(parseFloat(e.target.value)));
									setActivePresetId(null);
								}}
								className={`h-2 ${styles.slider}`}
							/>
						</div>

						<div className={`mb-5 last:mb-0 ${styles.sliderGroup}`}>
							<div className="flex justify-between items-center mb-2">
								<label className={`text-sm font-medium ${styles.label}`}>Lightness</label>
								<span className={`text-sm font-mono ${styles.valueDisplay}`}>{Math.round(lightness * 100)}%</span>
							</div>
							<input
								type="range"
								min="0.3"
								max="0.85"
								step="0.01"
								value={lightness}
								onChange={(e) => {
									skipRegenerateRef.current = false;
									dispatch(setLightness(parseFloat(e.target.value)));
									setActivePresetId(null);
								}}
								className={`h-2 ${styles.slider}`}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Saved Palettes */}
			{savedPalettes.length > 0 && (
				<div className={`mb-6 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4">
						<h3 className={`text-base font-semibold m-0 ${styles.sectionTitle}`}>Saved Palettes</h3>
						<Button onClick={() => dispatch(clearSavedPalettes())} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium ${styles.clearAllBtn}`} title="Clear all saved palettes">
							<TrashIcon className="w-4 h-4" />
							Clear All
						</Button>
					</div>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
						{savedPalettes.map((saved) => (
							<div key={saved.id} className={`relative ${styles.savedPaletteWrapper}`}>
								<button className={`w-full p-0 overflow-hidden cursor-pointer ${styles.savedPalette}`} onClick={() => handleLoadSavedPalette(saved)}>
									<div className="flex h-10">
										{saved.colors.map((color, i) => (
											<div key={i} className="flex-1" style={{ backgroundColor: color }} />
										))}
									</div>
								</button>
								<button
									className={`absolute flex items-center justify-center p-0 w-5 h-5 rounded-full cursor-pointer ${styles.deletePaletteBtn}`}
									onClick={(e) => {
										e.stopPropagation();
										dispatch(removeSavedPalette(saved.id));
									}}
									title="Delete palette"
								>
									<XMarkIcon className="w-3.5 h-3.5" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Presets */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<h3 className={`text-base font-semibold mb-4 ${styles.sectionTitle}`}>Preset Palettes</h3>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
					{PRESET_PALETTES.map((preset) => (
						<button key={preset.id} className={`p-0 overflow-hidden cursor-pointer ${styles.presetBtn} ${activePresetId === preset.id ? styles.activePreset : ""}`} onClick={() => handleLoadPreset(preset)}>
							<div className="flex h-12.5">
								{preset.colors.map((color, i) => (
									<div key={i} className="flex-1" style={{ backgroundColor: color }} />
								))}
							</div>
							<span className={`block p-2 text-xs font-medium text-center ${styles.presetName}`}>{preset.name}</span>
						</button>
					))}
				</div>
			</div>

			{/* CSS Output */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<h3 className={`text-base font-semibold mb-4 ${styles.sectionTitle}`}>CSS Variables</h3>
				<div className={`relative p-4 overflow-x-auto ${styles.codeBlock}`}>
					<pre className="m-0 font-mono text-sm leading-relaxed">{cssOutput}</pre>
					<button
						onClick={async () => {
							await navigator.clipboard.writeText(cssOutput);
							setCopiedCss(true);
							setTimeout(() => setCopiedCss(false), 2000);
						}}
						className={`absolute top-2 right-2 ${styles.copyBtn} ${copiedCss ? styles.copied : ""}`}
						title="Copy to clipboard"
					>
						{copiedCss ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
					</button>
				</div>
			</div>

			{/* Info Section */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 ${styles.infoTitle}`}>About Color Harmonies</h3>
				<div className={styles.infoGrid}>
					<div>
						<h4 className={styles.infoSubtitle}>Analogous</h4>
						<p className={styles.infoText}>Colors that sit next to each other on the color wheel. They create serene, comfortable designs and are often found in nature.</p>
					</div>
					<div>
						<h4 className={styles.infoSubtitle}>Complementary</h4>
						<p className={styles.infoText}>Colors opposite each other on the color wheel. They create high contrast and visual interest, perfect for making elements stand out.</p>
					</div>
					<div>
						<h4 className={styles.infoSubtitle}>Triadic</h4>
						<p className={styles.infoText}>Three colors equally spaced on the color wheel. This scheme offers strong visual contrast while retaining balance and harmony.</p>
					</div>
					<div>
						<h4 className={styles.infoSubtitle}>Split-Complementary</h4>
						<p className={styles.infoText}>A base color and two colors adjacent to its complement. Provides high contrast without the tension of complementary schemes.</p>
					</div>
				</div>
				<div className={`mt-6 p-4 ${styles.noteBox}`}>
					<p>
						<strong>Tip:</strong> Press the spacebar or click Generate to create new palettes. Lock colors you like to keep them while regenerating the rest.
					</p>
				</div>
			</div>
		</div>
	);
}
