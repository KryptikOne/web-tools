"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
	ArrowDownTrayIcon,
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { ColorPickerPopover } from "@/components/ColorPickerPopover";
import QRCode from "qrcode";
import styles from "./QrCodeGenerator.module.scss";

type InputPreset = "url" | "text" | "email" | "phone" | "wifi" | "vcard";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const INPUT_PRESETS: { id: InputPreset; label: string }[] = [
	{ id: "url", label: "URL" },
	{ id: "text", label: "Text" },
	{ id: "email", label: "Email" },
	{ id: "phone", label: "Phone" },
	{ id: "wifi", label: "WiFi" },
	{ id: "vcard", label: "vCard" },
];

const EC_LEVELS: { id: ErrorCorrectionLevel; label: string; description: string }[] = [
	{ id: "L", label: "L", description: "~7% recovery" },
	{ id: "M", label: "M", description: "~15% recovery" },
	{ id: "Q", label: "Q", description: "~25% recovery" },
	{ id: "H", label: "H", description: "~30% recovery" },
];

export default function QrCodeGenerator() {
	const [preset, setPreset] = useState<InputPreset>("url");
	const [content, setContent] = useState("https://example.com");
	const [size, setSize] = useState(300);
	const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>("M");
	const [fgColor, setFgColor] = useState("#000000");
	const [bgColor, setBgColor] = useState("#ffffff");
	const [margin, setMargin] = useState(4);
	const [copied, setCopied] = useState(false);

	// WiFi fields
	const [wifiSsid, setWifiSsid] = useState("");
	const [wifiPassword, setWifiPassword] = useState("");
	const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");

	// Email fields
	const [emailTo, setEmailTo] = useState("");
	const [emailSubject, setEmailSubject] = useState("");
	const [emailBody, setEmailBody] = useState("");

	// Phone field
	const [phone, setPhone] = useState("");

	// vCard fields
	const [vcardName, setVcardName] = useState("");
	const [vcardPhone, setVcardPhone] = useState("");
	const [vcardEmail, setVcardEmail] = useState("");
	const [vcardOrg, setVcardOrg] = useState("");

	const canvasRef = useRef<HTMLCanvasElement>(null);

	const getEncodedContent = useCallback((): string => {
		switch (preset) {
			case "wifi":
				return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
			case "email":
				return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
			case "phone":
				return `tel:${phone}`;
			case "vcard":
				return [
					"BEGIN:VCARD",
					"VERSION:3.0",
					`FN:${vcardName}`,
					vcardPhone ? `TEL:${vcardPhone}` : "",
					vcardEmail ? `EMAIL:${vcardEmail}` : "",
					vcardOrg ? `ORG:${vcardOrg}` : "",
					"END:VCARD",
				]
					.filter(Boolean)
					.join("\n");
			case "url":
			case "text":
			default:
				return content;
		}
	}, [preset, content, wifiSsid, wifiPassword, wifiEncryption, emailTo, emailSubject, emailBody, phone, vcardName, vcardPhone, vcardEmail, vcardOrg]);

	const generateQrCode = useCallback(async () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const text = getEncodedContent();
		if (!text.trim()) return;

		try {
			await QRCode.toCanvas(canvas, text, {
				width: size,
				margin,
				errorCorrectionLevel: errorCorrection,
				color: {
					dark: fgColor,
					light: bgColor,
				},
			});
		} catch (err) {
			console.error("Failed to generate QR code:", err);
		}
	}, [getEncodedContent, size, margin, errorCorrection, fgColor, bgColor]);

	useEffect(() => {
		generateQrCode();
	}, [generateQrCode]);

	const handleDownloadPng = async () => {
		const text = getEncodedContent();
		if (!text.trim()) return;

		try {
			const dataUrl = await QRCode.toDataURL(text, {
				width: size,
				margin,
				errorCorrectionLevel: errorCorrection,
				color: { dark: fgColor, light: bgColor },
			});

			const link = document.createElement("a");
			link.download = "qrcode.png";
			link.href = dataUrl;
			link.click();
		} catch (err) {
			console.error("Failed to download PNG:", err);
		}
	};

	const handleDownloadSvg = async () => {
		const text = getEncodedContent();
		if (!text.trim()) return;

		try {
			const svgString = await QRCode.toString(text, {
				type: "svg",
				width: size,
				margin,
				errorCorrectionLevel: errorCorrection,
				color: { dark: fgColor, light: bgColor },
			});

			const blob = new Blob([svgString], { type: "image/svg+xml" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.download = "qrcode.svg";
			link.href = url;
			link.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error("Failed to download SVG:", err);
		}
	};

	const handleCopyImage = async () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		try {
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, "image/png")
			);
			if (!blob) return;

			await navigator.clipboard.write([
				new ClipboardItem({ "image/png": blob }),
			]);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy image:", err);
		}
	};

	const handlePresetChange = (newPreset: InputPreset) => {
		setPreset(newPreset);
	};

	const renderPresetFields = () => {
		switch (preset) {
			case "wifi":
				return (
					<div className="flex flex-col gap-4">
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>SSID (Network Name)</label>
							<input
								type="text"
								value={wifiSsid}
								onChange={(e) => setWifiSsid(e.target.value)}
								placeholder="MyNetwork"
								className={styles.input}
							/>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Password</label>
							<input
								type="text"
								value={wifiPassword}
								onChange={(e) => setWifiPassword(e.target.value)}
								placeholder="password123"
								className={styles.input}
							/>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Encryption</label>
							<select
								value={wifiEncryption}
								onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
								className={styles.select}
							>
								<option value="WPA">WPA/WPA2</option>
								<option value="WEP">WEP</option>
								<option value="nopass">None</option>
							</select>
						</div>
					</div>
				);

			case "email":
				return (
					<div className="flex flex-col gap-4">
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>To</label>
							<input
								type="email"
								value={emailTo}
								onChange={(e) => setEmailTo(e.target.value)}
								placeholder="hello@example.com"
								className={styles.input}
							/>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Subject</label>
							<input
								type="text"
								value={emailSubject}
								onChange={(e) => setEmailSubject(e.target.value)}
								placeholder="Hello!"
								className={styles.input}
							/>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Body</label>
							<textarea
								value={emailBody}
								onChange={(e) => setEmailBody(e.target.value)}
								placeholder="Message body..."
								className={styles.textarea}
								rows={3}
							/>
						</div>
					</div>
				);

			case "phone":
				return (
					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Phone Number</label>
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+1234567890"
							className={styles.input}
						/>
					</div>
				);

			case "vcard":
				return (
					<div className="flex flex-col gap-4">
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Full Name</label>
							<input
								type="text"
								value={vcardName}
								onChange={(e) => setVcardName(e.target.value)}
								placeholder="John Doe"
								className={styles.input}
							/>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Phone</label>
							<input
								type="tel"
								value={vcardPhone}
								onChange={(e) => setVcardPhone(e.target.value)}
								placeholder="+1234567890"
								className={styles.input}
							/>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Email</label>
							<input
								type="email"
								value={vcardEmail}
								onChange={(e) => setVcardEmail(e.target.value)}
								placeholder="john@example.com"
								className={styles.input}
							/>
						</div>
						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>Organization</label>
							<input
								type="text"
								value={vcardOrg}
								onChange={(e) => setVcardOrg(e.target.value)}
								placeholder="Acme Inc."
								className={styles.input}
							/>
						</div>
					</div>
				);

			case "url":
				return (
					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>URL</label>
						<input
							type="url"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="https://example.com"
							className={styles.input}
						/>
					</div>
				);

			case "text":
			default:
				return (
					<div className={styles.inputGroup}>
						<label className={styles.inputLabel}>Text Content</label>
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Enter text to encode..."
							className={styles.textarea}
							rows={4}
						/>
					</div>
				);
		}
	};

	return (
		<div className={styles.container}>
			{/* Settings Panel */}
			<div className="flex flex-col gap-6">
				{/* Input Type Presets */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Input Type</h2>
					<div className="grid grid-cols-3 gap-2 mb-6">
						{INPUT_PRESETS.map((p) => (
							<button
								key={p.id}
								className={`${styles.presetBtn} ${preset === p.id ? "active" : ""}`}
								onClick={() => handlePresetChange(p.id)}
							>
								{p.label}
							</button>
						))}
					</div>
					{renderPresetFields()}
				</div>

				{/* Customization */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>Customization</h2>
					<div className="flex flex-col gap-5">
						{/* Size */}
						<div>
							<div className={styles.sliderHeader}>
								<span className={styles.sliderLabel}>Size</span>
								<span className={styles.sliderValue}>{size}px</span>
							</div>
							<input
								type="range"
								min="100"
								max="1000"
								value={size}
								onChange={(e) => setSize(parseInt(e.target.value))}
								className={styles.slider}
							/>
						</div>

						{/* Margin */}
						<div>
							<div className={styles.sliderHeader}>
								<span className={styles.sliderLabel}>Margin</span>
								<span className={styles.sliderValue}>{margin} modules</span>
							</div>
							<input
								type="range"
								min="0"
								max="10"
								value={margin}
								onChange={(e) => setMargin(parseInt(e.target.value))}
								className={styles.slider}
							/>
						</div>

						{/* Error Correction */}
						<div>
							<label className={`mb-2 block ${styles.inputLabel}`}>Error Correction</label>
							<div className="grid grid-cols-4 gap-2">
								{EC_LEVELS.map((level) => (
									<button
										key={level.id}
										className={`${styles.ecBtn} ${errorCorrection === level.id ? "active" : ""}`}
										onClick={() => setErrorCorrection(level.id)}
										title={level.description}
									>
										{level.label}
									</button>
								))}
							</div>
							<p className="text-xs text-gray-500 mt-1.5">
								{EC_LEVELS.find((l) => l.id === errorCorrection)?.description}
							</p>
						</div>

						{/* Colors */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<label className={styles.inputLabel}>Foreground</label>
								<div className={styles.colorRow}>
									<ColorPickerPopover color={fgColor} onChange={setFgColor} swatchSize="sm" />
									<span className={styles.colorHex}>{fgColor}</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<label className={styles.inputLabel}>Background</label>
								<div className={styles.colorRow}>
									<ColorPickerPopover color={bgColor} onChange={setBgColor} swatchSize="sm" />
									<span className={styles.colorHex}>{bgColor}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Preview Panel */}
			<div className="flex flex-col gap-6">
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-4">
						<h2 className={styles.sectionTitle}>Preview</h2>
						<button
							className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
							onClick={handleCopyImage}
							title="Copy image to clipboard"
						>
							{copied ? (
								<CheckIcon className={styles.copyIcon} />
							) : (
								<ClipboardDocumentIcon className={styles.copyIcon} />
							)}
						</button>
					</div>

					<div className={`flex items-center justify-center p-8 mb-6 ${styles.previewContainer}`}>
						<canvas ref={canvasRef} className={styles.qrCanvas} />
					</div>

					{/* Download buttons */}
					<div className="grid grid-cols-2 gap-3">
						<button className={styles.downloadBtn} onClick={handleDownloadPng}>
							<ArrowDownTrayIcon className="w-4 h-4" />
							Download PNG
						</button>
						<button className={styles.downloadBtn} onClick={handleDownloadSvg}>
							<ArrowDownTrayIcon className="w-4 h-4" />
							Download SVG
						</button>
					</div>
				</div>

				{/* Info Section */}
				<div className={styles.glassCard}>
					<h2 className={`mb-4 ${styles.sectionTitle}`}>About QR Codes</h2>
					<div className={styles.infoGrid}>
						<div className={styles.infoItem}>
							<h3 className={styles.infoSubtitle}>Error Correction</h3>
							<p className={styles.infoText}>
								QR codes use Reed-Solomon error correction. Higher levels (H) allow up to 30% of the code to be damaged while remaining scannable, but produce denser codes.
							</p>
						</div>
						<div className={styles.infoItem}>
							<h3 className={styles.infoSubtitle}>Data Types</h3>
							<p className={styles.infoText}>
								QR codes can encode URLs, plain text, WiFi credentials, contact cards (vCard), email addresses, phone numbers, and more. Most smartphone cameras detect the type automatically.
							</p>
						</div>
						<div className={styles.infoItem}>
							<h3 className={styles.infoSubtitle}>Size & Contrast</h3>
							<p className={styles.infoText}>
								For reliable scanning, maintain high contrast between foreground and background colors. Larger sizes and higher error correction improve scan reliability.
							</p>
						</div>
						<div className={styles.infoItem}>
							<h3 className={styles.infoSubtitle}>Privacy</h3>
							<p className={styles.infoText}>
								All QR codes are generated entirely in your browser. No data is sent to any server, ensuring your content stays private.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
