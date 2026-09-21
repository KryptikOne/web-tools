"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardDocumentIcon, CheckIcon, ClockIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import {
	COMMON_TIME_ZONES,
	DATE_UNITS,
	LOCAL_TIME_ZONE,
	addToDate,
	formatDateTimeLocal,
	parseDateTimeLocal,
	parseLooseDate,
	parseUnixTimestamp,
	relativeTime,
	resolveTimeZone,
	toRfc2822,
	type DateUnit,
} from "@/lib/dateTimeUtils";
import styles from "./EpochConverter.module.scss";

type Tab = "convert" | "math";
type FormatId = "unix" | "unixMs" | "iso" | "rfc" | "local";

interface FormatDef {
	id: FormatId;
	label: string;
	hint?: string;
	format: (d: Date, tz?: string) => string;
	parse: (text: string, tz?: string) => Date | null;
}

const FORMATS: FormatDef[] = [
	{ id: "unix", label: "Unix (seconds)", format: (d) => String(Math.floor(d.getTime() / 1000)), parse: (t) => parseUnixTimestamp(t) },
	{ id: "unixMs", label: "Unix (milliseconds)", format: (d) => String(d.getTime()), parse: (t) => parseUnixTimestamp(t) },
	{ id: "iso", label: "ISO 8601", format: (d) => d.toISOString(), parse: parseLooseDate },
	{ id: "rfc", label: "RFC 2822", format: (d) => toRfc2822(d), parse: parseLooseDate },
	{ id: "local", label: "Date & time", hint: "in the selected zone", format: (d, tz) => formatDateTimeLocal(d, tz), parse: (t, tz) => parseDateTimeLocal(t, tz) },
];

function longFormat(d: Date, tz?: string): string {
	return d.toLocaleString("en-US", {
		timeZone: tz,
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZoneName: "short",
	});
}

