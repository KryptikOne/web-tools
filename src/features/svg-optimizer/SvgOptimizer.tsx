"use client";

import { useState, useCallback, useRef } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	CodeBracketIcon,
	ArrowDownTrayIcon,
	ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import styles from "./SvgOptimizer.module.scss";

// --- Types ---

interface OptimizationOptions {
	removeComments: boolean;
	removeMetadata: boolean;
	removeEmptyAttributes: boolean;
	removeDefaultAttributes: boolean;
	minify: boolean;
	removeXmlDeclaration: boolean;
	removeDoctype: boolean;
	cleanupIds: boolean;
	removeEmptyGroups: boolean;
	collapseGroups: boolean;
	roundDecimals: boolean;
	decimalPrecision: number;
	removeHiddenElements: boolean;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
	removeComments: true,
	removeMetadata: true,
	removeEmptyAttributes: true,
	removeDefaultAttributes: true,
	minify: true,
	removeXmlDeclaration: true,
	removeDoctype: true,
	cleanupIds: false,
	removeEmptyGroups: true,
	collapseGroups: true,
	roundDecimals: true,
	decimalPrecision: 2,
	removeHiddenElements: true,
};

// Attributes that are safe to remove when they match defaults
const DEFAULT_ATTRIBUTE_VALUES: Record<string, string> = {
	fill: "none",
	stroke: "none",
	"stroke-width": "1",
	"stroke-linecap": "butt",
	"stroke-linejoin": "miter",
	"stroke-dashoffset": "0",
	"stroke-opacity": "1",
	"fill-opacity": "1",
	opacity: "1",
	"fill-rule": "nonzero",
	"clip-rule": "nonzero",
	"font-style": "normal",
	"font-weight": "normal",
	"text-decoration": "none",
	visibility: "visible",
	display: "inline",
	overflow: "visible",
};

const METADATA_TAGS = ["title", "desc", "metadata"];

// --- Sanitization ---

function sanitizeSvg(svg: string): string {
	// Remove <script> tags and their contents
	let sanitized = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
	// Remove on* event handler attributes
	sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
	return sanitized;
}

// --- Optimization Functions ---

function removeComments(svg: string): string {
	return svg.replace(/<!--[\s\S]*?-->/g, "");
}

function removeXmlDeclaration(svg: string): string {
	return svg.replace(/<\?xml[^?]*\?>\s*/gi, "");
}

function removeDoctype(svg: string): string {
	return svg.replace(/<!DOCTYPE[^>]*>\s*/gi, "");
}

function removeMetadataElements(doc: Document): void {
	for (const tag of METADATA_TAGS) {
		const elements = doc.getElementsByTagName(tag);
		while (elements.length > 0) {
			elements[0].parentNode?.removeChild(elements[0]);
		}
	}
}

function removeEmptyAttributesFromElement(el: Element): void {
	const toRemove: string[] = [];
	for (let i = 0; i < el.attributes.length; i++) {
		const attr = el.attributes[i];
		if (attr.value === "" || attr.value === undefined) {
			toRemove.push(attr.name);
		}
	}
	toRemove.forEach((name) => el.removeAttribute(name));
}

function removeDefaultAttributesFromElement(el: Element): void {
	const toRemove: string[] = [];
	for (let i = 0; i < el.attributes.length; i++) {
		const attr = el.attributes[i];
		const defaultVal = DEFAULT_ATTRIBUTE_VALUES[attr.name];
		if (defaultVal !== undefined && attr.value === defaultVal) {
			toRemove.push(attr.name);
		}
	}
	toRemove.forEach((name) => el.removeAttribute(name));
}

