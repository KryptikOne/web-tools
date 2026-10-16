"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowsUpDownIcon, SparklesIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import {
	contrastRatio,
	fixContrast,
	parseHexColor,
	rateContrast,
	wcagChecks,
	WCAG_THRESHOLDS,
} from "@/lib/contrastUtils";
import styles from "./ContrastChecker.module.scss";

const DEFAULT_BG = "#1a1a2e";
const DEFAULT_FG = "#eaeaea";

function normalizeHex(value: string): string {
	const clean = value.trim().replace(/^#/, "");
	return `#${clean}`;
}

export default function ContrastChecker() {
	const [background, setBackground] = useState(DEFAULT_BG);
	const [foreground, setForeground] = useState(DEFAULT_FG);

	const bgRgb = parseHexColor(background);
	const fgRgb = parseHexColor(foreground);
	const ratio = useMemo(() => (bgRgb && fgRgb ? contrastRatio(fgRgb, bgRgb) : null), [bgRgb, fgRgb]);
	const checks = ratio !== null ? wcagChecks(ratio) : [];
	const rating = ratio !== null ? rateContrast(ratio) : null;
	const valid = ratio !== null;

	const passesAA = ratio !== null && ratio >= WCAG_THRESHOLDS.aaNormal;
	const passesAAA = ratio !== null && ratio >= WCAG_THRESHOLDS.aaaNormal;

	const applyFix = (target: number) => {
		const fixed = fixContrast(foreground, background, target);
		if (fixed) setForeground(fixed);
	};

	const flip = () => {
		setBackground(foreground);
		setForeground(background);
	};

	return (
		<div className={styles.container}>
			<div className={styles.panel}>
				{/* Colour rows: stacked on phones, side by side from tablet width up */}
				<div className={styles.colorRows}>
					{(
						[
							{ id: "bg", label: "Background", value: background, set: setBackground },
							{ id: "fg", label: "Foreground", value: foreground, set: setForeground },
						] as const
					).map((row) => (
						<div key={row.id} className={styles.colorRow}>
							<ColorPickerPopover color={parseHexColor(row.value) ? normalizeHex(row.value) : "#000000"} onChange={row.set} swatchSize="fill" />
							<div className="flex flex-col gap-1 min-w-0">
								<label htmlFor={`contrast-${row.id}`} className={styles.rowLabel}>
									{row.label}
								</label>
								<input
									id={`contrast-${row.id}`}
									type="text"
									value={row.value}
									onChange={(e) => row.set(e.target.value)}
									onBlur={(e) => {
										if (parseHexColor(e.target.value)) row.set(normalizeHex(e.target.value).toLowerCase());
									}}
									className={`${styles.hexInput} ${parseHexColor(row.value) ? "" : styles.invalid}`}
									maxLength={7}
									spellCheck={false}
									autoComplete="off"
								/>
							</div>
						</div>
					))}
				</div>

				{/* Actions */}
				<div className={styles.actions}>
					<button type="button" className={styles.actionBtn} onClick={flip}>
						<ArrowsUpDownIcon className="w-4 h-4" />
						Flip
					</button>
					<button type="button" className={styles.actionBtn} onClick={() => applyFix(WCAG_THRESHOLDS.aaNormal)} disabled={!valid || passesAA}>
						<SparklesIcon className="w-4 h-4" />
						Fix to AA
					</button>
					<button type="button" className={styles.actionBtn} onClick={() => applyFix(WCAG_THRESHOLDS.aaaNormal)} disabled={!valid || passesAAA}>
						<SparklesIcon className="w-4 h-4" />
						Fix to AAA
					</button>
				</div>

				{/* Ratio */}
				<div className={styles.ratioBlock} aria-live="polite">
					<span className={styles.ratioLabel}>Contrast ratio</span>
					<span className={`${styles.ratioValue} ${rating ? styles[`rating${rating}`] : ""}`}>
						{ratio !== null ? `${ratio.toFixed(2)}:1` : "—"}
					</span>
					<span className={styles.ratioRating}>{rating ?? "Enter two valid hex colours"}</span>
				</div>

				{/* Preview */}
				<div className={styles.sectionHeading}>Preview</div>
				<div
					className={styles.preview}
					style={valid ? { backgroundColor: normalizeHex(background), color: normalizeHex(foreground) } : undefined}
				>
					<p className={styles.previewLarge}>Large text (24px+)</p>
					<p className={styles.previewNormal}>Normal text at 16px. The quick brown fox jumps over the lazy dog.</p>
					<p className={styles.previewSmall}>Small text at 14px for fine print and captions.</p>
				</div>

				{/* WCAG table */}
				<div className={styles.sectionHeading}>WCAG 2.1 compliance</div>
				<div className={styles.checks}>
					{checks.map((c) => (
						<div key={c.id} className={`${styles.check} ${c.passes ? styles.pass : styles.fail}`}>
							<span className={styles.checkLevel}>{c.level}</span>
							<span className={styles.checkText}>
								{c.text} <span className={styles.checkRatio}>{c.minRatio}:1</span>
							</span>
							<span className={styles.checkStatus} role="img" aria-label={c.passes ? "Pass" : "Fail"}>
								{c.passes ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
							</span>
						</div>
					))}
				</div>

				{/* About */}
				<div className={styles.sectionHeading}>About WCAG contrast requirements</div>
				<dl className={styles.about}>
					<div><dt>AA normal</dt><dd>4.5:1 minimum for text smaller than 18pt (or 14pt bold)</dd></div>
					<div><dt>AA large</dt><dd>3:1 minimum for text 18pt and larger (or 14pt bold)</dd></div>
					<div><dt>AAA normal</dt><dd>7:1 minimum for enhanced accessibility</dd></div>
					<div><dt>AAA large</dt><dd>4.5:1 minimum for large text, enhanced accessibility</dd></div>
				</dl>
				<p className={styles.footnote}>
					&ldquo;Fix&rdquo; keeps the foreground hue and saturation and moves only its lightness until the ratio passes.
					Need to explore a colour in depth? Open it in the <Link href={`/tools/color-picker?color=${encodeURIComponent(foreground)}`} className={styles.link}>Color Picker</Link>.
				</p>
			</div>
		</div>
	);
}
