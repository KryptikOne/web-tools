"use client";

import { useEffect, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./AsciiTextDrawer.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type FontName =
	| "Standard"
	| "Slant"
	| "Big"
	| "Banner"
	| "Block"
	| "Bubble"
	| "Digital";

const FONTS: FontName[] = [
	"Standard",
	"Slant",
	"Big",
	"Banner",
	"Block",
	"Bubble",
	"Digital",
];

const FONT_LOADERS: Record<FontName, () => Promise<{ default: string }>> = {
	Standard: () => import("figlet/importable-fonts/Standard.js"),
	Slant: () => import("figlet/importable-fonts/Slant.js"),
	Big: () => import("figlet/importable-fonts/Big.js"),
	Banner: () => import("figlet/importable-fonts/Banner.js"),
	Block: () => import("figlet/importable-fonts/Block.js"),
	Bubble: () => import("figlet/importable-fonts/Bubble.js"),
	Digital: () => import("figlet/importable-fonts/Digital.js"),
};

const loadedFonts = new Set<FontName>();

async function loadFont(name: FontName) {
	const figlet = (await import("figlet")).default;
	if (loadedFonts.has(name)) return figlet;
	const fontModule = await FONT_LOADERS[name]();
	figlet.parseFont(name, fontModule.default);
	loadedFonts.add(name);
	return figlet;
}

function renderText(text: string, font: FontName): Promise<string> {
	return new Promise((resolve, reject) => {
		loadFont(font)
			.then((figlet) => {
				figlet.text(text, { font }, (err, result) => {
					if (err) reject(err);
					else resolve(result ?? "");
				});
			})
			.catch(reject);
	});
}

export default function AsciiTextDrawer() {
	const [text, setText] = useState("Hello!");
	const [font, setFont] = useState<FontName>("Standard");
	const [output, setOutput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		let cancelled = false;
		if (!text) {
			setOutput("");
			setError(null);
			return;
		}
		setIsLoading(true);
		setError(null);
		renderText(text, font)
			.then((result) => {
				if (cancelled) return;
				setOutput(result);
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				setError(err instanceof Error ? err.message : "Failed to render banner");
				setOutput("");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [text, font]);

	return (
		<div className={styles.container}>
			{/* Controls */}
			<div className={`flex flex-col gap-4 mb-6 p-4 ${styles.controls}`}>
				<div className="flex flex-col gap-2">
					<label htmlFor="ascii-text" className={styles.label}>
						Text
					</label>
					<input
						id="ascii-text"
						type="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Type text to render as ASCII art..."
						className={styles.input}
						maxLength={64}
					/>
				</div>

				<div className="flex flex-col md:flex-row md:items-end gap-4">
					<div className="flex flex-col gap-2 md:w-64">
						<label htmlFor="ascii-font" className={styles.label}>
							Font
						</label>
						<select
							id="ascii-font"
							value={font}
							onChange={(e) => setFont(e.target.value as FontName)}
							className={styles.select}
						>
							{FONTS.map((f) => (
								<option key={f} value={f}>
									{f}
								</option>
							))}
						</select>
					</div>

					<div className="flex gap-2 md:ml-auto">
						<button
							type="button"
							onClick={() => setText("")}
							className={styles.btnSecondary}
							disabled={!text}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
						<button
							type="button"
							onClick={() => copy(output, "output")}
							className={`${styles.btnPrimary} ${isCopied("output") ? styles.copied : ""}`}
							disabled={!output}
						>
							{isCopied("output") ? (
								<>
									<CheckIcon className="w-4 h-4" />
									Copied!
								</>
							) : (
								<>
									<ClipboardDocumentIcon className="w-4 h-4" />
									Copy
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{error && (
				<div className={`mb-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{error}
				</div>
			)}

			{/* Output */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Banner Output
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Rendered with figlet — font &ldquo;{font}&rdquo;
							{isLoading && <span className={styles.loadingText}> · rendering…</span>}
						</p>
					</div>
				</div>

				<pre className={styles.banner} aria-label="ASCII banner output">
					{output || (isLoading ? "Rendering..." : "Type something above.")}
				</pre>
			</div>

			{/* Info */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>How it works</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Each font is a small data file (a <code>.flf</code>-style definition) that
							maps characters to multi-line ASCII glyphs. We lazy-load only the font you
							pick, so the initial page stays small.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Tips</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Shorter strings work best — most fonts wrap awkwardly past 10–12
							characters. The output is plain text and pastes into any monospace context.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
