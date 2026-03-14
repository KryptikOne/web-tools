"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./MetaTagGenerator.module.scss";

interface MetaTagState {
	// Basic SEO
	title: string;
	description: string;
	keywords: string;
	author: string;
	robotsIndex: boolean;
	robotsFollow: boolean;

	// Viewport
	viewportWidth: string;
	viewportInitialScale: string;
	viewportMaximumScale: string;
	viewportUserScalable: boolean;

	// Charset
	charset: string;

	// Canonical URL
	canonicalUrl: string;

	// Favicon
	faviconUrl: string;
}

const DEFAULT_STATE: MetaTagState = {
	title: "",
	description: "",
	keywords: "",
	author: "",
	robotsIndex: true,
	robotsFollow: true,

	viewportWidth: "device-width",
	viewportInitialScale: "1.0",
	viewportMaximumScale: "",
	viewportUserScalable: true,

	charset: "UTF-8",

	canonicalUrl: "",

	faviconUrl: "",
};

const CHARSET_OPTIONS = [
	"UTF-8",
	"ISO-8859-1",
	"US-ASCII",
	"UTF-16",
	"Windows-1252",
];

const VIEWPORT_WIDTH_OPTIONS = [
	{ label: "device-width", value: "device-width" },
	{ label: "320px", value: "320" },
	{ label: "480px", value: "480" },
	{ label: "640px", value: "640" },
	{ label: "768px", value: "768" },
	{ label: "1024px", value: "1024" },
];