function removeHiddenElementsFromDoc(doc: Document): void {
	const allElements = doc.querySelectorAll("*");
	const toRemove: Element[] = [];

	allElements.forEach((el) => {
		const display = el.getAttribute("display");
		const visibility = el.getAttribute("visibility");
		const style = el.getAttribute("style") || "";

		if (
			display === "none" ||
			visibility === "hidden" ||
			style.includes("display:none") ||
			style.includes("display: none") ||
			style.includes("visibility:hidden") ||
			style.includes("visibility: hidden")
		) {
			toRemove.push(el);
		}
	});

	toRemove.forEach((el) => el.parentNode?.removeChild(el));
}

function removeEmptyGroupsFromDoc(doc: Document): void {
	let changed = true;
	while (changed) {
		changed = false;
		const groups = doc.querySelectorAll("g");
		groups.forEach((g) => {
			if (g.children.length === 0 && g.textContent?.trim() === "") {
				g.parentNode?.removeChild(g);
				changed = true;
			}
		});
	}
}

function collapseGroupsInDoc(doc: Document): void {
	let changed = true;
	while (changed) {
		changed = false;
		const groups = doc.querySelectorAll("g");
		groups.forEach((g) => {
			// Only collapse groups with a single child element and no meaningful attributes
			if (g.children.length === 1 && g.attributes.length === 0) {
				const child = g.children[0];
				g.parentNode?.replaceChild(child, g);
				changed = true;
			}
		});
	}
}

function cleanupIdsInDoc(doc: Document): void {
	const allElements = doc.querySelectorAll("[id]");
	const idMap = new Map<string, string>();
	let counter = 0;

	// Build map of old -> new IDs
	allElements.forEach((el) => {
		const oldId = el.getAttribute("id");
		if (oldId && oldId.length > 2) {
			const newId = `a${counter++}`;
			idMap.set(oldId, newId);
		}
	});

	// Apply new IDs
	allElements.forEach((el) => {
		const oldId = el.getAttribute("id")!;
		const newId = idMap.get(oldId);
		if (newId) {
			el.setAttribute("id", newId);
		}
	});

	// Update references (href, xlink:href, url() in style/fill/clip-path/etc.)
	const allEls = doc.querySelectorAll("*");
	allEls.forEach((el) => {
		for (let i = 0; i < el.attributes.length; i++) {
			const attr = el.attributes[i];
			let val = attr.value;
			let didChange = false;

			// url(#oldId) references
			idMap.forEach((newId, oldId) => {
				const urlPattern = `url(#${oldId})`;
				if (val.includes(urlPattern)) {
					val = val.replaceAll(urlPattern, `url(#${newId})`);
					didChange = true;
				}
			});

			// href="#oldId" or xlink:href="#oldId"
			if (attr.name === "href" || attr.name === "xlink:href") {
				idMap.forEach((newId, oldId) => {
					if (val === `#${oldId}`) {
						val = `#${newId}`;
						didChange = true;
					}
				});
			}

			if (didChange) {
				el.setAttribute(attr.name, val);
			}
		}
	});
}

function roundDecimalsInString(svg: string, precision: number): string {
	// Match decimal numbers (e.g., 12.345678)
	return svg.replace(/(\d+\.\d+)/g, (match) => {
		const num = parseFloat(match);
		if (isNaN(num)) return match;
		const rounded = num.toFixed(precision);
		// Remove trailing zeros after decimal
		return parseFloat(rounded).toString();
	});
}

function minifySvg(svg: string): string {
	// Remove newlines and collapse whitespace between tags
	return svg
		.replace(/\n/g, "")
		.replace(/\r/g, "")
		.replace(/\t/g, " ")
		.replace(/>\s+</g, "><")
		.replace(/\s{2,}/g, " ")
		.trim();
}

// --- Main Optimizer ---

