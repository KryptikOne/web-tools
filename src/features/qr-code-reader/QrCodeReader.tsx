"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import jsQR from "jsqr";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	QrCodeIcon,
	LinkIcon,
	ArrowTopRightOnSquareIcon,
	XMarkIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import styles from "./QrCodeReader.module.scss";

// --- Content type detection ---

type ContentType = "url" | "email" | "phone" | "wifi" | "vcard" | "text";

interface WifiConfig {
	ssid: string;
	password: string;
	encryption: string;
	hidden: boolean;
}

interface QrResult {
	data: string;
	contentType: ContentType;
	location: {
		topLeftCorner: { x: number; y: number };
		topRightCorner: { x: number; y: number };
		bottomLeftCorner: { x: number; y: number };
		bottomRightCorner: { x: number; y: number };
	};
}

function detectContentType(data: string): ContentType {
	const trimmed = data.trim();

	if (/^https?:\/\//i.test(trimmed)) return "url";
	if (/^mailto:/i.test(trimmed)) return "email";
	if (/^tel:/i.test(trimmed)) return "phone";
	if (/^WIFI:/i.test(trimmed)) return "wifi";
	if (/^BEGIN:VCARD/i.test(trimmed)) return "vcard";

	return "text";
}

function parseWifiConfig(data: string): WifiConfig {
	const ssidMatch = data.match(/S:([^;]*)/);
	const passMatch = data.match(/P:([^;]*)/);
	const typeMatch = data.match(/T:([^;]*)/);
	const hiddenMatch = data.match(/H:(true|false)/i);

	return {
		ssid: ssidMatch?.[1] ?? "",
		password: passMatch?.[1] ?? "",
		encryption: typeMatch?.[1] ?? "WPA",
		hidden: hiddenMatch?.[1]?.toLowerCase() === "true",
	};
}

function parseEmail(data: string): { address: string; subject: string; body: string } {
	const withoutScheme = data.replace(/^mailto:/i, "");
	const [address, queryString] = withoutScheme.split("?");
	const params = new URLSearchParams(queryString ?? "");

	return {
		address: address ?? "",
		subject: params.get("subject") ?? "",
		body: params.get("body") ?? "",
	};
}

function parsePhone(data: string): string {
	return data.replace(/^tel:/i, "");
}

function contentTypeLabel(type: ContentType): string {
	switch (type) {
		case "url":
			return "URL";
		case "email":
			return "Email";
		case "phone":
			return "Phone";
		case "wifi":
			return "WiFi";
		case "vcard":
			return "vCard";
		case "text":
			return "Text";
	}
}

// --- Component ---

export default function QrCodeReader() {
	const [result, setResult] = useState<QrResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [copied, setCopied] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

	const resetState = useCallback(() => {
		setResult(null);
		setError(null);
		setImageSrc(null);
		setImageSize(null);
		setCopied(false);
	}, []);

	const decodeImage = useCallback((file: File | Blob) => {
		setResult(null);
		setError(null);
		setCopied(false);

		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			setImageSrc(dataUrl);

			const img = new Image();
			img.onload = () => {
				setImageSize({ width: img.width, height: img.height });

				const canvas = canvasRef.current;
				if (!canvas) return;

				canvas.width = img.width;
				canvas.height = img.height;

				const ctx = canvas.getContext("2d");
				if (!ctx) return;

				ctx.drawImage(img, 0, 0);
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const code = jsQR(imageData.data, imageData.width, imageData.height);

				if (code) {
					setResult({
						data: code.data,
						contentType: detectContentType(code.data),
						location: code.location,
					});
				} else {
					setError("No QR code found in this image. Try a clearer image or ensure the QR code is fully visible.");
				}
			};
			img.onerror = () => {
				setError("Failed to load image. Please try a different file.");
			};
			img.src = dataUrl;
		};
		reader.onerror = () => {
			setError("Failed to read file.");
		};
		reader.readAsDataURL(file);
	}, []);

	// Draw QR location overlay
	useEffect(() => {
		if (!result || !imageSize || !overlayCanvasRef.current || !imageRef.current) return;

		const img = imageRef.current;
		const overlay = overlayCanvasRef.current;

		// Match overlay to displayed image size
		const displayWidth = img.clientWidth;
		const displayHeight = img.clientHeight;
		overlay.width = displayWidth;
		overlay.height = displayHeight;

		const scaleX = displayWidth / imageSize.width;
		const scaleY = displayHeight / imageSize.height;

		const ctx = overlay.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, overlay.width, overlay.height);

		const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = result.location;

		ctx.beginPath();
		ctx.moveTo(topLeftCorner.x * scaleX, topLeftCorner.y * scaleY);
		ctx.lineTo(topRightCorner.x * scaleX, topRightCorner.y * scaleY);
		ctx.lineTo(bottomRightCorner.x * scaleX, bottomRightCorner.y * scaleY);
		ctx.lineTo(bottomLeftCorner.x * scaleX, bottomLeftCorner.y * scaleY);
		ctx.closePath();

		ctx.strokeStyle = "oklch(55% 0.196 311.1)";
		ctx.lineWidth = 3;
		ctx.stroke();

		ctx.fillStyle = "oklch(55% 0.196 311.1 / 0.15)";
		ctx.fill();
	}, [result, imageSize]);

	// File input handler
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) decodeImage(file);
		// Reset so same file can be re-selected
		e.target.value = "";
	};

	// Drag and drop handlers
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			decodeImage(file);
		} else {
			setError("Please drop an image file (PNG, JPG, etc.).");
		}
	};

	// Clipboard paste handler
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (const item of items) {
				if (item.type.startsWith("image/")) {
					e.preventDefault();
					const blob = item.getAsFile();
					if (blob) decodeImage(blob);
					return;
				}
			}
		};

		window.addEventListener("paste", handlePaste);
		return () => window.removeEventListener("paste", handlePaste);
	}, [decodeImage]);

	// Copy to clipboard
	const handleCopy = async () => {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(result.data);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback
			const textarea = document.createElement("textarea");
			textarea.value = result.data;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	// --- Render helpers ---

	const renderResult = () => {
		if (!result) return null;

		const { data, contentType } = result;

		return (
			<div className={`flex flex-col gap-4 p-5 ${styles.resultCard}`}>
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<CheckIcon className={`w-5 h-5 ${styles.successIcon}`} />
						<span className="font-semibold text-sm">Decoded Successfully</span>
					</div>
					<span className={`px-2 py-1 text-xs ${styles.contentTypeBadge}`}>
						{contentTypeLabel(contentType)}
					</span>
				</div>

				{/* Content display based on type */}
				{contentType === "url" && renderUrl(data)}
				{contentType === "wifi" && renderWifi(data)}
				{contentType === "email" && renderEmail(data)}
				{contentType === "phone" && renderPhone(data)}
				{contentType === "vcard" && renderRawContent(data)}
				{contentType === "text" && renderRawContent(data)}

				{/* Action buttons */}
				<div className="flex items-center gap-2 flex-wrap">
					<button onClick={handleCopy} className={`text-sm ${styles.copyBtn}`}>
						{copied ? (
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

					{contentType === "url" && (
						<a
							href={data}
							target="_blank"
							rel="noopener noreferrer"
							className={`text-sm no-underline ${styles.openBtn}`}
						>
							<ArrowTopRightOnSquareIcon className="w-4 h-4" />
							Open in new tab
						</a>
					)}

					{contentType === "email" && (
						<a href={data} className={`text-sm no-underline ${styles.openBtn}`}>
							<ArrowTopRightOnSquareIcon className="w-4 h-4" />
							Open in email client
						</a>
					)}

					{contentType === "phone" && (
						<a href={data} className={`text-sm no-underline ${styles.openBtn}`}>
							<ArrowTopRightOnSquareIcon className="w-4 h-4" />
							Call
						</a>
					)}
				</div>
			</div>
		);
	};

	const renderUrl = (data: string) => (
		<div className={`p-3 ${styles.resultContent}`}>
			<div className="flex items-start gap-2">
				<LinkIcon className="w-4 h-4 shrink-0 mt-0.5" />
				<a
					href={data}
					target="_blank"
					rel="noopener noreferrer"
					className={`text-sm ${styles.resultLink}`}
				>
					{data}
				</a>
			</div>
		</div>
	);

	const renderWifi = (data: string) => {
		const config = parseWifiConfig(data);
		return (
			<div className={`p-4 ${styles.wifiGrid}`}>
				<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
					<span className={`text-sm ${styles.wifiLabel}`}>SSID</span>
					<span className={`text-sm ${styles.wifiValue}`}>{config.ssid || "N/A"}</span>

					<span className={`text-sm ${styles.wifiLabel}`}>Password</span>
					<span className={`text-sm ${styles.wifiValue}`}>{config.password || "None"}</span>

					<span className={`text-sm ${styles.wifiLabel}`}>Encryption</span>
					<span className={`text-sm ${styles.wifiValue}`}>{config.encryption}</span>

					{config.hidden && (
						<>
							<span className={`text-sm ${styles.wifiLabel}`}>Hidden</span>
							<span className={`text-sm ${styles.wifiValue}`}>Yes</span>
						</>
					)}
				</div>
			</div>
		);
	};

	const renderEmail = (data: string) => {
		const email = parseEmail(data);
		return (
			<div className={`p-4 ${styles.wifiGrid}`}>
				<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
					<span className={`text-sm ${styles.wifiLabel}`}>To</span>
					<span className={`text-sm ${styles.wifiValue}`}>{email.address}</span>

					{email.subject && (
						<>
							<span className={`text-sm ${styles.wifiLabel}`}>Subject</span>
							<span className={`text-sm ${styles.wifiValue}`}>{email.subject}</span>
						</>
					)}

					{email.body && (
						<>
							<span className={`text-sm ${styles.wifiLabel}`}>Body</span>
							<span className={`text-sm ${styles.wifiValue}`}>{email.body}</span>
						</>
					)}
				</div>
			</div>
		);
	};

	const renderPhone = (data: string) => {
		const number = parsePhone(data);
		return (
			<div className={`p-3 ${styles.resultContent}`}>
				<span className="text-sm">{number}</span>
			</div>
		);
	};

	const renderRawContent = (data: string) => (
		<div className={`p-3 ${styles.resultContent}`}>
			<pre className="text-sm whitespace-pre-wrap m-0">{data}</pre>
		</div>
	);

	const renderError = () => {
		if (!error) return null;

		return (
			<div className={`flex items-start gap-3 p-4 ${styles.errorCard}`}>
				<ExclamationTriangleIcon className={`w-5 h-5 shrink-0 mt-0.5 ${styles.errorIcon}`} />
				<p className={`text-sm m-0 ${styles.errorText}`}>{error}</p>
			</div>
		);
	};

	return (
		<div className={`flex flex-col gap-6 ${styles.container}`}>
			{/* Upload Section */}
			<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>Upload QR Code Image</h2>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					className="hidden"
				/>

				<div
					className={`flex flex-col items-center justify-center gap-3 p-8 ${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""} ${imageSrc ? styles.dropZoneHasImage : ""}`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => !imageSrc && fileInputRef.current?.click()}
				>
					{imageSrc ? (
						<div className={`flex items-center justify-center w-full ${styles.imagePreviewWrapper}`}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								ref={imageRef}
								src={imageSrc}
								alt="Uploaded QR code"
								className={`max-w-full ${styles.previewImage}`}
							/>
							<canvas
								ref={overlayCanvasRef}
								className={`${styles.qrOverlay}`}
								style={{ width: imageRef.current?.clientWidth, height: imageRef.current?.clientHeight }}
							/>
						</div>
					) : (
						<>
							<QrCodeIcon className={`w-12 h-12 ${styles.dropIcon}`} />
							<p className={`text-sm m-0 ${styles.dropText}`}>
								Drag & drop an image here, or{" "}
								<span className={styles.browseLink}>browse files</span>
							</p>
							<p className={`text-xs m-0 ${styles.dropHint}`}>
								Supports PNG, JPG, WebP, GIF. You can also paste from clipboard (Ctrl+V).
							</p>
						</>
					)}
				</div>

				{imageSrc && (
					<div className="flex items-center gap-2">
						<button
							onClick={() => fileInputRef.current?.click()}
							className={`text-sm ${styles.copyBtn}`}
						>
							Upload new image
						</button>
						<button onClick={resetState} className={`text-sm ${styles.clearBtn}`}>
							<XMarkIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				)}
			</div>

			{/* Result Section */}
			{result && (
				<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
					<h2 className={styles.sectionTitle}>Decoded Content</h2>
					{renderResult()}
				</div>
			)}

			{/* Error Section */}
			{error && (
				<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
					{renderError()}
				</div>
			)}

			{/* Info Section */}
			<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
				<div className={`flex items-start gap-4 p-4 rounded-md ${styles.infoBox}`}>
					<QrCodeIcon className={`w-6 h-6 shrink-0 ${styles.infoIcon}`} />
					<p className={styles.infoText}>
						Upload an image containing a QR code to decode its content. Supports URLs, plain text,
						WiFi configurations, email addresses, phone numbers, and vCards. All processing happens
						in your browser - no data is uploaded to any server.
					</p>
				</div>
			</div>

			{/* Hidden canvas for image processing */}
			<canvas ref={canvasRef} style={{ display: "none" }} />
		</div>
	);
}
