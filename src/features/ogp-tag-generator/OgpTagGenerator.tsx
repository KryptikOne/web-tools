"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./OgpTagGenerator.module.scss";

interface OgpFormData {
	ogTitle: string;
	ogDescription: string;
	ogUrl: string;
	ogImage: string;
	ogType: string;
	ogSiteName: string;
	ogLocale: string;
	twitterCard: string;
	twitterSite: string;
	twitterCreator: string;
}

const DEFAULT_FORM: OgpFormData = {
	ogTitle: "",
	ogDescription: "",
	ogUrl: "",
	ogImage: "",
	ogType: "website",
	ogSiteName: "",
	ogLocale: "en_US",
	twitterCard: "summary_large_image",
	twitterSite: "",
	twitterCreator: "",
};

const OG_TYPES = [
	{ value: "website", label: "Website" },
	{ value: "article", label: "Article" },
	{ value: "product", label: "Product" },
	{ value: "profile", label: "Profile" },
	{ value: "video", label: "Video" },
	{ value: "music", label: "Music" },
];

const TWITTER_CARD_TYPES = [
	{ value: "summary", label: "Summary" },
	{ value: "summary_large_image", label: "Summary Large Image" },
	{ value: "app", label: "App" },
	{ value: "player", label: "Player" },
];

