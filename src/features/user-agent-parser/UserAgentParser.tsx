"use client";

import { useEffect, useMemo, useState } from "react";
import { UAParser } from "ua-parser-js";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./UserAgentParser.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

interface Section {
	title: string;
	rows: Array<{ label: string; value: string | undefined }>;
}

function buildSections(uaString: string): Section[] {
	const ua = new UAParser(uaString).getResult();
	return [
		{
			title: "Browser",
			rows: [
				{ label: "Name", value: ua.browser.name },
				{ label: "Version", value: ua.browser.version },
				{ label: "Major", value: ua.browser.major },
			],
		},
		{
			title: "Engine",
			rows: [
				{ label: "Name", value: ua.engine.name },
				{ label: "Version", value: ua.engine.version },
			],
		},
		{
			title: "Operating System",
			rows: [
				{ label: "Name", value: ua.os.name },
				{ label: "Version", value: ua.os.version },
			],
		},
		{
			title: "Device",
			rows: [
				{ label: "Type", value: ua.device.type ?? "desktop" },
				{ label: "Model", value: ua.device.model },
				{ label: "Vendor", value: ua.device.vendor },
			],
		},
		{
			title: "CPU",
			rows: [{ label: "Architecture", value: ua.cpu.architecture }],
		},
	];
}

export default function UserAgentParser() {
	const [uaString, setUaString] = useState("");
	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		if (typeof navigator !== "undefined" && navigator.userAgent) {
			setUaString(navigator.userAgent);
		}
	}, []);

	const sections = useMemo(() => {
		if (!uaString.trim()) return null;
		try {
			return buildSections(uaString);
		} catch {
			return null;
		}
	}, [uaString]);

	const resetToCurrent = () => {
		if (typeof navigator !== "undefined") setUaString(navigator.userAgent);
	};

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between mb-3 flex-wrap gap-3">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							User-Agent string
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Pre-filled with your current browser&apos;s UA. Paste a different one to inspect it.
						</p>
					</div>
					<div className="flex gap-2 flex-wrap">
						<button
							type="button"
							onClick={resetToCurrent}
							className={styles.btnSecondary}
						>
							<ArrowPathIcon className="w-4 h-4" />
							Use mine
						</button>
						<button
							type="button"
							onClick={() => setUaString("")}
							className={styles.btnSecondary}
							disabled={!uaString}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
						<button
							type="button"
							onClick={() => copy(uaString, "ua")}
							className={`${styles.btnPrimary} ${isCopied("ua") ? styles.copied : ""}`}
							disabled={!uaString}
						>
							{isCopied("ua") ? (
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
				<label htmlFor="ua-input" className="sr-only">User-Agent string</label>
				<textarea
					id="ua-input"
					value={uaString}
					onChange={(e) => setUaString(e.target.value)}
					placeholder="Paste a user-agent string..."
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{sections && (
				<div className={styles.sectionsGrid}>
					{sections.map((section) => (
						<div key={section.title} className={styles.glassCard}>
							<h3 className={`text-base font-semibold mb-3 m-0 ${styles.cardTitle}`}>
								{section.title}
							</h3>
							<div className={styles.fieldList}>
								{section.rows.map((row) => (
									<div key={row.label} className={styles.fieldRow}>
										<div className={styles.fieldLabel}>{row.label}</div>
										<div
											className={`${styles.fieldValue} ${row.value ? styles.mono : styles.empty}`}
										>
											{row.value || "Unknown"}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			<div className={`mt-4 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About User-Agent parsing
				</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							What this tells you
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The UA string is a self-reported identifier sent by browsers. It
							commonly includes browser name and version, rendering engine, OS,
							and device hints. Use it for stats and feature gating, not security.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							Reliability
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Many modern browsers freeze or reduce UA detail. For accurate
							capabilities, prefer feature detection and the User-Agent Client
							Hints API where available.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
