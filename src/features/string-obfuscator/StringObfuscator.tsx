"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./StringObfuscator.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

function isEmail(value: string): boolean {
	return value.includes("@") && value.indexOf("@") === value.lastIndexOf("@");
}

function maskSegment(segment: string, keepStart: number, keepEnd: number, maskChar: string): string {
	const len = segment.length;
	if (len <= keepStart + keepEnd) {
		// Nothing to mask without exposing structure — return as-is.
		return segment;
	}
	const head = segment.slice(0, keepStart);
	const tail = keepEnd > 0 ? segment.slice(len - keepEnd) : "";
	const masked = maskChar.repeat(len - keepStart - keepEnd);
	return head + masked + tail;
}

export function obfuscate(
	input: string,
	keepStart: number,
	keepEnd: number,
	maskChar: string,
	emailMode: boolean
): string {
	if (!input) return "";
	const safeMask = maskChar.length > 0 ? maskChar : "•";
	const safeStart = Math.max(0, Math.floor(keepStart));
	const safeEnd = Math.max(0, Math.floor(keepEnd));

	if (emailMode && isEmail(input)) {
		const atIdx = input.indexOf("@");
		const local = input.slice(0, atIdx);
		const domain = input.slice(atIdx); // includes "@"
		if (local.length === 0) return input;
		const maskedLocal = local[0] + safeMask.repeat(Math.max(1, local.length - 1));
		return maskedLocal + domain;
	}

	return maskSegment(input, safeStart, safeEnd, safeMask);
}

export default function StringObfuscator() {
	const [input, setInput] = useState("");
	const [keepStart, setKeepStart] = useState(2);
	const [keepEnd, setKeepEnd] = useState(2);
	const [maskChar, setMaskChar] = useState("•");
	const [emailMode, setEmailMode] = useState(true);
	const { copy, isCopied } = useClipboard();

	const output = useMemo(
		() => obfuscate(input, keepStart, keepEnd, maskChar, emailMode),
		[input, keepStart, keepEnd, maskChar, emailMode]
	);

	const inputIsEmail = emailMode && isEmail(input);

	return (
		<div className={styles.container}>
			{/* Options */}
			<div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 ${styles.optionsBar}`}>
				<div className="flex flex-col gap-2">
					<label htmlFor="obf-keep-start" className={styles.label}>
						Keep at start
					</label>
					<input
						id="obf-keep-start"
						type="number"
						min={0}
						max={64}
						value={keepStart}
						onChange={(e) => setKeepStart(Number(e.target.value) || 0)}
						className={styles.input}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="obf-keep-end" className={styles.label}>
						Keep at end
					</label>
					<input
						id="obf-keep-end"
						type="number"
						min={0}
						max={64}
						value={keepEnd}
						onChange={(e) => setKeepEnd(Number(e.target.value) || 0)}
						className={styles.input}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label htmlFor="obf-mask-char" className={styles.label}>
						Mask character
					</label>
					<input
						id="obf-mask-char"
						type="text"
						value={maskChar}
						onChange={(e) => setMaskChar(e.target.value.slice(0, 4))}
						className={styles.input}
						maxLength={4}
					/>
				</div>
				<label className={`flex items-end gap-2 text-sm cursor-pointer pb-2 ${styles.checkboxLabel}`}>
					<input
						type="checkbox"
						checked={emailMode}
						onChange={(e) => setEmailMode(e.target.checked)}
						className={styles.checkbox}
					/>
					Email-aware masking
				</label>
			</div>

			{/* Input */}
			<div className={styles.glassCard}>
				<label htmlFor="obf-input" className={`block text-lg font-semibold mb-3 ${styles.cardTitle}`}>
					Input
				</label>
				<input
					id="obf-input"
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="e.g. secret123 or user@example.com"
					className={styles.input}
				/>
				<p className={`text-xs mt-2 m-0 ${styles.cardSubtitle}`}>
					{inputIsEmail
						? "Detected as email — local part will be masked except first character; domain preserved."
						: "Treated as a generic string."}
				</p>
			</div>

			{/* Output */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-3 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Obfuscated</h3>
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
				<div className={styles.output} aria-live="polite">
					{output || <span className={styles.cardSubtitle}>Output will appear here…</span>}
				</div>
			</div>

			{/* Info */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Generic mode</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Keeps the first <code>N</code> and last <code>M</code> characters visible and
							replaces everything between with the chosen mask character. Example:{" "}
							<code>secret123</code> → <code>se*****23</code>.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Email mode</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							When the input contains a single <code>@</code> and email mode is on, the
							local part keeps its first character (rest masked) and the full domain is
							preserved. Example: <code>user@example.com</code> →{" "}
							<code>u***@example.com</code>.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