export default function OgpTagGenerator() {
	const [form, setForm] = useState<OgpFormData>(DEFAULT_FORM);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [imageError, setImageError] = useState(false);

	const updateField = (field: keyof OgpFormData, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (field === "ogImage") {
			setImageError(false);
		}
	};

	const generateMetaTags = useCallback((): string => {
		const tags: string[] = [];

		if (form.ogTitle) {
			tags.push(`<meta property="og:title" content="${form.ogTitle}" />`);
		}
		if (form.ogDescription) {
			tags.push(
				`<meta property="og:description" content="${form.ogDescription}" />`
			);
		}
		if (form.ogUrl) {
			tags.push(`<meta property="og:url" content="${form.ogUrl}" />`);
		}
		if (form.ogImage) {
			tags.push(`<meta property="og:image" content="${form.ogImage}" />`);
		}
		if (form.ogType) {
			tags.push(`<meta property="og:type" content="${form.ogType}" />`);
		}
		if (form.ogSiteName) {
			tags.push(
				`<meta property="og:site_name" content="${form.ogSiteName}" />`
			);
		}
		if (form.ogLocale) {
			tags.push(
				`<meta property="og:locale" content="${form.ogLocale}" />`
			);
		}

		// Twitter Card tags
		if (form.twitterCard) {
			tags.push(
				`<meta name="twitter:card" content="${form.twitterCard}" />`
			);
		}
		if (form.twitterSite) {
			tags.push(
				`<meta name="twitter:site" content="${form.twitterSite}" />`
			);
		}
		if (form.twitterCreator) {
			tags.push(
				`<meta name="twitter:creator" content="${form.twitterCreator}" />`
			);
		}
		if (form.ogTitle) {
			tags.push(
				`<meta name="twitter:title" content="${form.ogTitle}" />`
			);
		}
		if (form.ogDescription) {
			tags.push(
				`<meta name="twitter:description" content="${form.ogDescription}" />`
			);
		}
		if (form.ogImage) {
			tags.push(
				`<meta name="twitter:image" content="${form.ogImage}" />`
			);
		}

		return tags.join("\n");
	}, [form]);

	const generatedHtml = useMemo(() => generateMetaTags(), [generateMetaTags]);

	const hasContent = useMemo(() => {
		return (
			form.ogTitle ||
			form.ogDescription ||
			form.ogUrl ||
			form.ogImage ||
			form.ogSiteName
		);
	}, [form]);

	const copyToClipboard = async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const resetForm = () => {
		setForm(DEFAULT_FORM);
		setImageError(false);
	};

	const displayUrl = useMemo(() => {
		if (!form.ogUrl) return "example.com";
		try {
			const url = new URL(form.ogUrl);
			return url.hostname;
		} catch {
			return form.ogUrl;
		}
	}, [form.ogUrl]);

	return (
		<div className={styles.container}>
			<div className={`mb-6 ${styles.mainGrid}`}>
				{/* Form Section */}
				<div className="flex flex-col gap-6">
					{/* Open Graph Properties */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-4">
							<h2 className={styles.sectionTitle}>
								Open Graph Properties
							</h2>
							<button
								className={styles.resetBtn}
								onClick={resetForm}
								title="Reset all fields"
							>
								<ArrowPathIcon className="w-4 h-4" />
							</button>
						</div>

						<div className="flex flex-col gap-4">
							<div className={styles.fieldGroup}>
								<label className={styles.fieldLabel}>
									og:title
								</label>
								<input
									type="text"
									value={form.ogTitle}
									onChange={(e) =>
										updateField("ogTitle", e.target.value)
									}
									placeholder="Your page title"
									className={styles.inputField}
								/>
							</div>

							<div className={styles.fieldGroup}>
								<label className={styles.fieldLabel}>
									og:description
								</label>
								<textarea
									value={form.ogDescription}
									onChange={(e) =>
										updateField(
											"ogDescription",
											e.target.value
										)
									}
									placeholder="A brief description of your page content"
									className={styles.textareaField}
									rows={3}
								/>
							</div>

							<div className={styles.fieldGroup}>
								<label className={styles.fieldLabel}>
									og:url
								</label>
								<input
									type="text"
									value={form.ogUrl}
									onChange={(e) =>
										updateField("ogUrl", e.target.value)
									}
									placeholder="https://example.com/page"
									className={styles.inputField}
								/>
							</div>

							<div className={styles.fieldGroup}>
								<label className={styles.fieldLabel}>
									og:image
								</label>
								<input
									type="text"
									value={form.ogImage}
									onChange={(e) =>
										updateField("ogImage", e.target.value)
									}
									placeholder="https://example.com/image.jpg"
									className={styles.inputField}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>
										og:type
									</label>
									<select
										value={form.ogType}
										onChange={(e) =>
											updateField(
												"ogType",
												e.target.value
											)
										}
										className={styles.selectField}
									>
										{OG_TYPES.map((type) => (
											<option
												key={type.value}
												value={type.value}
											>
												{type.label}
											</option>
										))}
									</select>
								</div>

								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>
										og:locale
									</label>
									<input
										type="text"
										value={form.ogLocale}
										onChange={(e) =>
											updateField(
												"ogLocale",
												e.target.value
											)
										}
										placeholder="en_US"
										className={styles.inputField}
									/>
								</div>
							</div>

							<div className={styles.fieldGroup}>
								<label className={styles.fieldLabel}>
									og:site_name
								</label>
								<input
									type="text"
									value={form.ogSiteName}
									onChange={(e) =>
										updateField(
											"ogSiteName",
											e.target.value
										)
									}
									placeholder="Your Site Name"
									className={styles.inputField}
								/>
							</div>
						</div>
					</div>

					{/* Twitter Card Properties */}
					<div className={styles.glassCard}>
						<h2 className={`mb-4 ${styles.sectionTitle}`}>
							Twitter Card
						</h2>

						<div className="flex flex-col gap-4">
							<div className={styles.fieldGroup}>
								<label className={styles.fieldLabel}>
									twitter:card
								</label>
								<select
									value={form.twitterCard}
									onChange={(e) =>
										updateField(
											"twitterCard",
											e.target.value
										)
									}
									className={styles.selectField}
								>
									{TWITTER_CARD_TYPES.map((type) => (
										<option
											key={type.value}
											value={type.value}
										>
											{type.label}
										</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>
										twitter:site
									</label>
									<input
										type="text"
										value={form.twitterSite}
										onChange={(e) =>
											updateField(
												"twitterSite",
												e.target.value
											)
										}
										placeholder="@yoursite"
										className={styles.inputField}
									/>
								</div>

								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>
										twitter:creator
									</label>
									<input
										type="text"
										value={form.twitterCreator}
										onChange={(e) =>
											updateField(
												"twitterCreator",
												e.target.value
											)
										}
										placeholder="@author"
										className={styles.inputField}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Preview & Output Section */}
				<div className="flex flex-col gap-6">
					{/* Social Media Preview */}
					<div className={styles.glassCard}>
						<h2 className={`mb-4 ${styles.sectionTitle}`}>
							Preview
						</h2>

						<div className={styles.previewCard}>
							{form.ogImage && !imageError ? (
								<div className={styles.previewImageWrapper}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={form.ogImage}
										alt="OG Preview"
										className={styles.previewImage}
										onError={() => setImageError(true)}
									/>
								</div>
							) : (
								<div className={styles.previewImagePlaceholder}>
									<span className={styles.placeholderText}>
										{imageError
											? "Image failed to load"
											: "No image URL provided"}
									</span>
								</div>
							)}

							<div className={styles.previewContent}>
								<span className={styles.previewDomain}>
									{displayUrl}
								</span>
								<h3 className={styles.previewTitle}>
									{form.ogTitle || "Page Title"}
								</h3>
								<p className={styles.previewDescription}>
									{form.ogDescription ||
										"Page description will appear here. Add a description to see how it looks in the social media card preview."}
								</p>
							</div>
						</div>
					</div>

					{/* Generated HTML */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-4">
							<h2 className={styles.sectionTitle}>
								Generated Meta Tags
							</h2>
							{hasContent && (
								<button
									className={`${styles.copyBtn} ${copiedField === "html" ? styles.copied : ""}`}
									onClick={() =>
										copyToClipboard(generatedHtml, "html")
									}
									title="Copy to clipboard"
								>
									{copiedField === "html" ? (
										<>
											<CheckIcon
												className={styles.copyIcon}
											/>
											<span className="text-xs">
												Copied
											</span>
										</>
									) : (
										<>
											<ClipboardDocumentIcon
												className={styles.copyIcon}
											/>
											<span className="text-xs">
												Copy
											</span>
										</>
									)}
								</button>
							)}
						</div>

						<div className={styles.codeOutput}>
							{hasContent ? (
								<pre className={styles.codeBlock}>
									<code>{generatedHtml}</code>
								</pre>
							) : (
								<p className={styles.emptyState}>
									Fill in the form fields to generate meta
									tags.
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>
					About Open Graph Tags
				</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>What is OGP?</h3>
						<p className={styles.infoText}>
							The Open Graph Protocol enables any web page to
							become a rich object in a social graph. It is used
							by Facebook, LinkedIn, Discord, and other platforms
							to display rich link previews.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Image Guidelines</h3>
						<p className={styles.infoText}>
							Use images at least <code>1200x630</code> pixels for
							best results. Facebook recommends a 1.91:1 aspect
							ratio. Keep file size under 8MB and use{" "}
							<code>jpg</code> or <code>png</code> format.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Twitter Cards</h3>
						<p className={styles.infoText}>
							Twitter Cards use their own meta tags but fall back
							to Open Graph tags. The{" "}
							<code>summary_large_image</code> card type displays
							a prominent image above the content summary.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Placement</h3>
						<p className={styles.infoText}>
							Place all meta tags inside the{" "}
							<code>&lt;head&gt;</code> section of your HTML
							document. They should be as close to the top as
							possible for optimal crawler performance.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
