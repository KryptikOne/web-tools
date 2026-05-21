"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./IbanValidator.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type CountryEntry = { code: string; name: string; length: number };

const COUNTRY_TABLE: CountryEntry[] = [
	{ code: "AD", name: "Andorra", length: 24 },
	{ code: "AE", name: "United Arab Emirates", length: 23 },
	{ code: "AL", name: "Albania", length: 28 },
	{ code: "AT", name: "Austria", length: 20 },
	{ code: "AZ", name: "Azerbaijan", length: 28 },
	{ code: "BA", name: "Bosnia and Herzegovina", length: 20 },
	{ code: "BE", name: "Belgium", length: 16 },
	{ code: "BG", name: "Bulgaria", length: 22 },
	{ code: "BH", name: "Bahrain", length: 22 },
	{ code: "BR", name: "Brazil", length: 29 },
	{ code: "BY", name: "Belarus", length: 28 },
	{ code: "CH", name: "Switzerland", length: 21 },
	{ code: "CR", name: "Costa Rica", length: 22 },
	{ code: "CY", name: "Cyprus", length: 28 },
	{ code: "CZ", name: "Czech Republic", length: 24 },
	{ code: "DE", name: "Germany", length: 22 },
	{ code: "DK", name: "Denmark", length: 18 },
	{ code: "DO", name: "Dominican Republic", length: 28 },
	{ code: "EE", name: "Estonia", length: 20 },
	{ code: "EG", name: "Egypt", length: 29 },
	{ code: "ES", name: "Spain", length: 24 },
	{ code: "FI", name: "Finland", length: 18 },
	{ code: "FO", name: "Faroe Islands", length: 18 },
	{ code: "FR", name: "France", length: 27 },
	{ code: "GB", name: "United Kingdom", length: 22 },
	{ code: "GE", name: "Georgia", length: 22 },
	{ code: "GI", name: "Gibraltar", length: 23 },
	{ code: "GL", name: "Greenland", length: 18 },
	{ code: "GR", name: "Greece", length: 27 },
	{ code: "GT", name: "Guatemala", length: 28 },
	{ code: "HR", name: "Croatia", length: 21 },
	{ code: "HU", name: "Hungary", length: 28 },
	{ code: "IE", name: "Ireland", length: 22 },
	{ code: "IL", name: "Israel", length: 23 },
	{ code: "IQ", name: "Iraq", length: 23 },
	{ code: "IS", name: "Iceland", length: 26 },
	{ code: "IT", name: "Italy", length: 27 },
	{ code: "JO", name: "Jordan", length: 30 },
	{ code: "KW", name: "Kuwait", length: 30 },
	{ code: "KZ", name: "Kazakhstan", length: 20 },
	{ code: "LB", name: "Lebanon", length: 28 },
	{ code: "LC", name: "Saint Lucia", length: 32 },
	{ code: "LI", name: "Liechtenstein", length: 21 },
	{ code: "LT", name: "Lithuania", length: 20 },
	{ code: "LU", name: "Luxembourg", length: 20 },
	{ code: "LV", name: "Latvia", length: 21 },
	{ code: "MC", name: "Monaco", length: 27 },
	{ code: "MD", name: "Moldova", length: 24 },
	{ code: "ME", name: "Montenegro", length: 22 },
	{ code: "MK", name: "North Macedonia", length: 19 },
	{ code: "MR", name: "Mauritania", length: 27 },
	{ code: "MT", name: "Malta", length: 31 },
	{ code: "MU", name: "Mauritius", length: 30 },
	{ code: "NL", name: "Netherlands", length: 18 },
	{ code: "NO", name: "Norway", length: 15 },
	{ code: "PK", name: "Pakistan", length: 24 },
	{ code: "PL", name: "Poland", length: 28 },
	{ code: "PS", name: "Palestine", length: 29 },
	{ code: "PT", name: "Portugal", length: 25 },
	{ code: "QA", name: "Qatar", length: 29 },
	{ code: "RO", name: "Romania", length: 24 },
	{ code: "RS", name: "Serbia", length: 22 },
	{ code: "SA", name: "Saudi Arabia", length: 24 },
	{ code: "SC", name: "Seychelles", length: 31 },
	{ code: "SE", name: "Sweden", length: 24 },
	{ code: "SI", name: "Slovenia", length: 19 },
	{ code: "SK", name: "Slovakia", length: 24 },
	{ code: "SM", name: "San Marino", length: 27 },
	{ code: "ST", name: "São Tomé and Príncipe", length: 25 },
	{ code: "SV", name: "El Salvador", length: 28 },
	{ code: "TL", name: "Timor-Leste", length: 23 },
	{ code: "TN", name: "Tunisia", length: 24 },
	{ code: "TR", name: "Turkey", length: 26 },
	{ code: "UA", name: "Ukraine", length: 29 },
	{ code: "VA", name: "Vatican City", length: 22 },
	{ code: "VG", name: "British Virgin Islands", length: 24 },
	{ code: "XK", name: "Kosovo", length: 20 },
];

