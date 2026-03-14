"use client";

import { useState, useCallback, useMemo } from "react";
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import styles from "./NumberBaseConverter.module.scss";

type BaseOption = {
	value: number;
	label: string;
};

const PRESET_BASES: BaseOption[] = [
	{ value: 2, label: "Binary (2)" },
	{ value: 8, label: "Octal (8)" },
	{ value: 10, label: "Decimal (10)" },
	{ value: 16, label: "Hexadecimal (16)" },
];

const BIT_LENGTHS = [8, 16, 32, 64] as const;

const HEX_REFERENCE = [
	{ dec: "0", hex: "0", bin: "0000" },
	{ dec: "1", hex: "1", bin: "0001" },
	{ dec: "2", hex: "2", bin: "0010" },
	{ dec: "3", hex: "3", bin: "0011" },
	{ dec: "4", hex: "4", bin: "0100" },
	{ dec: "5", hex: "5", bin: "0101" },
	{ dec: "6", hex: "6", bin: "0110" },
	{ dec: "7", hex: "7", bin: "0111" },
	{ dec: "8", hex: "8", bin: "1000" },
	{ dec: "9", hex: "9", bin: "1001" },
	{ dec: "10", hex: "A", bin: "1010" },
	{ dec: "11", hex: "B", bin: "1011" },
	{ dec: "12", hex: "C", bin: "1100" },
	{ dec: "13", hex: "D", bin: "1101" },
	{ dec: "14", hex: "E", bin: "1110" },
	{ dec: "15", hex: "F", bin: "1111" },
];

function groupString(str: string, groupSize: number, separator: string = " "): string {
	if (!str) return str;
	const groups: string[] = [];
	let i = str.length;
	while (i > 0) {
		const start = Math.max(0, i - groupSize);
		groups.unshift(str.slice(start, i));
		i = start;
	}
	return groups.join(separator);
}

function convertIntegerPart(value: string, fromBase: number, toBase: number): string {
	// Parse to BigInt via decimal
	const decimal = BigInt(parseInt(value, fromBase));
	if (toBase === 10) return decimal.toString();
	if (decimal === BigInt(0)) return "0";

	const isNegative = decimal < BigInt(0);
	let abs = isNegative ? -decimal : decimal;
	const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";
	const base = BigInt(toBase);

	while (abs > BigInt(0)) {
		result = digits[Number(abs % base)] + result;
		abs = abs / base;
	}

	return isNegative ? "-" + result : result;
}

function convertFractionalPart(fraction: string, fromBase: number, toBase: number, precision: number = 20): string {
	// Convert fractional digits to a decimal fraction
	let decimalFraction = 0;
	for (let i = 0; i < fraction.length; i++) {
		const digitValue = parseInt(fraction[i], fromBase);
		if (isNaN(digitValue)) return "";
		decimalFraction += digitValue / Math.pow(fromBase, i + 1);
	}

	if (decimalFraction === 0) return "0";

	// Convert decimal fraction to target base
	const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";
	let value = decimalFraction;

	for (let i = 0; i < precision && value > 0; i++) {
		value *= toBase;
		const digit = Math.floor(value);
		result += digits[digit];
		value -= digit;
	}

	// Remove trailing zeros
	return result.replace(/0+$/, "") || "0";
}

function convertNumber(input: string, fromBase: number, toBase: number): string {
	if (!input || input === "-") return "";

	const isNegative = input.startsWith("-");
	const unsigned = isNegative ? input.slice(1) : input;
	const parts = unsigned.split(".");

	const integerPart = parts[0] || "0";
	const fractionalPart = parts[1];

	let result = convertIntegerPart((isNegative ? "-" : "") + integerPart, fromBase, toBase);

	if (fractionalPart) {
		const convertedFraction = convertFractionalPart(fractionalPart, fromBase, toBase);
		result += "." + convertedFraction;
	}

	return result;
}

function isValidForBase(input: string, base: number): boolean {
	if (!input || input === "-" || input === "-.") return true;
	const unsigned = input.startsWith("-") ? input.slice(1) : input;
	const validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, base);
	const regex = new RegExp(`^[${validChars}]+(\\.[${validChars}]*)?$`, "i");
	return regex.test(unsigned);
}

function getBitRepresentation(decimalStr: string, bits: number): string {
	if (!decimalStr || decimalStr.includes(".")) return "N/A (integer only)";

	const num = parseInt(decimalStr, 10);
	if (isNaN(num)) return "N/A";

	const max = Math.pow(2, bits - 1) - 1;
	const min = -Math.pow(2, bits - 1);

	if (num > max || num < min) return `Out of range (${min} to ${max})`;

	if (num >= 0) {
		return num.toString(2).padStart(bits, "0");
	}

	// Two's complement for negative numbers
	const twosComplement = (Math.pow(2, bits) + num) >>> 0;
	return twosComplement.toString(2).padStart(bits, "0");
}

