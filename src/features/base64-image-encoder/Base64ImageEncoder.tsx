"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	PhotoIcon,
	CodeBracketIcon,
	ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import styles from "./Base64ImageEncoder.module.scss";
import { formatBytes } from "@/lib/formatUtils";

type Mode = "encode" | "decode";

interface ImageInfo {
	width: number;
	height: number;
	size: number;
	type: string;
	name: string;
}

export default function Base64ImageEncoder() {
	const [mode, setMode] = useState<Mode>("encode");
	const [base64String, setBase64String] = useState("");
	const [includePrefix, setIncludePrefix] = useState(true);
	const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
	const [previewSrc, setPreviewSrc] = useState<string | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [decodeInput, setDecodeInput] = useState("");
	const [decodedSrc, setDecodedSrc] = useState<string | null>(null);
	const [decodedInfo, setDecodedInfo] = useState<{ width: number; height: number } | null>(null);
	const [decodeError, setDecodeError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const rawBase64Ref = useRef("");
	const dataUriRef = useRef("");

	// Copy to clipboard
	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Process uploaded file
	const processFile = useCallback((file: File) => {
		if (!file.type.startsWith("image/")) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUri = e.target?.result as string;
			dataUriRef.current = dataUri;

			// Extract raw base64 (without prefix)
			const commaIndex = dataUri.indexOf(",");
			const raw = commaIndex !== -1 ? dataUri.substring(commaIndex + 1) : dataUri;
			rawBase64Ref.current = raw;

			setBase64String(dataUri);
			setPreviewSrc(dataUri);
			setIncludePrefix(true);

			// Get image dimensions
			const img = new Image();
			img.onload = () => {
				setImageInfo({
					width: img.naturalWidth,
					height: img.naturalHeight,
					size: file.size,
					type: file.type,
					name: file.name,
				});
			};
			img.src = dataUri;
		};
		reader.readAsDataURL(file);
	}, []);

	// Update base64 string when prefix toggle changes
	useEffect(() => {
		if (!rawBase64Ref.current) return;
		setBase64String(includePrefix ? dataUriRef.current : rawBase64Ref.current);
	}, [includePrefix]);

	// Drag and drop handlers
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) processFile(file);
		},
		[processFile]
	);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) processFile(file);
		},
		[processFile]
	);

	// Decode Base64 to image
	const handleDecode = useCallback((input: string) => {
		setDecodeInput(input);
		setDecodeError(null);
		setDecodedSrc(null);
		setDecodedInfo(null);

		if (!input.trim()) return;

		// Auto-detect and normalize the input
		let src = input.trim();
		const hasPrefix = /^data:image\/[a-zA-Z+]+;base64,/.test(src);
		if (!hasPrefix) {
			// Try to detect if it's valid base64 and add a generic prefix
			try {
				atob(src.substring(0, 100)); // Test a small chunk
				src = `data:image/png;base64,${src}`;
			} catch {
				setDecodeError("Invalid Base64 string. Please check your input.");
				return;
			}
		}

		const img = new Image();
		img.onload = () => {
			setDecodedSrc(src);
			setDecodedInfo({ width: img.naturalWidth, height: img.naturalHeight });
		};
		img.onerror = () => {
			setDecodeError("Failed to decode image. The Base64 string may be invalid or corrupted.");
		};
		img.src = src;
	}, []);

	// Download decoded image
	const handleDownload = useCallback(() => {
		if (!decodedSrc) return;

		const link = document.createElement("a");
		link.href = decodedSrc;

		// Extract extension from data URI
		const match = decodedSrc.match(/^data:image\/([a-zA-Z+]+);/);
		const ext = match ? match[1].replace("+xml", "") : "png";
		link.download = `decoded-image.${ext}`;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [decodedSrc]);

	// Clear encode state
	const handleClearEncode = () => {
		setBase64String("");
		setPreviewSrc(null);
		setImageInfo(null);
		rawBase64Ref.current = "";
		dataUriRef.current = "";
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	// Derived values for encode mode
	const displayBase64 = base64String;
	const base64Length = displayBase64.length;
	const estimatedSize = formatBytes(Math.ceil((rawBase64Ref.current.length * 3) / 4));

	const htmlSnippet = previewSrc
		? `<img src="${dataUriRef.current}" alt="Base64 encoded image" />`
		: "";
	const cssSnippet = previewSrc
		? `background-image: url('${dataUriRef.current}');`
		: "";

	return (
		<div className={styles.container}>
			{/* Mode Tabs */}
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm ${styles.tab} ${mode === "encode" ? styles.tabActive : ""}`}
					onClick={() => setMode("encode")}
				>
					<PhotoIcon className="w-4 h-4" />
					Encode
				</button>
				<button
					className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm ${styles.tab} ${mode === "decode" ? styles.tabActive : ""}`}
					onClick={() => setMode("decode")}
				>
					<CodeBracketIcon className="w-4 h-4" />
					Decode
				</button>
			</div>

			{mode === "encode" ? (
				<div className={`flex flex-col gap-6 ${styles.encodeLayout}`}>
					{/* Upload Area */}
					<div className={styles.glassCard}>
						<h2 className={styles.sectionTitle}>Upload Image</h2>
						<div
							className={`flex flex-col items-center justify-center gap-4 p-8 rounded-lg cursor-pointer ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={() => fileInputRef.current?.click()}
						>
							<PhotoIcon className={`w-12 h-12 ${styles.dropIcon}`} />
							<div className="text-center">
								<p className={`text-sm font-medium mb-1 ${styles.dropText}`}>
									Drop an image here or click to browse
								</p>
								<p className={`text-xs ${styles.dropHint}`}>
									Supports PNG, JPG, GIF, SVG, WebP, and more
								</p>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
								aria-label="Upload image"
							/>
						</div>
					</div>

					{/* Image Preview & Info */}
					{previewSrc && imageInfo && (
						<div className={styles.glassCard}>
							<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
								<h2 className={styles.sectionTitle}>Preview</h2>
								<button onClick={handleClearEncode} className={styles.btnSecondary}>
									Clear
								</button>
							</div>
							<div className={`flex items-center justify-center p-4 rounded-lg mb-4 ${styles.previewContainer}`}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={previewSrc}
									alt="Uploaded preview"
									className={`max-w-full max-h-80 rounded ${styles.previewImage}`}
								/>
							</div>
							<div className="flex flex-wrap gap-4 text-sm">
								<span className={styles.infoChip}>
									{imageInfo.width} x {imageInfo.height}
								</span>
								<span className={styles.infoChip}>
									{formatBytes(imageInfo.size)}
								</span>
								<span className={styles.infoChip}>
									{imageInfo.type}
								</span>
								<span className={styles.infoChip}>
									{imageInfo.name}
								</span>
							</div>
						</div>
					)}

					{/* Base64 Output */}
					{base64String && (
						<div className={styles.glassCard}>
							<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
								<h2 className={styles.sectionTitle}>Base64 Output</h2>
								<div className="flex items-center gap-4 flex-wrap">
									<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.toggleLabel}`}>
										<input
											type="checkbox"
											checked={includePrefix}
											onChange={(e) => setIncludePrefix(e.target.checked)}
											className={styles.checkbox}
										/>
										Include data URI prefix
									</label>
									<button
										onClick={() => handleCopy(displayBase64, "base64")}
										className={`${styles.btnPrimary} ${copiedField === "base64" ? styles.copied : ""}`}
									>
										{copiedField === "base64" ? (
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

							<textarea
								value={displayBase64}
								readOnly
								className={`${styles.textarea} ${styles.readOnly}`}
								spellCheck={false}
							/>

							<div className="flex gap-4 mt-3 text-xs">
								<span className={styles.statText}>
									Length: {base64Length.toLocaleString()} chars
								</span>
								<span className={styles.statText}>
									Estimated size: {estimatedSize}
								</span>
							</div>
						</div>
					)}

					{/* Code Snippets */}
					{previewSrc && (
						<div className={styles.glassCard}>
							<h2 className={styles.sectionTitle}>Code Snippets</h2>
							<div className="flex flex-col gap-4">
								{/* HTML snippet */}
								<div>
									<div className="flex justify-between items-center mb-2">
										<span className={styles.inputLabel}>HTML &lt;img&gt; Tag</span>
										<button
											onClick={() => handleCopy(htmlSnippet, "html")}
											className={`${styles.copyBtn} ${copiedField === "html" ? styles.copied : ""}`}
										>
											{copiedField === "html" ? (
												<CheckIcon className={styles.copyIcon} />
											) : (
												<ClipboardDocumentIcon className={styles.copyIcon} />
											)}
										</button>
									</div>
									<pre className={`text-xs p-3 rounded-lg overflow-x-auto ${styles.codeBlock}`}>
										<code>{htmlSnippet}</code>
									</pre>
								</div>

								{/* CSS snippet */}
								<div>
									<div className="flex justify-between items-center mb-2">
										<span className={styles.inputLabel}>CSS Background</span>
										<button
											onClick={() => handleCopy(cssSnippet, "css")}
											className={`${styles.copyBtn} ${copiedField === "css" ? styles.copied : ""}`}
										>
											{copiedField === "css" ? (
												<CheckIcon className={styles.copyIcon} />
											) : (
												<ClipboardDocumentIcon className={styles.copyIcon} />
											)}
										</button>
									</div>
									<pre className={`text-xs p-3 rounded-lg overflow-x-auto ${styles.codeBlock}`}>
										<code>{cssSnippet}</code>
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>
			) : (
				/* Decode Mode */
				<div className={`flex flex-col gap-6 ${styles.decodeLayout}`}>
					<div className={styles.glassCard}>
						<h2 className={styles.sectionTitle}>Paste Base64 String</h2>
						<textarea
							value={decodeInput}
							onChange={(e) => handleDecode(e.target.value)}
							placeholder="Paste a Base64 image string here (with or without data URI prefix)..."
							className={styles.textarea}
							spellCheck={false}
						/>
						{decodeInput && (
							<div className="flex gap-4 mt-3 text-xs">
								<span className={styles.statText}>
									Length: {decodeInput.length.toLocaleString()} chars
								</span>
								<span className={styles.statText}>
									{/^data:image\//.test(decodeInput.trim()) ? "Data URI detected" : "Raw Base64"}
								</span>
							</div>
						)}
						{decodeError && (
							<p className={`text-sm mt-3 ${styles.errorText}`}>{decodeError}</p>
						)}
					</div>

					{/* Decoded Preview */}
					{decodedSrc && decodedInfo && (
						<div className={styles.glassCard}>
							<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
								<h2 className={styles.sectionTitle}>Decoded Image</h2>
								<button onClick={handleDownload} className={styles.btnPrimary}>
									<ArrowDownTrayIcon className="w-4 h-4" />
									Download
								</button>
							</div>
							<div className={`flex items-center justify-center p-4 rounded-lg mb-4 ${styles.previewContainer}`}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={decodedSrc}
									alt="Decoded preview"
									className={`max-w-full max-h-80 rounded ${styles.previewImage}`}
								/>
							</div>
							<div className="flex flex-wrap gap-4 text-sm">
								<span className={styles.infoChip}>
									{decodedInfo.width} x {decodedInfo.height}
								</span>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.infoTitle}`}>About Base64 Image Encoding</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>What is Base64?</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Base64 is a binary-to-text encoding scheme that represents binary data using 64 ASCII characters. It is commonly used to embed images directly in HTML, CSS, or JSON without separate file requests.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>When to Use It</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Base64 encoding is ideal for small images like icons and logos (under 10KB). For larger images, separate files are more efficient since Base64 increases size by approximately 33%.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Data URI Format</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							A data URI includes the MIME type prefix: <code className={styles.codeInline}>data:image/png;base64,...</code>. This tells the browser how to interpret the encoded data.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Size Considerations</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Base64 encoding increases file size by about 33%. A 10KB image becomes roughly 13.3KB as Base64. Factor this into performance decisions, especially for mobile users.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