function optimizeSvg(input: string, options: OptimizationOptions): string {
	let svg = input;

	// Pre-DOM string operations
	if (options.removeXmlDeclaration) {
		svg = removeXmlDeclaration(svg);
	}
	if (options.removeDoctype) {
		svg = removeDoctype(svg);
	}
	if (options.removeComments) {
		svg = removeComments(svg);
	}

	// DOM-based operations
	const parser = new DOMParser();
	const doc = parser.parseFromString(svg, "image/svg+xml");

	// Check for parse errors
	const parseError = doc.querySelector("parsererror");
	if (parseError) {
		return svg; // Return as-is if parsing fails
	}

	if (options.removeMetadata) {
		removeMetadataElements(doc);
	}

	if (options.removeHiddenElements) {
		removeHiddenElementsFromDoc(doc);
	}

	if (options.removeEmptyGroups) {
		removeEmptyGroupsFromDoc(doc);
	}

	if (options.collapseGroups) {
		collapseGroupsInDoc(doc);
	}

	// Process all elements for attribute cleanup
	const allElements = doc.querySelectorAll("*");
	allElements.forEach((el) => {
		if (options.removeEmptyAttributes) {
			removeEmptyAttributesFromElement(el);
		}
		if (options.removeDefaultAttributes) {
			removeDefaultAttributesFromElement(el);
		}
	});

	if (options.cleanupIds) {
		cleanupIdsInDoc(doc);
	}

	// Serialize back to string
	const serializer = new XMLSerializer();
	const svgEl = doc.documentElement;
	svg = serializer.serializeToString(svgEl);

	// Remove the xmlns:xlink if not used
	if (!svg.includes("xlink:")) {
		svg = svg.replace(/\s+xmlns:xlink="[^"]*"/, "");
	}

	// Post-DOM string operations
	if (options.roundDecimals) {
		svg = roundDecimalsInString(svg, options.decimalPrecision);
	}

	if (options.minify) {
		svg = minifySvg(svg);
	}

	return svg;
}

// --- Component ---