export default function NumberBaseConverter() {
	const [input, setInput] = useState<string>("");
	const [sourceBase, setSourceBase] = useState<number>(10);
	const [isCustomBase, setIsCustomBase] = useState<boolean>(false);
	const [customBase, setCustomBase] = useState<string>("10");
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [error, setError] = useState<string>("");

	const effectiveBase = isCustomBase ? parseInt(customBase, 10) : sourceBase;
	const isBaseValid = effectiveBase >= 2 && effectiveBase <= 36;

	const handleInputChange = useCallback(
		(value: string) => {
			setInput(value.toUpperCase());
			if (value && isBaseValid && !isValidForBase(value, effectiveBase)) {
				setError(`Invalid character for base ${effectiveBase}`);
			} else {
				setError("");
			}
		},
		[effectiveBase, isBaseValid]
	);

	const handleBasePreset = useCallback((base: number) => {
		setIsCustomBase(false);
		setSourceBase(base);
		setError("");
	}, []);

	const handleCustomBaseChange = useCallback((value: string) => {
		setCustomBase(value);
		setIsCustomBase(true);
		setError("");
	}, []);

	const handleClear = useCallback(() => {
		setInput("");
		setError("");
	}, []);

	const copyToClipboard = useCallback(async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const conversions = useMemo(() => {
		if (!input || !isBaseValid || !isValidForBase(input, effectiveBase)) {
			return { binary: "", octal: "", decimal: "", hex: "" };
		}
		try {
			return {
				binary: convertNumber(input, effectiveBase, 2),
				octal: convertNumber(input, effectiveBase, 8),
				decimal: convertNumber(input, effectiveBase, 10),
				hex: convertNumber(input, effectiveBase, 16),
			};
		} catch {
			return { binary: "", octal: "", decimal: "", hex: "" };
		}
	}, [input, effectiveBase, isBaseValid]);

	const groupedBinary = useMemo(() => {
		if (!conversions.binary) return { by4: "", by8: "" };
		const isNeg = conversions.binary.startsWith("-");
		const unsigned = isNeg ? conversions.binary.slice(1) : conversions.binary;
		const parts = unsigned.split(".");
		const intGrouped4 = groupString(parts[0], 4);
		const intGrouped8 = groupString(parts[0], 8);
		const fracSuffix = parts[1] ? "." + parts[1] : "";
		return {
			by4: (isNeg ? "-" : "") + intGrouped4 + fracSuffix,
			by8: (isNeg ? "-" : "") + intGrouped8 + fracSuffix,
		};
	}, [conversions.binary]);

	const groupedHex = useMemo(() => {
		if (!conversions.hex) return "";
		const isNeg = conversions.hex.startsWith("-");
		const unsigned = isNeg ? conversions.hex.slice(1) : conversions.hex;
		const parts = unsigned.split(".");
		const intGrouped = groupString(parts[0], 2);
		const fracSuffix = parts[1] ? "." + parts[1] : "";
		return (isNeg ? "-" : "") + intGrouped + fracSuffix;
	}, [conversions.hex]);

	const bitRepresentations = useMemo(() => {
		if (!conversions.decimal) return [];
		return BIT_LENGTHS.map((bits) => ({
			bits,
			value: getBitRepresentation(conversions.decimal, bits),
		}));
	}, [conversions.decimal]);

	const hasOutput = conversions.binary || conversions.decimal || conversions.octal || conversions.hex;

	return (
		<div className={styles.container}>
			{/* Input Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Input</h2>

				<div className="flex flex-col gap-4">
					<div>
						<label className={styles.inputLabel}>Number</label>
						<input
							type="text"
							value={input}
							onChange={(e) => handleInputChange(e.target.value)}
							className={styles.input}
							placeholder={`Enter a base-${effectiveBase} number...`}
							spellCheck={false}
							autoComplete="off"
						/>
						{error && <p className={styles.errorText}>{error}</p>}
					</div>

					<div>
						<label className={styles.inputLabel}>Source Base</label>
						<div className="flex flex-wrap gap-2">
							{PRESET_BASES.map((base) => (
								<button
									key={base.value}
									className={`${styles.baseBtn} ${!isCustomBase && sourceBase === base.value ? styles.active : ""}`}
									onClick={() => handleBasePreset(base.value)}
								>
									{base.label}
								</button>
							))}
							<div className={`flex items-center gap-2 ${styles.customBaseWrapper}`}>
								<button
									className={`${styles.baseBtn} ${isCustomBase ? styles.active : ""}`}
									onClick={() => setIsCustomBase(true)}
								>
									Custom
								</button>
								{isCustomBase && (
									<input
										type="number"
										min={2}
										max={36}
										value={customBase}
										onChange={(e) => handleCustomBaseChange(e.target.value)}
										className={styles.customBaseInput}
										placeholder="2-36"
									/>
								)}
							</div>
						</div>
						{isCustomBase && !isBaseValid && <p className={styles.errorText}>Base must be between 2 and 36</p>}
					</div>

					<button className={styles.btnPrimary} onClick={handleClear}>
						<ArrowPathIcon className="w-4 h-4" />
						Clear
					</button>
				</div>
			</div>

			{/* Conversion Results */}
			{hasOutput && (
				<div className={`grid grid-cols-2 gap-4 max-[900px]:grid-cols-1 ${styles.resultsGrid}`}>
					{/* Binary */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-3">
							<h3 className={styles.resultTitle}>Binary (Base 2)</h3>
							<button
								className={`${styles.copyBtn} ${copiedField === "binary" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(conversions.binary, "binary")}
								title="Copy to clipboard"
							>
								{copiedField === "binary" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<p className={styles.resultValue}>{conversions.binary}</p>
						<div className="flex flex-col gap-2 mt-3">
							<div className={styles.groupedDisplay}>
								<span className={styles.groupedLabel}>Grouped (4-bit):</span>
								<code className={styles.groupedValue}>{groupedBinary.by4}</code>
							</div>
							<div className={styles.groupedDisplay}>
								<span className={styles.groupedLabel}>Grouped (8-bit):</span>
								<code className={styles.groupedValue}>{groupedBinary.by8}</code>
							</div>
						</div>
					</div>

					{/* Octal */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-3">
							<h3 className={styles.resultTitle}>Octal (Base 8)</h3>
							<button
								className={`${styles.copyBtn} ${copiedField === "octal" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(conversions.octal, "octal")}
								title="Copy to clipboard"
							>
								{copiedField === "octal" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<p className={styles.resultValue}>{conversions.octal}</p>
					</div>

					{/* Decimal */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-3">
							<h3 className={styles.resultTitle}>Decimal (Base 10)</h3>
							<button
								className={`${styles.copyBtn} ${copiedField === "decimal" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(conversions.decimal, "decimal")}
								title="Copy to clipboard"
							>
								{copiedField === "decimal" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<p className={styles.resultValue}>{conversions.decimal}</p>
					</div>

					{/* Hexadecimal */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-3">
							<h3 className={styles.resultTitle}>Hexadecimal (Base 16)</h3>
							<button
								className={`${styles.copyBtn} ${copiedField === "hex" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(conversions.hex, "hex")}
								title="Copy to clipboard"
							>
								{copiedField === "hex" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
						<p className={styles.resultValue}>{conversions.hex}</p>
						<div className="flex flex-col gap-2 mt-3">
							<div className={styles.groupedDisplay}>
								<span className={styles.groupedLabel}>Grouped (2-digit):</span>
								<code className={styles.groupedValue}>{groupedHex}</code>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Bit Length Representations */}
			{bitRepresentations.length > 0 && !conversions.decimal.includes(".") && (
				<div className={styles.glassCard}>
					<h2 className={styles.sectionTitle}>Bit Length Representations</h2>
					<div className="flex flex-col gap-3">
						{bitRepresentations.map(({ bits, value }) => (
							<div key={bits} className={`flex items-center justify-between gap-4 ${styles.bitRow}`}>
								<span className={styles.bitLabel}>{bits}-bit</span>
								<div className="flex items-center gap-2 flex-1 min-w-0">
									<code className={styles.bitValue}>
										{value.startsWith("Out of range") || value.startsWith("N/A")
											? value
											: groupString(value, 8)}
									</code>
									{!value.startsWith("Out of range") && !value.startsWith("N/A") && (
										<button
											className={`${styles.copyBtn} ${copiedField === `bit-${bits}` ? styles.copied : ""}`}
											onClick={() => copyToClipboard(value, `bit-${bits}`)}
											title="Copy to clipboard"
										>
											{copiedField === `bit-${bits}` ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Hex Reference Table */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Hex Digit Reference</h2>
				<div className={styles.referenceGrid}>
					{HEX_REFERENCE.map((item) => (
						<div key={item.hex} className={styles.referenceCell}>
							<span className={styles.referenceHex}>{item.hex}</span>
							<span className={styles.referenceSub}>Dec: {item.dec}</span>
							<span className={styles.referenceSub}>Bin: {item.bin}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
