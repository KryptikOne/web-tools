"use client";

import { useMemo, useState } from "react";
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import {
	BITWISE_OPS,
	bitwise,
	convertNumber,
	getBitRepresentation,
	groupString,
	isBitSet,
	isValidForBase,
	parseBigInt,
	bigIntToBase,
	stripBasePrefix,
	toggleBit,
	type BitwiseOp,
} from "@/lib/numberBaseUtils";
import styles from "./NumberBaseConverter.module.scss";

type Tab = "convert" | "bitwise";

const STANDARD_BASES = [
	{ base: 10, label: "Decimal", prefix: "" },
	{ base: 16, label: "Hexadecimal", prefix: "0x" },
	{ base: 2, label: "Binary", prefix: "0b" },
	{ base: 8, label: "Octal", prefix: "0o" },
];

const BIT_LENGTHS = [8, 16, 32, 64] as const;

const HEX_REFERENCE = Array.from({ length: 16 }, (_, i) => ({
	dec: String(i),
	hex: i.toString(16).toUpperCase(),
	bin: i.toString(2).padStart(4, "0"),
}));

/** Parse a field's text in a base to a canonical decimal string, or null when invalid. */
function toDecimal(text: string, base: number): string | null {
	const { digits, base: prefixed } = stripBasePrefix(text.trim());
	const b = prefixed ?? base;
	const clean = digits.toUpperCase();
	if (!clean || clean === "-" || clean === "." || !isValidForBase(clean, b)) return null;
	try {
		return convertNumber(clean, b, 10);
	} catch {
		return null;
	}
}