export default function EpochConverter() {
	const [now, setNow] = useState(() => Date.now());
	const [tab, setTab] = useState<Tab>("convert");
	const [timeZone, setTimeZone] = useState(LOCAL_TIME_ZONE);
	const [date, setDate] = useState<Date>(() => new Date(Math.floor(Date.now() / 1000) * 1000));
	const [draft, setDraft] = useState<{ id: FormatId; text: string; invalid: boolean } | null>(null);
	const { copy, isCopied } = useClipboard();

	// Date math
	const [mathStart, setMathStart] = useState<string>(() => formatDateTimeLocal(new Date()));
	const [mathOp, setMathOp] = useState<"add" | "subtract">("add");
	const [mathAmount, setMathAmount] = useState("7");
	const [mathUnit, setMathUnit] = useState<DateUnit>("days");

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 100);
		return () => clearInterval(interval);
	}, []);

	const tz = resolveTimeZone(timeZone);

	const handleField = (def: FormatDef, text: string) => {
		const parsed = text.trim() ? def.parse(text, tz) : null;
		setDraft({ id: def.id, text, invalid: !parsed });
		if (parsed) setDate(parsed);
	};

	const mathResult = useMemo(() => {
		const start = parseDateTimeLocal(mathStart, tz) ?? parseLooseDate(mathStart);
		const amount = Number(mathAmount);
		if (!start || !Number.isFinite(amount)) return null;
		return { start, result: addToDate(start, mathOp === "add" ? amount : -amount, mathUnit, tz) };
	}, [mathStart, mathAmount, mathOp, mathUnit, tz]);

	const nowDate = new Date(now);

	return (
		<div className={styles.container}>
			{/* Live clock */}
			<div className={styles.liveBar}>
				<div className={styles.liveMain}>
					<ClockIcon className={styles.liveIcon} />
					<div className="min-w-0">
						<span className={styles.liveLabel}>Current time</span>
						<span className={styles.liveText}>{longFormat(nowDate, tz)}</span>
					</div>
				</div>
				<div className={styles.liveValues}>
					{(["unix", "unixMs"] as const).map((id) => {
						const value = id === "unix" ? String(Math.floor(now / 1000)) : String(now);
						return (
							<button key={id} type="button" className={styles.liveValue} onClick={() => copy(value, `live-${id}`)} title="Copy">
								<span className={styles.liveMono}>{value}</span>
								{isCopied(`live-${id}`) ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
							</button>
						);
					})}
				</div>
			</div>

			<div className="grid gap-3 md:grid-cols-[1fr_auto] items-center mt-4">
				<SegmentedControl<Tab>
					label="Section"
					value={tab}
					onChange={setTab}
					options={[
						{ value: "convert", label: "Convert" },
						{ value: "math", label: "Date math" },
					]}
				/>
				<div className="flex items-center gap-2">
					<label htmlFor="epoch-tz" className={styles.tzLabel}>
						Zone
					</label>
					<select id="epoch-tz" className={styles.tzSelect} value={timeZone} onChange={(e) => { setTimeZone(e.target.value); setDraft(null); }}>
						{COMMON_TIME_ZONES.map((z) => (
							<option key={z.value} value={z.value}>{z.label}</option>
						))}
					</select>
				</div>
			</div>

			{tab === "convert" && (
				<>
					<div className={`mt-4 ${styles.panel}`}>
						{FORMATS.map((def) => {
							const text = draft?.id === def.id ? draft.text : def.format(date, tz);
							const invalid = draft?.id === def.id && draft.invalid;
							const inputId = `epoch-${def.id}`;
							return (
								<div key={def.id} className={styles.row}>
									<label htmlFor={inputId} className={styles.rowLabel}>
										{def.label}
										{def.hint && <span className={styles.rowHint}>{def.hint}</span>}
									</label>
									<input
										id={inputId}
										type="text"
										value={text}
										onChange={(e) => handleField(def, e.target.value)}
										onBlur={() => setDraft(null)}
										className={`${styles.rowInput} ${invalid ? styles.invalid : ""}`}
										spellCheck={false}
										autoComplete="off"
									/>
									<button type="button" className={styles.rowCopy} onClick={() => copy(def.format(date, tz), def.id)} aria-label={`Copy ${def.label}`}>
										{isCopied(def.id) ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
									</button>
								</div>
							);
						})}
						<div className={styles.footerRow}>
							<span className={styles.footerText}>
								{longFormat(date, tz)} · {relativeTime(date, nowDate)}
							</span>
							<button type="button" className={styles.btnSecondary} onClick={() => { setDate(new Date(Math.floor(Date.now() / 1000) * 1000)); setDraft(null); }}>
								<ClockIcon className="w-4 h-4" />
								Use current time
							</button>
						</div>
					</div>
				</>
			)}

			{tab === "math" && (
				<div className={`mt-4 ${styles.panel}`}>
					<div className={styles.row}>
						<label htmlFor="math-start" className={styles.rowLabel}>Starting date &amp; time</label>
						<input
							id="math-start"
							type="text"
							value={mathStart}
							onChange={(e) => setMathStart(e.target.value)}
							className={`${styles.rowInput} ${mathResult ? "" : styles.invalid}`}
							placeholder="YYYY-MM-DD HH:mm:ss"
							spellCheck={false}
							autoComplete="off"
						/>
						<button type="button" className={styles.rowCopy} onClick={() => setMathStart(formatDateTimeLocal(new Date(), tz))} title="Use now">
							<ClockIcon className="w-4 h-4" />
						</button>
					</div>
					<div className={styles.mathRow}>
						<SegmentedControl<"add" | "subtract">
							label="Operation"
							size="sm"
							fill={false}
							value={mathOp}
							onChange={setMathOp}
							options={[
								{ value: "add", label: "Add" },
								{ value: "subtract", label: "Subtract" },
							]}
						/>
						<label className="sr-only" htmlFor="math-amount">Amount</label>
						<input id="math-amount" type="number" value={mathAmount} onChange={(e) => setMathAmount(e.target.value)} className={styles.amountInput} />
						<label className="sr-only" htmlFor="math-unit">Unit</label>
						<select id="math-unit" value={mathUnit} onChange={(e) => setMathUnit(e.target.value as DateUnit)} className={styles.tzSelect}>
							{DATE_UNITS.map((u) => (
								<option key={u.id} value={u.id}>{u.label}</option>
							))}
						</select>
					</div>
					{mathResult ? (
						<>
							<div className={styles.resultBlock}>
								<span className={styles.resultBig}>{longFormat(mathResult.result, tz)}</span>
								<span className={styles.footerText}>{relativeTime(mathResult.result, nowDate)}</span>
							</div>
							{FORMATS.map((def) => (
								<div key={def.id} className={styles.row}>
									<span className={styles.rowLabel}>{def.label}</span>
									<code className={styles.rowValue}>{def.format(mathResult.result, tz)}</code>
									<button type="button" className={styles.rowCopy} onClick={() => copy(def.format(mathResult.result, tz), `math-${def.id}`)} aria-label={`Copy ${def.label}`}>
										{isCopied(`math-${def.id}`) ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
									</button>
								</div>
							))}
							<div className={styles.footerRow}>
								<button type="button" className={styles.btnSecondary} onClick={() => { setDate(mathResult.result); setDraft(null); setTab("convert"); }}>
									Open result in Convert
								</button>
							</div>
						</>
					) : (
						<p className={styles.hint}>Enter a starting date as YYYY-MM-DD HH:mm:ss, an ISO string, or a Unix timestamp.</p>
					)}
				</div>
			)}

			{/* Info */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>About Unix timestamps</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>What is a Unix timestamp?</h3>
						<p className={styles.infoText}>The number of seconds since January 1, 1970 at 00:00:00 UTC. It is timezone-independent, easy to compare and store, and used by databases, APIs, logs and most languages.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Seconds vs milliseconds</h3>
						<p className={styles.infoText}>Ten-digit values are seconds, thirteen-digit values are milliseconds. JavaScript&apos;s <code>Date.now()</code> returns milliseconds. Both fields above accept either.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Time zones</h3>
						<p className={styles.infoText}>Unix, ISO and RFC 2822 values are absolute. Only the &ldquo;Date &amp; time&rdquo; row and the date-math calendar arithmetic depend on the selected zone.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Year 2038 problem</h3>
						<p className={styles.infoText}>32-bit signed Unix time overflows on January 19, 2038. Modern 64-bit systems extend the range to billions of years.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