interface ToggleOptionProps {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

function ToggleOption({ label, checked, onChange }: ToggleOptionProps) {
	return (
		<label className="flex items-center justify-between gap-3 cursor-pointer">
			<span className="text-sm">{label}</span>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				className={`${styles.toggle} ${checked ? styles.active : ""}`}
				onClick={() => onChange(!checked)}
			/>
		</label>
	);
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SvgOptimizer() {
	const [inputSvg, setInputSvg] = useState("");
	const [options, setOptions] = useState<OptimizationOptions>(DEFAULT_OPTIONS);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Compute optimized SVG reactively
	const optimizedSvg = inputSvg ? optimizeSvg(inputSvg, options) : "";

	// Sanitize for preview rendering
	const sanitizedInput = inputSvg ? sanitizeSvg(inputSvg) : "";
	const sanitizedOutput = optimizedSvg ? sanitizeSvg(optimizedSvg) : "";

	// Stats
	const originalSize = new TextEncoder().encode(inputSvg).length;
	const optimizedSize = new TextEncoder().encode(optimizedSvg).length;
	const savings = originalSize > 0 ? ((1 - optimizedSize / originalSize) * 100) : 0;

	const updateOption = useCallback(
		<K extends keyof OptimizationOptions>(key: K, value: OptimizationOptions[K]) => {
			setOptions((prev) => ({ ...prev, [key]: value }));
		},
		[]
	);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (ev) => {
				const text = ev.target?.result;
				if (typeof text === "string") {
					setInputSvg(text);
				}
			};
			reader.readAsText(file);
			// Reset input so same file can be uploaded again
			e.target.value = "";
		},
		[]
	);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch {
			// Silently fail
		}
	}, []);

	const handleDownload = useCallback(() => {
		if (!optimizedSvg) return;
		const blob = new Blob([optimizedSvg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "optimized.svg";
		a.click();
		URL.revokeObjectURL(url);
	}, [optimizedSvg]);

	const handleClear = useCallback(() => {
		setInputSvg("");
	}, []);

	return (
		<div className={`flex flex-col gap-6 ${styles.container}`}>
			{/* Input Section */}
			<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
				<div className="flex items-center justify-between">
					<h2 className={styles.sectionTitle}>SVG Input</h2>
					<div className="flex gap-2">
						<button
							className={styles.primaryBtn}
							onClick={() => fileInputRef.current?.click()}
						>
							<ArrowUpTrayIcon className="w-4 h-4" />
							Upload SVG
						</button>
						{inputSvg && (
							<button className={styles.primaryBtn} onClick={handleClear}>
								Clear
							</button>
						)}
					</div>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept=".svg"
					className="hidden"
					onChange={handleFileUpload}
				/>

				{!inputSvg ? (
					<div
						className={styles.uploadZone}
						onClick={() => fileInputRef.current?.click()}
						onDragOver={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						onDrop={(e) => {
							e.preventDefault();
							e.stopPropagation();
							const file = e.dataTransfer.files[0];
							if (file && file.name.endsWith(".svg")) {
								const reader = new FileReader();
								reader.onload = (ev) => {
									const text = ev.target?.result;
									if (typeof text === "string") {
										setInputSvg(text);
									}
								};
								reader.readAsText(file);
							}
						}}
					>
						<ArrowUpTrayIcon className={`w-10 h-10 mx-auto mb-3 ${styles.uploadIcon}`} />
						<p className="text-sm mb-1">Drag and drop an SVG file here, or click to upload</p>
						<p className="text-xs opacity-60">Or paste SVG code in the textarea below</p>
					</div>
				) : null}

				<textarea
					className={styles.codeArea}
					value={inputSvg}
					onChange={(e) => setInputSvg(e.target.value)}
					placeholder="Paste your SVG code here..."
					spellCheck={false}
				/>
			</div>

			{/* Optimization Options */}
			<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>Optimization Options</h2>

				<div className={styles.optionsGrid}>
					<ToggleOption
						label="Remove comments"
						checked={options.removeComments}
						onChange={(v) => updateOption("removeComments", v)}
					/>
					<ToggleOption
						label="Remove metadata"
						checked={options.removeMetadata}
						onChange={(v) => updateOption("removeMetadata", v)}
					/>
					<ToggleOption
						label="Remove empty attributes"
						checked={options.removeEmptyAttributes}
						onChange={(v) => updateOption("removeEmptyAttributes", v)}
					/>
					<ToggleOption
						label="Remove default attributes"
						checked={options.removeDefaultAttributes}
						onChange={(v) => updateOption("removeDefaultAttributes", v)}
					/>
					<ToggleOption
						label="Minify (remove whitespace)"
						checked={options.minify}
						onChange={(v) => updateOption("minify", v)}
					/>
					<ToggleOption
						label="Remove XML declaration"
						checked={options.removeXmlDeclaration}
						onChange={(v) => updateOption("removeXmlDeclaration", v)}
					/>
					<ToggleOption
						label="Remove DOCTYPE"
						checked={options.removeDoctype}
						onChange={(v) => updateOption("removeDoctype", v)}
					/>
					<ToggleOption
						label="Clean up IDs"
						checked={options.cleanupIds}
						onChange={(v) => updateOption("cleanupIds", v)}
					/>
					<ToggleOption
						label="Remove empty groups"
						checked={options.removeEmptyGroups}
						onChange={(v) => updateOption("removeEmptyGroups", v)}
					/>
					<ToggleOption
						label="Collapse single-child groups"
						checked={options.collapseGroups}
						onChange={(v) => updateOption("collapseGroups", v)}
					/>
					<ToggleOption
						label="Remove hidden elements"
						checked={options.removeHiddenElements}
						onChange={(v) => updateOption("removeHiddenElements", v)}
					/>
					<ToggleOption
						label="Round decimal precision"
						checked={options.roundDecimals}
						onChange={(v) => updateOption("roundDecimals", v)}
					/>
				</div>

				{options.roundDecimals && (
					<div className="mt-2">
						<div className={styles.sliderHeader}>
							<span className={styles.sliderLabel}>Decimal Places</span>
							<span className={styles.sliderValue}>{options.decimalPrecision}</span>
						</div>
						<input
							type="range"
							min="0"
							max="5"
							step="1"
							value={options.decimalPrecision}
							onChange={(e) =>
								updateOption("decimalPrecision", parseInt(e.target.value, 10))
							}
							className={styles.slider}
						/>
					</div>
				)}
			</div>

			{/* Stats */}
			{inputSvg && (
				<div className={`flex flex-wrap items-center justify-center gap-8 p-4 ${styles.glassCard}`}>
					<div className="flex flex-col items-center">
						<span className={styles.statValue}>{formatBytes(originalSize)}</span>
						<span className={styles.statLabel}>Original</span>
					</div>
					<div className="flex flex-col items-center">
						<span className={styles.statValue}>{formatBytes(optimizedSize)}</span>
						<span className={styles.statLabel}>Optimized</span>
					</div>
					<div className="flex flex-col items-center">
						<span className={`${styles.statValue} ${savings > 0 ? styles.savings : ""}`}>
							{savings > 0 ? `-${savings.toFixed(1)}%` : "0%"}
						</span>
						<span className={styles.statLabel}>Savings</span>
					</div>
				</div>
			)}

			{/* Side-by-side Comparison */}
			{inputSvg && (
				<div className={styles.comparisonGrid}>
					{/* Original */}
					<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
						<div className="flex items-center justify-between">
							<h2 className={styles.sectionTitle}>Original</h2>
							<button
								className={styles.primaryBtn}
								onClick={() => handleCopy(inputSvg, "original")}
							>
								{copiedField === "original" ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<ClipboardDocumentIcon className="w-4 h-4" />
								)}
								{copiedField === "original" ? "Copied" : "Copy"}
							</button>
						</div>

						<div
							className={styles.svgPreview}
							dangerouslySetInnerHTML={{ __html: sanitizedInput }}
						/>

						<details>
							<summary className="cursor-pointer text-sm flex items-center gap-2 select-none">
								<CodeBracketIcon className="w-4 h-4 inline" />
								View Code
							</summary>
							<div className={`mt-2 ${styles.codeOutput}`}>{inputSvg}</div>
						</details>
					</div>

					{/* Optimized */}
					<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
						<div className="flex items-center justify-between">
							<h2 className={styles.sectionTitle}>Optimized</h2>
							<div className="flex gap-2">
								<button
									className={styles.primaryBtn}
									onClick={() => handleCopy(optimizedSvg, "optimized")}
								>
									{copiedField === "optimized" ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
									{copiedField === "optimized" ? "Copied" : "Copy"}
								</button>
								<button className={styles.downloadBtn} onClick={handleDownload}>
									<ArrowDownTrayIcon className="w-4 h-4" />
									Download
								</button>
							</div>
						</div>

						<div
							className={styles.svgPreview}
							dangerouslySetInnerHTML={{ __html: sanitizedOutput }}
						/>

						<details>
							<summary className="cursor-pointer text-sm flex items-center gap-2 select-none">
								<CodeBracketIcon className="w-4 h-4 inline" />
								View Code
							</summary>
							<div className={`mt-2 ${styles.codeOutput}`}>{optimizedSvg}</div>
						</details>
					</div>
				</div>
			)}

			{/* Info Section */}
			<div className={`flex flex-col gap-3 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>About SVG Optimization</h2>
				<p className={styles.infoText}>
					This tool optimizes SVG files by removing unnecessary data like comments,
					metadata, empty attributes, and redundant groups. It also minifies the output
					by stripping whitespace and can round decimal precision to reduce file size.
				</p>
				<p className={styles.infoText}>
					All processing is done entirely in your browser -- no data is uploaded to any
					server. For best results, enable all optimizations and adjust decimal precision
					based on the visual quality you need.
				</p>
			</div>
		</div>
	);
}