function BaseRow({
	label,
	prefix,
	value,
	onChange,
	invalid,
	copyKey,
	copy,
	isCopied,
	inputId,
}: {
	label: string;
	prefix?: string;
	value: string;
	onChange: (v: string) => void;
	invalid?: boolean;
	copyKey: string;
	copy: (text: string, key: string) => void;
	isCopied: (key: string) => boolean;
	inputId: string;
}) {
	return (
		<div className={styles.row}>
			<label htmlFor={inputId} className={styles.rowLabel}>
				{label}
			</label>
			<div className={`${styles.rowInputWrap} ${invalid ? styles.invalid : ""}`}>
				{prefix && <span className={styles.prefix}>{prefix}</span>}
				<input
					id={inputId}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={styles.rowInput}
					spellCheck={false}
					autoComplete="off"
					inputMode="text"
				/>
			</div>
			<button
				type="button"
				className={styles.rowCopy}
				onClick={() => copy(value, copyKey)}
				disabled={!value}
				aria-label={`Copy ${label}`}
			>
				{isCopied(copyKey) ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
			</button>
		</div>
	);
}

export default function NumberBaseConverter() {
	const [tab, setTab] = useState<Tab>("convert");
	const { copy, isCopied } = useClipboard();

	// ── Converter state ────────────────────────────────────────────────────
	const [decimal, setDecimal] = useState<string>("255");
	const [draft, setDraft] = useState<{ base: number | "custom"; text: string; invalid: boolean } | null>(null);
	const [customBase, setCustomBase] = useState("36");
	const [toggleWidth, setToggleWidth] = useState<8 | 16 | 32>(16);

	const customBaseNum = Math.min(36, Math.max(2, parseInt(customBase, 10) || 2));

	const valueIn = (base: number): string => {
		if (!decimal) return "";
		try {
			return convertNumber(decimal, 10, base);
		} catch {
			return "";
		}
	};

	const fieldText = (base: number | "custom") =>
		draft && draft.base === base ? draft.text : valueIn(base === "custom" ? customBaseNum : base);

	const handleField = (base: number | "custom", text: string) => {
		const b = base === "custom" ? customBaseNum : base;
		if (!text.trim()) {
			setDecimal("");
			setDraft({ base, text, invalid: false });
			return;
		}
		const dec = toDecimal(text, b);
		setDraft({ base, text, invalid: dec === null });
		if (dec !== null) setDecimal(dec);
	};

	const isInteger = decimal !== "" && !decimal.includes(".");
	const bigValue = useMemo(() => {
		if (!isInteger) return null;
		try {
			return BigInt(decimal);
		} catch {
			return null;
		}
	}, [decimal, isInteger]);
	const canToggle = bigValue !== null && bigValue >= BigInt(0) && bigValue < BigInt(1) << BigInt(toggleWidth);

	const handleToggleBit = (bit: number) => {
		if (bigValue === null) return;
		setDecimal(toggleBit(bigValue, bit).toString());
		setDraft(null);
	};

	const binary = valueIn(2);
	const hex = valueIn(16);
	const groupedBinary = useMemo(() => {
		if (!binary) return { by4: "", by8: "" };
		const neg = binary.startsWith("-");
		const [int, frac] = (neg ? binary.slice(1) : binary).split(".");
		const suffix = frac ? "." + frac : "";
		return { by4: (neg ? "-" : "") + groupString(int, 4) + suffix, by8: (neg ? "-" : "") + groupString(int, 8) + suffix };
	}, [binary]);
	const groupedHex = useMemo(() => {
		if (!hex) return "";
		const neg = hex.startsWith("-");
		const [int, frac] = (neg ? hex.slice(1) : hex).split(".");
		return (neg ? "-" : "") + groupString(int, 2) + (frac ? "." + frac : "");
	}, [hex]);

	const bitRepresentations = useMemo(
		() => (isInteger ? BIT_LENGTHS.map((bits) => ({ bits, value: getBitRepresentation(decimal, bits) })) : []),
		[decimal, isInteger]
	);

	// ── Bitwise state ──────────────────────────────────────────────────────
	const [op, setOp] = useState<BitwiseOp>("and");
	const [opA, setOpA] = useState("0xFF");
	const [opB, setOpB] = useState("0x0F");
	const [opWidth, setOpWidth] = useState<8 | 16 | 32 | 64>(32);

	const parseOperand = (text: string): bigint | null => {
		const { digits, base } = stripBasePrefix(text.trim());
		const clean = digits.toUpperCase();
		if (!clean || clean.startsWith("-") || clean.includes(".")) return null;
		const b = base ?? 10;
		if (!isValidForBase(clean, b)) return null;
		try {
			return parseBigInt(clean, b);
		} catch {
			return null;
		}
	};

	const opMeta = BITWISE_OPS.find((o) => o.id === op)!;
	const aVal = parseOperand(opA);
	const bVal = opMeta.unary ? BigInt(0) : parseOperand(opB);
	const result = useMemo(() => {
		if (aVal === null || bVal === null) return null;
		try {
			return bitwise(op, aVal, bVal, opWidth);
		} catch {
			return null;
		}
	}, [aVal, bVal, op, opWidth]);

	return (
		<div className={styles.container}>
			<SegmentedControl<Tab>
				label="Section"
				value={tab}
				onChange={setTab}
				options={[
					{ value: "convert", label: "Converter" },
					{ value: "bitwise", label: "Bitwise ops" },
				]}
			/>

			{tab === "convert" && (
				<>
					<div className={`mt-4 ${styles.panel}`}>
						{STANDARD_BASES.map((b) => (
							<BaseRow
								key={b.base}
								inputId={`base-${b.base}`}
								label={b.label}
								prefix={b.prefix}
								value={fieldText(b.base)}
								onChange={(v) => handleField(b.base, v)}
								invalid={draft?.base === b.base && draft.invalid}
								copyKey={`base-${b.base}`}
								copy={copy}
								isCopied={isCopied}
							/>
						))}
						<div className={`${styles.row} ${styles.customRow}`}>
							<div className={styles.customLabel}>
								<label htmlFor="custom-base" className={styles.rowLabel}>
									Base
								</label>
								<input
									id="custom-base"
									type="number"
									min={2}
									max={36}
									value={customBase}
									onChange={(e) => {
										setCustomBase(e.target.value);
										setDraft(null);
									}}
									className={styles.customBaseInput}
								/>
							</div>
							<div className={`${styles.rowInputWrap} ${draft?.base === "custom" && draft.invalid ? styles.invalid : ""}`}>
								<input
									type="text"
									aria-label={`Base ${customBaseNum} value`}
									value={fieldText("custom")}
									onChange={(e) => handleField("custom", e.target.value)}
									className={styles.rowInput}
									spellCheck={false}
									autoComplete="off"
								/>
							</div>
							<button
								type="button"
								className={styles.rowCopy}
								onClick={() => copy(fieldText("custom"), "custom")}
								disabled={!decimal}
								aria-label={`Copy base ${customBaseNum} value`}
							>
								{isCopied("custom") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
							</button>
						</div>

						{/* Bit toggle */}
						<div className={styles.toggleSection}>
							<div className="flex items-center justify-between flex-wrap gap-2 mb-2">
								<span className={styles.sectionLabel}>Bit toggle</span>
								<SegmentedControl<"8" | "16" | "32">
									label="Bit toggle width"
									size="sm"
									fill={false}
									value={String(toggleWidth) as "8" | "16" | "32"}
									onChange={(v) => setToggleWidth(Number(v) as 8 | 16 | 32)}
									options={[
										{ value: "8", label: "8-bit" },
										{ value: "16", label: "16-bit" },
										{ value: "32", label: "32-bit" },
									]}
								/>
							</div>
							{canToggle ? (
								<div className={`${styles.bits} ${toggleWidth === 32 ? styles.bits32 : ""}`}>
									{Array.from({ length: toggleWidth }, (_, i) => toggleWidth - 1 - i).map((bit) => (
										<button
											key={bit}
											type="button"
											className={`${styles.bit} ${isBitSet(bigValue!, bit) ? styles.bitOn : ""}`}
											onClick={() => handleToggleBit(bit)}
											aria-label={`Bit ${bit}, ${isBitSet(bigValue!, bit) ? "on" : "off"}`}
											aria-pressed={isBitSet(bigValue!, bit)}
										>
											<span className={styles.bitValue}>{isBitSet(bigValue!, bit) ? 1 : 0}</span>
											<span className={styles.bitIndex}>{bit}</span>
										</button>
									))}
								</div>
							) : (
								<p className={styles.hint}>
									{decimal === ""
										? "Enter a value to toggle its bits."
										: !isInteger
											? "Bit toggling works on whole numbers."
											: `Value does not fit in ${toggleWidth} unsigned bits.`}
								</p>
							)}
						</div>
					</div>

					{/* Grouped + two's complement */}
					{decimal && (
						<div className={`grid gap-4 mt-4 md:grid-cols-2`}>
							<div className={styles.glassCard}>
								<h3 className={styles.cardTitle}>Grouped digits</h3>
								<dl className={styles.groupedList}>
									<div><dt>Binary, nibbles</dt><dd>{groupedBinary.by4}</dd></div>
									<div><dt>Binary, bytes</dt><dd>{groupedBinary.by8}</dd></div>
									<div><dt>Hex, bytes</dt><dd>{groupedHex}</dd></div>
								</dl>
							</div>
							<div className={styles.glassCard}>
								<h3 className={styles.cardTitle}>Two&apos;s complement</h3>
								{bitRepresentations.length === 0 ? (
									<p className={styles.hint}>Whole numbers only.</p>
								) : (
									<dl className={styles.groupedList}>
										{bitRepresentations.map(({ bits, value }) => (
											<div key={bits}>
												<dt>{bits}-bit</dt>
												<dd className={/^[01]+$/.test(value) ? "" : styles.muted}>
													{/^[01]+$/.test(value) ? groupString(value, 8) : value}
												</dd>
											</div>
										))}
									</dl>
								)}
							</div>
						</div>
					)}

					<div className={`mt-4 ${styles.glassCard}`}>
						<div className="flex justify-between items-center flex-wrap gap-2 mb-3">
							<h3 className={styles.cardTitle}>Hex digit reference</h3>
							<button
								type="button"
								className={styles.btnSecondary}
								onClick={() => {
									setDecimal("");
									setDraft(null);
								}}
								disabled={!decimal}
							>
								<ArrowPathIcon className="w-4 h-4" />
								Clear
							</button>
						</div>
						<div className={styles.referenceGrid}>
							{HEX_REFERENCE.map((item) => (
								<div key={item.hex} className={styles.referenceCell}>
									<span className={styles.referenceHex}>{item.hex}</span>
									<span className={styles.referenceSub}>{item.dec}</span>
									<span className={styles.referenceSub}>{item.bin}</span>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			{tab === "bitwise" && (
				<div className={`mt-4 ${styles.panel}`}>
					<div className={styles.opRow}>
						<span className={styles.rowLabel}>Operation</span>
						<SegmentedControl<BitwiseOp>
							label="Bitwise operation"
							size="sm"
							value={op}
							onChange={setOp}
							options={BITWISE_OPS.map((o) => ({ value: o.id, label: o.symbol === "<<" || o.symbol === ">>" ? o.symbol : o.label, title: o.description }))}
						/>
					</div>
					<div className={styles.opRow}>
						<span className={styles.rowLabel}>Width</span>
						<SegmentedControl<"8" | "16" | "32" | "64">
							label="Bit width"
							size="sm"
							fill={false}
							value={String(opWidth) as "8" | "16" | "32" | "64"}
							onChange={(v) => setOpWidth(Number(v) as 8 | 16 | 32 | 64)}
							options={BIT_LENGTHS.map((b) => ({ value: String(b) as "8" | "16" | "32" | "64", label: `${b}-bit` }))}
						/>
					</div>
					<div className={styles.row}>
						<label htmlFor="op-a" className={styles.rowLabel}>Value A</label>
						<div className={`${styles.rowInputWrap} ${aVal === null ? styles.invalid : ""}`}>
							<input id="op-a" type="text" value={opA} onChange={(e) => setOpA(e.target.value)} className={styles.rowInput} spellCheck={false} autoComplete="off" placeholder="255, 0xFF, 0b1111, 0o17" />
						</div>
						<span />
					</div>
					{!opMeta.unary && (
						<div className={styles.row}>
							<label htmlFor="op-b" className={styles.rowLabel}>{op === "shl" || op === "shr" ? "Shift by" : "Value B"}</label>
							<div className={`${styles.rowInputWrap} ${bVal === null ? styles.invalid : ""}`}>
								<input id="op-b" type="text" value={opB} onChange={(e) => setOpB(e.target.value)} className={styles.rowInput} spellCheck={false} autoComplete="off" placeholder="Decimal, or use a 0x / 0b / 0o prefix" />
							</div>
							<span />
						</div>
					)}
					<div className={styles.resultBlock}>
						<span className={styles.sectionLabel}>
							{opMeta.unary ? `${opMeta.symbol}A` : `A ${opMeta.symbol} B`} <span className={styles.hint}>· {opMeta.description}</span>
						</span>
						{result === null ? (
							<p className={styles.hint}>Enter valid non-negative integers.</p>
						) : (
							<div className={styles.resultGrid}>
								{STANDARD_BASES.map((b) => {
									const text = bigIntToBase(result, b.base);
									const key = `res-${b.base}`;
									return (
										<div key={b.base} className={styles.resultRow}>
											<span className={styles.resultLabel}>{b.label}</span>
											<code className={styles.resultValue}>
												{b.prefix}
												{b.base === 2 ? groupString(text.padStart(opWidth, "0"), 8) : text}
											</code>
											<button type="button" className={styles.rowCopy} onClick={() => copy(text, key)} aria-label={`Copy ${b.label} result`}>
												{isCopied(key) ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>
					<div className={styles.opReference}>
						{BITWISE_OPS.map((o) => (
							<div key={o.id}>
								<code>{o.label} ({o.symbol})</code>
								<span>{o.description}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