const COUNTRY_MAP = new Map(COUNTRY_TABLE.map((c) => [c.code, c]));

type ValidationResult =
	| { state: "empty" }
	| { state: "error"; message: string; normalized: string }
	| {
			state: "ok";
			normalized: string;
			pretty: string;
			countryCode: string;
			countryName: string;
			checkDigits: string;
			bban: string;
			length: number;
			expectedLength: number;
			valid: boolean;
			reason?: string;
	  };

function normalizeIban(raw: string): string {
	return raw.replace(/\s+/g, "").toUpperCase();
}

function prettifyIban(iban: string): string {
	return iban.replace(/(.{4})/g, "$1 ").trim();
}

// Mod-97 over an arbitrarily long numeric string
function mod97(numeric: string): number {
	let remainder = 0;
	for (let i = 0; i < numeric.length; i++) {
		const ch = numeric.charCodeAt(i) - 48; // '0' = 48
		if (ch < 0 || ch > 9) return -1;
		remainder = (remainder * 10 + ch) % 97;
	}
	return remainder;
}

function lettersToDigits(s: string): string {
	let out = "";
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		if (c >= 48 && c <= 57) {
			out += s[i];
		} else if (c >= 65 && c <= 90) {
			out += String(c - 55); // A=10..Z=35
		} else {
			return "";
		}
	}
	return out;
}

function validate(raw: string): ValidationResult {
	const trimmed = raw.trim();
	if (!trimmed) return { state: "empty" };

	const normalized = normalizeIban(trimmed);

	if (!/^[A-Z0-9]+$/.test(normalized)) {
		return {
			state: "error",
			message: "IBAN may only contain letters and digits.",
			normalized,
		};
	}

	if (normalized.length < 5) {
		return {
			state: "error",
			message: "IBAN is too short to parse.",
			normalized,
		};
	}

	const countryCode = normalized.slice(0, 2);
	const checkDigits = normalized.slice(2, 4);
	const bban = normalized.slice(4);

	if (!/^[A-Z]{2}$/.test(countryCode)) {
		return {
			state: "error",
			message: "First two characters must be a country code.",
			normalized,
		};
	}
	if (!/^\d{2}$/.test(checkDigits)) {
		return {
			state: "error",
			message: "Characters 3-4 must be the numeric check digits.",
			normalized,
		};
	}

	const country = COUNTRY_MAP.get(countryCode);
	const expectedLength = country?.length ?? -1;
	const lengthMatches = country ? normalized.length === expectedLength : true;

	const rearranged = bban + countryCode + checkDigits;
	const numeric = lettersToDigits(rearranged);
	const mod = numeric ? mod97(numeric) : -1;
	const checksumOk = mod === 1;

	const valid = checksumOk && lengthMatches && !!country;

	let reason: string | undefined;
	if (!country) {
		reason = `Country "${countryCode}" is not in the known IBAN registry.`;
	} else if (!lengthMatches) {
		reason = `Length is ${normalized.length}; expected ${expectedLength} for ${country.name}.`;
	} else if (!checksumOk) {
		reason = "Checksum failed (mod-97 != 1).";
	}

	return {
		state: "ok",
		normalized,
		pretty: prettifyIban(normalized),
		countryCode,
		countryName: country?.name ?? "Unknown",
		checkDigits,
		bban,
		length: normalized.length,
		expectedLength,
		valid,
		reason,
	};
}

