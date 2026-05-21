"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./ChmodCalculator.module.scss";

/**
 * Internal permission state is a 4-digit octal:
 *   special (setuid, setgid, sticky)
 *   user (rwx)
 *   group (rwx)
 *   other (rwx)
 */
interface PermState {
	special: number; // 0-7  (setuid=4, setgid=2, sticky=1)
	user: number;    // 0-7  (r=4, w=2, x=1)
	group: number;
	other: number;
}

function toOctal3(p: PermState): string {
	return `${p.user}${p.group}${p.other}`;
}

function toOctal4(p: PermState): string {
	return `${p.special}${p.user}${p.group}${p.other}`;
}

function octalDigitToSymbol(
	digit: number,
	options: { isUser?: boolean; isGroup?: boolean; isOther?: boolean; special?: number } = {}
): string {
	const r = (digit & 4) ? "r" : "-";
	const w = (digit & 2) ? "w" : "-";
	let x: string;
	if (options.isUser && options.special && (options.special & 4)) {
		x = (digit & 1) ? "s" : "S";
	} else if (options.isGroup && options.special && (options.special & 2)) {
		x = (digit & 1) ? "s" : "S";
	} else if (options.isOther && options.special && (options.special & 1)) {
		x = (digit & 1) ? "t" : "T";
	} else {
		x = (digit & 1) ? "x" : "-";
	}
	return `${r}${w}${x}`;
}

function toSymbolic(p: PermState): string {
	return (
		octalDigitToSymbol(p.user, { isUser: true, special: p.special }) +
		octalDigitToSymbol(p.group, { isGroup: true, special: p.special }) +
		octalDigitToSymbol(p.other, { isOther: true, special: p.special })
	);
}

function parseOctal(input: string): PermState | null {
	const trimmed = input.trim();
	if (!/^[0-7]{3,4}$/.test(trimmed)) return null;
	const padded = trimmed.length === 3 ? `0${trimmed}` : trimmed;
	return {
		special: Number(padded[0]),
		user: Number(padded[1]),
		group: Number(padded[2]),
		other: Number(padded[3]),
	};
}

/**
 * Parse a 9-char symbolic string like "rwxr-xr-x" or with setuid/setgid/sticky.
 */
function parseSymbolic(input: string): PermState | null {
	const trimmed = input.trim();
	if (trimmed.length !== 9) return null;

	const segments: [string, string, string][] = [
		[trimmed[0], trimmed[1], trimmed[2]],
		[trimmed[3], trimmed[4], trimmed[5]],
		[trimmed[6], trimmed[7], trimmed[8]],
	];

	let special = 0;
	const digits: number[] = [];

	for (let i = 0; i < 3; i++) {
		const [rCh, wCh, xCh] = segments[i];
		let digit = 0;
		if (rCh === "r") digit |= 4;
		else if (rCh !== "-") return null;

		if (wCh === "w") digit |= 2;
		else if (wCh !== "-") return null;

		// x position may be x/-/s/S/t/T
		if (i === 0) {
			if (xCh === "s") { digit |= 1; special |= 4; }
			else if (xCh === "S") { special |= 4; }
			else if (xCh === "x") { digit |= 1; }
			else if (xCh !== "-") return null;
		} else if (i === 1) {
			if (xCh === "s") { digit |= 1; special |= 2; }
			else if (xCh === "S") { special |= 2; }
			else if (xCh === "x") { digit |= 1; }
			else if (xCh !== "-") return null;
		} else {
			if (xCh === "t") { digit |= 1; special |= 1; }
			else if (xCh === "T") { special |= 1; }
			else if (xCh === "x") { digit |= 1; }
			else if (xCh !== "-") return null;
		}

		digits.push(digit);
	}

	return { special, user: digits[0], group: digits[1], other: digits[2] };
}

function parseChmodCommand(input: string): PermState | null {
	// Accept things like "chmod 755 file" or "chmod 0755 file"
	const m = input.trim().match(/^chmod\s+([0-7]{3,4})(?:\s+\S+)?$/i);
	if (!m) return null;
	return parseOctal(m[1]);
}

const ROW_LABELS: { key: "user" | "group" | "other"; label: string }[] = [
	{ key: "user", label: "User (owner)" },
	{ key: "group", label: "Group" },
	{ key: "other", label: "Other" },
];