export default function MetaTagGenerator() {
	const [state, setState] = useState<MetaTagState>(DEFAULT_STATE);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const updateField = <K extends keyof MetaTagState>(
		field: K,
		value: MetaTagState[K]
	) => {
		setState((prev) => ({ ...prev, [field]: value }));
	};

	const generateHtml = useCallback((): string => {
		const lines: string[] = [];

		// Charset
		if (state.charset) {
			lines.push(`<meta charset="${state.charset}">`);
		}

		// Title
		if (state.title) {
			lines.push(`<title>${state.title}</title>`);
		}

		// Description
		if (state.description) {
			lines.push(
				`<meta name="description" content="${state.description}">`
			);
		}

		// Keywords
		if (state.keywords) {
			lines.push(`<meta name="keywords" content="${state.keywords}">`);
		}

		// Author
		if (state.author) {
			lines.push(`<meta name="author" content="${state.author}">`);
		}

		// Robots
		const robotsDirectives: string[] = [];
		robotsDirectives.push(state.robotsIndex ? "index" : "noindex");
		robotsDirectives.push(state.robotsFollow ? "follow" : "nofollow");
		lines.push(
			`<meta name="robots" content="${robotsDirectives.join(", ")}">`
		);

		// Viewport
		const viewportParts: string[] = [];
		if (state.viewportWidth) {
			viewportParts.push(`width=${state.viewportWidth}`);
		}
		if (state.viewportInitialScale) {
			viewportParts.push(
				`initial-scale=${state.viewportInitialScale}`
			);
		}
		if (state.viewportMaximumScale) {
			viewportParts.push(
				`maximum-scale=${state.viewportMaximumScale}`
			);
		}
		if (!state.viewportUserScalable) {
			viewportParts.push("user-scalable=no");
		}
		if (viewportParts.length > 0) {
			lines.push(
				`<meta name="viewport" content="${viewportParts.join(", ")}">`
			);
		}

		// Canonical URL
		if (state.canonicalUrl) {
			lines.push(`<link rel="canonical" href="${state.canonicalUrl}">`);
		}

		// Favicon
		if (state.faviconUrl) {
			lines.push(
				`<link rel="icon" type="image/x-icon" href="${state.faviconUrl}">`
			);
		}

		return lines.join("\n");
	}, [state]);

	const generatedHtml = useMemo(() => generateHtml(), [generateHtml]);

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleReset = () => {
		setState(DEFAULT_STATE);
	};

	const hasContent = generatedHtml.length > 0;

	return (
		<div className={styles.container}>
			<div className="flex flex-col gap-6">
				{/* Basic SEO Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Basic SEO</h2>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label className={`text-sm font-medium ${styles.label}`}>
								Title
							</label>
							<input
								type="text"
								value={state.title}
								onChange={(e) => updateField("title", e.target.value)}
								placeholder="My Website Title"
								className={styles.input}
								maxLength={70}
							/>
							<span className={`text-xs ${styles.hint}`}>
								{state.title.length}/70 characters recommended
							</span>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className={`text-sm font-medium ${styles.label}`}>
								Description
							</label>
							<textarea
								value={state.description}
								onChange={(e) =>
									updateField("description", e.target.value)
								}
								placeholder="A brief description of your page content..."
								className={styles.textarea}
								rows={3}
								maxLength={160}
							/>
							<span className={`text-xs ${styles.hint}`}>
								{state.description.length}/160 characters recommended
							</span>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className={`text-sm font-medium ${styles.label}`}>
								Keywords
							</label>
							<input
								type="text"
								value={state.keywords}
								onChange={(e) => updateField("keywords", e.target.value)}
								placeholder="web tools, meta tags, seo"
								className={styles.input}
							/>
							<span className={`text-xs ${styles.hint}`}>
								Comma-separated list of keywords
							</span>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className={`text-sm font-medium ${styles.label}`}>
								Author
							</label>
							<input
								type="text"
								value={state.author}
								onChange={(e) => updateField("author", e.target.value)}
								placeholder="John Doe"
								className={styles.input}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label className={`text-sm font-medium ${styles.label}`}>
								Robots
							</label>
							<div className="flex gap-6">
								<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
									<input
										type="checkbox"
										checked={state.robotsIndex}
										onChange={(e) =>
											updateField("robotsIndex", e.target.checked)
										}
										className={styles.checkbox}
									/>
									<span>Index</span>
								</label>
								<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
									<input
										type="checkbox"
										checked={state.robotsFollow}
										onChange={(e) =>
											updateField("robotsFollow", e.target.checked)
										}
										className={styles.checkbox}
									/>
									<span>Follow</span>
								</label>
							</div>
						</div>
					</div>
				</div>

				{/* Viewport Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Viewport</h2>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label className={`text-sm font-medium ${styles.label}`}>
								Width
							</label>
							<select
								value={state.viewportWidth}
								onChange={(e) =>
									updateField("viewportWidth", e.target.value)
								}
								className={styles.select}
							>
								{VIEWPORT_WIDTH_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						<div className={`grid gap-4 ${styles.twoColGrid}`}>
							<div className="flex flex-col gap-1.5">
								<label className={`text-sm font-medium ${styles.label}`}>
									Initial Scale
								</label>
								<input
									type="text"
									value={state.viewportInitialScale}
									onChange={(e) =>
										updateField("viewportInitialScale", e.target.value)
									}
									placeholder="1.0"
									className={styles.input}
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className={`text-sm font-medium ${styles.label}`}>
									Maximum Scale
								</label>
								<input
									type="text"
									value={state.viewportMaximumScale}
									onChange={(e) =>
										updateField("viewportMaximumScale", e.target.value)
									}
									placeholder="5.0"
									className={styles.input}
								/>
							</div>
						</div>

						<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={state.viewportUserScalable}
								onChange={(e) =>
									updateField("viewportUserScalable", e.target.checked)
								}
								className={styles.checkbox}
							/>
							<span>User Scalable</span>
						</label>
					</div>
				</div>

				{/* Charset Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Charset</h2>
					<div className="flex flex-col gap-1.5">
						<label className={`text-sm font-medium ${styles.label}`}>
							Character Encoding
						</label>
						<select
							value={state.charset}
							onChange={(e) => updateField("charset", e.target.value)}
							className={styles.select}
						>
							{CHARSET_OPTIONS.map((charset) => (
								<option key={charset} value={charset}>
									{charset}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Canonical URL Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Canonical URL</h2>
					<div className="flex flex-col gap-1.5">
						<label className={`text-sm font-medium ${styles.label}`}>
							Canonical Link
						</label>
						<input
							type="url"
							value={state.canonicalUrl}
							onChange={(e) =>
								updateField("canonicalUrl", e.target.value)
							}
							placeholder="https://www.example.com/page"
							className={styles.input}
						/>
						<span className={`text-xs ${styles.hint}`}>
							The preferred URL for this page to avoid duplicate content
						</span>
					</div>
				</div>

				{/* Favicon Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Favicon</h2>
					<div className="flex flex-col gap-1.5">
						<label className={`text-sm font-medium ${styles.label}`}>
							Favicon URL
						</label>
						<input
							type="url"
							value={state.faviconUrl}
							onChange={(e) =>
								updateField("faviconUrl", e.target.value)
							}
							placeholder="/favicon.ico"
							className={styles.input}
						/>
						<span className={`text-xs ${styles.hint}`}>
							Path or URL to your site&apos;s favicon
						</span>
					</div>
				</div>

				{/* Generated Output Section */}
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={styles.sectionTitle}>Generated Meta Tags</h2>
						<div className="flex gap-2">
							<button
								className={styles.resetBtn}
								onClick={handleReset}
								title="Reset all fields"
							>
								<ArrowPathIcon className="w-4 h-4" />
								Reset
							</button>
							<button
								className={`${styles.copyBtn} ${copiedField === "html" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(generatedHtml, "html")}
								disabled={!hasContent}
								title="Copy to clipboard"
							>
								{copiedField === "html" ? (
									<>
										<CheckIcon className="w-4 h-4" />
										Copied
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
					<div className={`rounded-lg p-4 ${styles.outputSection}`}>
						<pre className={styles.codeBlock}>
							<code className={`text-sm font-mono ${styles.outputCode}`}>
								{hasContent
									? generatedHtml
									: "<!-- Fill in the fields above to generate meta tags -->"}
							</code>
						</pre>
					</div>
				</div>
			</div>
		</div>
	);
}