export default function IbanValidator() {
	const [input, setInput] = useState<string>("DE89 3704 0044 0532 0130 00");
	const { copy, isCopied } = useClipboard();
	const result = useMemo(() => validate(input), [input]);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<label htmlFor="iban-input" className={styles.label}>
					IBAN
				</label>
				<input
					id="iban-input"
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="e.g. DE89 3704 0044 0532 0130 00"
					className={styles.input}
					autoComplete="off"
					spellCheck={false}
				/>
				<p className={`text-xs mt-2 m-0 ${styles.cardSubtitle}`}>
					Spaces and casing are ignored. {COUNTRY_TABLE.length} countries
					recognized.
				</p>
			</div>

			{result.state === "error" && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{result.message}
				</div>
			)}

			{result.state === "ok" && (
				<>
					<div
						className={`mt-4 px-4 py-3 rounded-lg text-sm ${
							result.valid ? styles.successBox : styles.errorBox
						}`}
					>
						{result.valid
							? `Valid IBAN for ${result.countryName}.`
							: result.reason ?? "Invalid IBAN."}
					</div>

					<div className={`mt-4 ${styles.glassCard}`}>
						<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
							Breakdown
						</h3>

						<div className={styles.grid}>
							<Field
								id="pretty"
								label="Formatted"
								value={result.pretty}
								copy={copy}
								isCopied={isCopied}
							/>
							<Field
								id="raw"
								label="Compact"
								value={result.normalized}
								copy={copy}
								isCopied={isCopied}
							/>
							<Field
								id="country"
								label="Country"
								value={`${result.countryCode} — ${result.countryName}`}
								copy={copy}
								isCopied={isCopied}
							/>
							<Field
								id="check"
								label="Check digits"
								value={result.checkDigits}
								copy={copy}
								isCopied={isCopied}
							/>
							<Field
								id="bban"
								label="BBAN"
								value={result.bban}
								copy={copy}
								isCopied={isCopied}
							/>
							<Field
								id="len"
								label="Length"
								value={
									result.expectedLength > 0
										? `${result.length} / ${result.expectedLength} expected`
										: String(result.length)
								}
								copy={copy}
								isCopied={isCopied}
							/>
						</div>
					</div>
				</>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					About IBAN validation
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Validation runs the standard mod-97 algorithm: move the first 4
					characters to the end, map letters to digits (A=10 … Z=35), and
					check that the resulting integer modulo 97 equals 1. Length is
					compared against the registry for the IBAN&apos;s country code.
				</p>
			</div>
		</div>
	);
}

type CopyFn = (text: string, field?: string) => Promise<boolean>;
type IsCopiedFn = (field?: string) => boolean;

function Field({
	id,
	label,
	value,
	copy,
	isCopied,
}: {
	id: string;
	label: string;
	value: string;
	copy: CopyFn;
	isCopied: IsCopiedFn;
}) {
	return (
		<div className={styles.fieldBox}>
			<div className={styles.fieldLabel}>{label}</div>
			<div className="flex items-center gap-2">
				<div className={styles.fieldValue}>{value}</div>
				<button
					type="button"
					onClick={() => copy(value, id)}
					className={`${styles.copyBtn} ${isCopied(id) ? styles.copied : ""}`}
					aria-label={`Copy ${label}`}
				>
					{isCopied(id) ? (
						<CheckIcon className="w-4 h-4" />
					) : (
						<ClipboardDocumentIcon className="w-4 h-4" />
					)}
				</button>
			</div>
		</div>
	);
}
