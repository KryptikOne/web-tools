"use client";

import { useMemo, useState } from "react";
import {
	parsePhoneNumberFromString,
	getCountries,
	getCountryCallingCode,
	isSupportedCountry,
	type CountryCode,
} from "libphonenumber-js";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./PhoneNumberParser.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

type ParsedResult =
	| {
			ok: true;
			valid: boolean;
			possible: boolean;
			e164: string;
			national: string;
			international: string;
			uri: string;
			country: string;
			callingCode: string;
			nationalNumber: string;
			type: string;
	  }
	| { ok: false; reason: string };

const DISPLAY_NAMES = (() => {
	if (typeof Intl !== "undefined" && "DisplayNames" in Intl) {
		try {
			return new Intl.DisplayNames(undefined, { type: "region" });
		} catch {
			return null;
		}
	}
	return null;
})();

function countryName(code: CountryCode): string {
	if (DISPLAY_NAMES) {
		try {
			const name = DISPLAY_NAMES.of(code);
			if (name) return name;
		} catch {
			// fall through
		}
	}
	return code;
}

export default function PhoneNumberParser() {
	const [input, setInput] = useState<string>("+14155552671");
	const [defaultCountry, setDefaultCountry] = useState<string>("US");
	const { copy, isCopied } = useClipboard();

	const countries = useMemo(() => {
		const list = getCountries();
		return list
			.map((code) => ({
				code,
				name: countryName(code),
				calling: getCountryCallingCode(code),
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, []);

	const result = useMemo<ParsedResult>(() => {
		const text = input.trim();
		if (!text) return { ok: false, reason: "Enter a phone number to parse." };

		try {
			const country = isSupportedCountry(defaultCountry)
				? (defaultCountry as CountryCode)
				: undefined;
			const phone = parsePhoneNumberFromString(text, country);
			if (!phone) {
				return {
					ok: false,
					reason:
						"Could not parse this number. Try including a country code (e.g. +1) or selecting a default country.",
				};
			}

			const valid = phone.isValid();
			const possible = phone.isPossible();
			const type = phone.getType();

			return {
				ok: true,
				valid,
				possible,
				e164: phone.number,
				national: phone.formatNational(),
				international: phone.formatInternational(),
				uri: phone.getURI(),
				country: phone.country ? countryName(phone.country) : "—",
				callingCode: phone.countryCallingCode
					? `+${phone.countryCallingCode}`
					: "—",
				nationalNumber: phone.nationalNumber,
				type: type ?? "unknown",
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Parse failed.";
			return { ok: false, reason: message };
		}
	}, [input, defaultCountry]);

	const fields: { id: string; label: string; value: string }[] = result.ok
		? [
				{ id: "e164", label: "E.164", value: result.e164 },
				{ id: "national", label: "National format", value: result.national },
				{
					id: "international",
					label: "International format",
					value: result.international,
				},
				{ id: "uri", label: "RFC 3966 URI", value: result.uri },
				{ id: "country", label: "Country", value: result.country },
				{ id: "calling", label: "Country code", value: result.callingCode },
				{
					id: "national-num",
					label: "National number",
					value: result.nationalNumber,
				},
				{ id: "type", label: "Type", value: result.type },
			]
		: [];

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					Phone number
				</h3>

				<div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
					<div className={`md:col-span-2 ${styles.inputGroup}`}>
						<label htmlFor="phone-input" className={styles.label}>
							Number
						</label>
						<input
							id="phone-input"
							type="tel"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="+1 415 555 2671"
							className={styles.input}
							autoComplete="off"
							spellCheck={false}
						/>
					</div>
					<div className={styles.inputGroup}>
						<label htmlFor="phone-country" className={styles.label}>
							Default country
						</label>
						<select
							id="phone-country"
							value={defaultCountry}
							onChange={(e) => setDefaultCountry(e.target.value)}
							className={styles.select}
						>
							{countries.map((c) => (
								<option key={c.code} value={c.code}>
									{c.name} (+{c.calling})
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{!result.ok ? (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{result.reason}
				</div>
			) : (
				<>
					<div
						className={`mt-4 px-4 py-3 rounded-lg text-sm ${
							result.valid ? styles.successBox : styles.warningBox
						}`}
					>
						{result.valid
							? "Valid phone number."
							: result.possible
								? "Possible but not a valid number for this country."
								: "Not a valid phone number."}
					</div>

					<div className={`mt-4 ${styles.glassCard}`}>
						<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
							Parsed details
						</h3>
						<div className={styles.grid}>
							{fields.map((f) => (
								<div key={f.id} className={styles.fieldBox}>
									<div className={styles.fieldLabel}>{f.label}</div>
									<div className="flex items-center gap-2">
										<div className={styles.fieldValue}>{f.value}</div>
										<button
											type="button"
											onClick={() => copy(f.value, f.id)}
											className={`${styles.copyBtn} ${
												isCopied(f.id) ? styles.copied : ""
											}`}
											aria-label={`Copy ${f.label}`}
										>
											{isCopied(f.id) ? (
												<CheckIcon className="w-4 h-4" />
											) : (
												<ClipboardDocumentIcon className="w-4 h-4" />
											)}
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					About
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Parsing uses <code>libphonenumber-js</code> with its bundled
					metadata. The default country is used when the input lacks an
					international prefix (no <code>+</code>).
				</p>
			</div>
		</div>
	);
}
