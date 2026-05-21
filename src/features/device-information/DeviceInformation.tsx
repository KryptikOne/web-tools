"use client";

import { useEffect, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./DeviceInformation.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

interface InfoItem {
	label: string;
	value: string;
	id: string;
}

interface InfoGroup {
	title: string;
	items: InfoItem[];
}

function readGpuInfo(): { vendor: string; renderer: string } {
	try {
		const canvas = document.createElement("canvas");
		const gl =
			(canvas.getContext("webgl") as WebGLRenderingContext | null) ||
			(canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
		if (!gl) return { vendor: "Unavailable", renderer: "Unavailable" };

		const ext = gl.getExtension("WEBGL_debug_renderer_info");
		if (ext) {
			return {
				vendor: String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? "Unknown"),
				renderer: String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "Unknown"),
			};
		}
		return {
			vendor: String(gl.getParameter(gl.VENDOR) ?? "Unknown"),
			renderer: String(gl.getParameter(gl.RENDERER) ?? "Unknown"),
		};
	} catch {
		return { vendor: "Unavailable", renderer: "Unavailable" };
	}
}

function collectInfo(): InfoGroup[] {
	const nav = navigator as Navigator & { deviceMemory?: number };
	const gpu = readGpuInfo();
	const languages = Array.isArray(nav.languages) ? nav.languages.join(", ") : "—";
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
	const touch =
		"ontouchstart" in window ||
		(typeof nav.maxTouchPoints === "number" && nav.maxTouchPoints > 0);
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const colorScheme = prefersDark ? "dark" : prefersLight ? "light" : "no preference";

	return [
		{
			title: "Display",
			items: [
				{ id: "screen-size", label: "Screen Size", value: `${screen.width} × ${screen.height}` },
				{
					id: "available-size",
					label: "Available Size",
					value: `${screen.availWidth} × ${screen.availHeight}`,
				},
				{
					id: "viewport",
					label: "Viewport",
					value: `${window.innerWidth} × ${window.innerHeight}`,
				},
				{
					id: "dpr",
					label: "Device Pixel Ratio",
					value: String(window.devicePixelRatio ?? 1),
				},
				{
					id: "color-depth",
					label: "Color Depth",
					value: `${screen.colorDepth} bits`,
				},
			],
		},
		{
			title: "System",
			items: [
				{
					id: "cores",
					label: "CPU Cores",
					value: String(nav.hardwareConcurrency ?? "Unavailable"),
				},
				{
					id: "memory",
					label: "Device Memory",
					value:
						typeof nav.deviceMemory === "number"
							? `${nav.deviceMemory} GB (approx.)`
							: "Unavailable",
				},
				{ id: "touch", label: "Touch Support", value: touch ? "Yes" : "No" },
				{ id: "online", label: "Online", value: nav.onLine ? "Yes" : "No" },
			],
		},
		{
			title: "Locale",
			items: [
				{ id: "language", label: "Language", value: nav.language || "—" },
				{ id: "languages", label: "All Languages", value: languages },
				{ id: "timezone", label: "Time Zone", value: timezone },
			],
		},
		{
			title: "GPU (WebGL)",
			items: [
				{ id: "gpu-vendor", label: "Vendor", value: gpu.vendor },
				{ id: "gpu-renderer", label: "Renderer", value: gpu.renderer },
			],
		},
		{
			title: "User Preferences",
			items: [
				{ id: "color-scheme", label: "Color Scheme", value: colorScheme },
				{
					id: "reduced-motion",
					label: "Reduced Motion",
					value: prefersReducedMotion ? "reduce" : "no preference",
				},
			],
		},
	];
}

export default function DeviceInformation() {
	const [groups, setGroups] = useState<InfoGroup[] | null>(null);
	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		setGroups(collectInfo());

		const onResize = () => setGroups(collectInfo());
		const onOnline = () => setGroups(collectInfo());
		window.addEventListener("resize", onResize);
		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOnline);
		return () => {
			window.removeEventListener("resize", onResize);
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOnline);
		};
	}, []);

	const handleRefresh = () => setGroups(collectInfo());

	return (
		<div className={styles.container}>
			<div className="flex items-center justify-between mb-6 flex-wrap gap-4">
				<div>
					<h2 className={`text-xl font-semibold m-0 ${styles.cardTitle}`}>
						Your Device
					</h2>
					<p className={`text-sm mt-1 m-0 ${styles.cardSubtitle}`}>
						Read-only environment info read from <code>navigator</code>, <code>screen</code>,{" "}
						<code>window</code>, <code>Intl</code>, and WebGL. Nothing is sent anywhere.
					</p>
				</div>
				<button
					type="button"
					onClick={handleRefresh}
					className={styles.btnSecondary}
					aria-label="Refresh device information"
				>
					<ArrowPathIcon className="w-4 h-4" />
					Refresh
				</button>
			</div>

			{!groups ? (
				<div className={`p-6 ${styles.glassCard}`}>
					<p className={`text-sm m-0 ${styles.cardSubtitle}`}>
						Reading device information...
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{groups.map((group) => (
						<div key={group.title} className={styles.glassCard}>
							<h3 className={`text-base font-semibold mb-4 m-0 ${styles.cardTitle}`}>
								{group.title}
							</h3>
							<dl className={styles.dl}>
								{group.items.map((item) => (
									<div key={item.id} className={styles.row}>
										<dt className={styles.term}>{item.label}</dt>
										<dd className={styles.def}>
											<span className={styles.value} title={item.value}>
												{item.value}
											</span>
											<button
												type="button"
												onClick={() => copy(item.value, item.id)}
												className={`${styles.copyBtn} ${
													isCopied(item.id) ? styles.copied : ""
												}`}
												aria-label={`Copy ${item.label}`}
											>
												{isCopied(item.id) ? (
													<CheckIcon className="w-4 h-4" />
												) : (
													<ClipboardDocumentIcon className="w-4 h-4" />
												)}
											</button>
										</dd>
									</div>
								))}
							</dl>
						</div>
					))}
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					About these values
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Browsers intentionally restrict or randomize some signals to limit
					fingerprinting. <code>navigator.deviceMemory</code> is rounded and only
					exposed on Chromium-based engines; GPU strings may be redacted in Firefox
					and Safari; some screen metrics can be spoofed by privacy modes. Treat the
					values here as best-effort hints, not ground truth.
				</p>
			</div>
		</div>
	);
}