export default function ChmodCalculator() {
	const [perm, setPerm] = useState<PermState>({ special: 0, user: 7, group: 5, other: 5 });
	const [filename, setFilename] = useState("file");

	const { copy, isCopied } = useClipboard();

	const octal3 = useMemo(() => toOctal3(perm), [perm]);
	const octal4 = useMemo(() => toOctal4(perm), [perm]);
	const symbolic = useMemo(() => toSymbolic(perm), [perm]);
	const command = useMemo(
		() => `chmod ${perm.special > 0 ? octal4 : octal3} ${filename}`,
		[perm.special, octal3, octal4, filename]
	);

	const toggleBit = useCallback((field: "user" | "group" | "other", bit: number) => {
		setPerm((p) => ({ ...p, [field]: p[field] ^ bit }));
	}, []);

	const toggleSpecial = useCallback((bit: number) => {
		setPerm((p) => ({ ...p, special: p.special ^ bit }));
	}, []);

	const handleOctalChange = useCallback((value: string) => {
		const parsed = parseOctal(value);
		if (parsed) setPerm(parsed);
	}, []);

	const handleSymbolicChange = useCallback((value: string) => {
		const parsed = parseSymbolic(value);
		if (parsed) setPerm(parsed);
	}, []);

	const handleCommandChange = useCallback((value: string) => {
		const parsed = parseChmodCommand(value);
		if (parsed) setPerm(parsed);
	}, []);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Permissions</h3>

				<div className={styles.permGrid}>
					<div className={styles.permHeaderCell}></div>
					<div className={styles.permHeaderCell}>Read</div>
					<div className={styles.permHeaderCell}>Write</div>
					<div className={styles.permHeaderCell}>Execute</div>
					<div className={styles.permHeaderCell}>Octal</div>

					{ROW_LABELS.map(({ key, label }) => (
						<div key={key} className={styles.permRow}>
							<div className={styles.permRowLabel}>{label}</div>
							<label className={styles.checkboxCell}>
								<input
									type="checkbox"
									checked={Boolean(perm[key] & 4)}
									onChange={() => toggleBit(key, 4)}
									className={styles.checkbox}
									aria-label={`${label} read`}
								/>
							</label>
							<label className={styles.checkboxCell}>
								<input
									type="checkbox"
									checked={Boolean(perm[key] & 2)}
									onChange={() => toggleBit(key, 2)}
									className={styles.checkbox}
									aria-label={`${label} write`}
								/>
							</label>
							<label className={styles.checkboxCell}>
								<input
									type="checkbox"
									checked={Boolean(perm[key] & 1)}
									onChange={() => toggleBit(key, 1)}
									className={styles.checkbox}
									aria-label={`${label} execute`}
								/>
							</label>
							<div className={styles.permDigit}>{perm[key]}</div>
						</div>
					))}
				</div>

				<div className={styles.specialRow}>
					<span className={styles.specialLabel}>Special bits</span>
					<label className={`flex items-center gap-2 ${styles.specialOption}`}>
						<input
							type="checkbox"
							checked={Boolean(perm.special & 4)}
							onChange={() => toggleSpecial(4)}
							className={styles.checkbox}
						/>
						setuid (4)
					</label>
					<label className={`flex items-center gap-2 ${styles.specialOption}`}>
						<input
							type="checkbox"
							checked={Boolean(perm.special & 2)}
							onChange={() => toggleSpecial(2)}
							className={styles.checkbox}
						/>
						setgid (2)
					</label>
					<label className={`flex items-center gap-2 ${styles.specialOption}`}>
						<input
							type="checkbox"
							checked={Boolean(perm.special & 1)}
							onChange={() => toggleSpecial(1)}
							className={styles.checkbox}
						/>
						sticky (1)
					</label>
				</div>
			</div>

			<div className={`mt-4 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Representations</h3>

				<div className={styles.fieldRow}>
					<label className={styles.fieldLabel} htmlFor="chmod-octal">Octal</label>
					<input
						id="chmod-octal"
						type="text"
						value={perm.special > 0 ? octal4 : octal3}
						onChange={(e) => handleOctalChange(e.target.value)}
						className={styles.fieldInput}
						spellCheck={false}
					/>
					<button
						type="button"
						onClick={() => copy(perm.special > 0 ? octal4 : octal3, "octal")}
						className={`${styles.copyBtn} ${isCopied("octal") ? styles.copied : ""}`}
						aria-label="Copy octal"
					>
						{isCopied("octal") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
					</button>
				</div>

				<div className={styles.fieldRow}>
					<label className={styles.fieldLabel} htmlFor="chmod-symbolic">Symbolic</label>
					<input
						id="chmod-symbolic"
						type="text"
						value={symbolic}
						onChange={(e) => handleSymbolicChange(e.target.value)}
						className={styles.fieldInput}
						spellCheck={false}
					/>
					<button
						type="button"
						onClick={() => copy(symbolic, "symbolic")}
						className={`${styles.copyBtn} ${isCopied("symbolic") ? styles.copied : ""}`}
						aria-label="Copy symbolic"
					>
						{isCopied("symbolic") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
					</button>
				</div>

				<div className={styles.fieldRow}>
					<label className={styles.fieldLabel} htmlFor="chmod-filename">Filename</label>
					<input
						id="chmod-filename"
						type="text"
						value={filename}
						onChange={(e) => setFilename(e.target.value || "file")}
						className={styles.fieldInput}
						spellCheck={false}
					/>
					<span className={styles.copyBtnPlaceholder} aria-hidden />
				</div>

				<div className={styles.fieldRow}>
					<label className={styles.fieldLabel} htmlFor="chmod-command">Command</label>
					<input
						id="chmod-command"
						type="text"
						value={command}
						onChange={(e) => handleCommandChange(e.target.value)}
						className={styles.fieldInput}
						spellCheck={false}
					/>
					<button
						type="button"
						onClick={() => copy(command, "command")}
						className={`${styles.copyBtn} ${isCopied("command") ? styles.copied : ""}`}
						aria-label="Copy chmod command"
					>
						{isCopied("command") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
					</button>
				</div>

				<p className={`text-xs mt-3 m-0 ${styles.helperText}`}>
					Edit any field — the others update live.
				</p>
			</div>
		</div>
	);
}
