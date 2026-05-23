"use client";

import { useState } from "react";
import { formatBytes } from "@/lib/formatUtils";
import styles from "./SvgPreviewPanes.module.scss";

interface SvgPreviewPanesProps {
	original: string;
	optimized: string;
	gzippedSize: number;
	error: string | null;
	isOptimizing: boolean;
}

type ViewMode = "image" | "code";

// Render SVGs in the preview via an <img> data-URI rather than
// dangerouslySetInnerHTML. This isolates each SVG in its own document context
// so internal <style> blocks scope correctly and don't leak into the page.
// Matches the approach SVGOMG itself uses.
function toDataUri(svg: string): string {
	try {
		const utf8 = new TextEncoder().encode(svg);
		let binary = "";
		for (let i = 0; i < utf8.length; i++) binary += String.fromCharCode(utf8[i]);
		return `data:image/svg+xml;base64,${btoa(binary)}`;
	} catch {
		return "";
	}
}

export default function SvgPreviewPanes({
	original,
	optimized,
	gzippedSize,
	error,
	isOptimizing,
}: SvgPreviewPanesProps) {
	const [mode, setMode] = useState<ViewMode>("image");

	const originalSize = new TextEncoder().encode(original).length;
	const optimizedSize = new TextEncoder().encode(optimized).length;
	const savings = originalSize > 0 ? (1 - optimizedSize / originalSize) * 100 : 0;

	const originalHeader = original
		? `Original · ${formatBytes(originalSize)}`
		: "Original";
	const optimizedHeader = optimized
		? `Optimized · ${formatBytes(optimizedSize)} · ${savings.toFixed(1)}% saved · ${formatBytes(gzippedSize)} gzipped`
		: isOptimizing
			? "Optimizing…"
			: "Optimized";

	const originalDataUri = original ? toDataUri(original) : "";
	const optimizedDataUri = optimized ? toDataUri(optimized) : "";

	return (
		<div className={styles.container}>
			<div className={styles.tabBar} role="tablist" aria-label="Preview view mode">
				<button
					type="button"
					className={styles.tab}
					onClick={() => setMode("image")}
					aria-selected={mode === "image"}
					aria-controls="svg-preview-panels"
					role="tab"
				>
					Image
				</button>
				<button
					type="button"
					className={styles.tab}
					onClick={() => setMode("code")}
					aria-selected={mode === "code"}
					aria-controls="svg-preview-panels"
					role="tab"
				>
					Code
				</button>
			</div>

			<div
				id="svg-preview-panels"
				role="tabpanel"
				tabIndex={0}
				className={styles.panes}
			>
				<div className={styles.pane}>
					<div className={styles.paneHeader}>{originalHeader}</div>
					<div
						className={`${styles.paneBody} ${mode === "image" ? styles.imageBody : styles.codeBody}`}
						aria-label="Original SVG preview"
					>
						{original ? (
							mode === "image" ? (
								<img src={originalDataUri} alt="Original SVG" />
							) : (
								<pre>{original}</pre>
							)
						) : (
							<div className={styles.empty}>Paste, upload, or load a demo SVG.</div>
						)}
					</div>
				</div>

				<div className={styles.pane}>
					<div className={styles.paneHeader}>{optimizedHeader}</div>
					<div
						className={`${styles.paneBody} ${mode === "image" ? styles.imageBody : styles.codeBody}`}
						aria-label="Optimized SVG preview"
					>
						{error ? (
							<div className={styles.error}>{error}</div>
						) : optimized ? (
							mode === "image" ? (
								<img src={optimizedDataUri} alt="Optimized SVG" />
							) : (
								<pre>{optimized}</pre>
							)
						) : original ? (
							<div className={styles.empty}>Optimizing…</div>
						) : (
							<div className={styles.empty}>Optimized output will appear here.</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
