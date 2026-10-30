"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./Ipv4AddressConverter.module.scss";
import {
	parseIPv4,
	formatIPv4,
	ipv4ToHex,
	ipv4ToBinary,
	ipv4ToOctal,
	ipv4ToIpv6Mapped,
	hexToIpv4,
	binaryToIpv4,
} from "@/lib/ipv4Utils";
import { useClipboard } from "@/hooks/useClipboard";

interface Representations {
	dotted: string;
	integer: string;
	hex: string;
	binary: string;
	octal: string;
	ipv6: string;
}

function detectAndConvert(input: string): Representations {
	const trimmed = input.trim();
	if (!trimmed) throw new Error("Empty input");

	let dotted: string;

	if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
		parseIPv4(trimmed); // validate
		dotted = trimmed;
	} else if (/^0x[0-9a-f]+$/i.test(trimmed) || /^[0-9a-f]{8}$/i.test(trimmed)) {
		dotted = hexToIpv4(trimmed);
	} else if (/^[01.]+$/.test(trimmed) && trimmed.replace(/\./g, "").length === 32) {
		dotted = binaryToIpv4(trimmed);
	} else if (/^\d+$/.test(trimmed)) {
		const n = Number(trimmed);
		if (n < 0 || n > 0xffffffff) throw new Error("Integer out of IPv4 range");
		dotted = formatIPv4(n);
	} else {
		throw new Error("Unrecognized IPv4 format");
	}

	const n = parseIPv4(dotted);
	return {
		dotted,
		integer: (n >>> 0).toString(10),
		hex: ipv4ToHex(dotted),
		binary: ipv4ToBinary(dotted),
		octal: ipv4ToOctal(dotted),
		ipv6: ipv4ToIpv6Mapped(dotted),
	};
}

export default function Ipv4AddressConverter() {
	const [input, setInput] = useState("192.168.1.1");
	const { copy, isCopied } = useClipboard();

	const result = useMemo<{ reps: Representations | null; error: string | null }>(() => {
		if (!input.trim()) return { reps: null, error: null };
		try {
			return { reps: detectAndConvert(input), error: null };
		} catch (err) {
			return { reps: null, error: err instanceof Error ? err.message : "Invalid input" };
		}
	}, [input]);

	const rows = useMemo(() => {
		const reps = result.reps;
		if (!reps) return [];
		return [
			{ label: "Dotted Decimal", value: reps.dotted, field: "dotted" },
			{ label: "Integer (decimal)", value: reps.integer, field: "integer" },
			{ label: "Hexadecimal", value: reps.hex, field: "hex" },
			{ label: "Binary", value: reps.binary, field: "binary" },
			{ label: "Octal", value: reps.octal, field: "octal" },
			{ label: "IPv6-Mapped", value: reps.ipv6, field: "ipv6" },
		];
	}, [result.reps]);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>IPv4 Address</h3>
				<label htmlFor="ipv4-input" className={`block mb-2 text-sm font-medium ${styles.label}`}>
					Enter any IPv4 representation
				</label>
				<input
					id="ipv4-input"
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="192.168.1.1 / 3232235777 / 0xC0A80101 / 11000000.10101000.00000001.00000001"
					className={styles.input}
					spellCheck={false}
				/>
				<p className={`mt-2 text-xs m-0 ${styles.hint}`}>
					Auto-detects: dotted decimal, integer, hex (0x...), or 32-bit binary.
				</p>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{result.reps && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Representations</h3>
					<div className={styles.resultGrid}>
						{rows.map((row) => (
							<div key={row.field} className={styles.resultRow}>
								<span className={styles.resultLabel}>{row.label}</span>
								<div className={styles.resultValueWrap}>
									<code className={styles.resultValue}>{row.value}</code>
									<button
										onClick={() => copy(row.value, row.field)}
										className={`${styles.copyBtn} ${isCopied(row.field) ? styles.copied : ""}`}
										aria-label={`Copy ${row.label}`}
										title="Copy"
									>
										{isCopied(row.field) ? (
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
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About IPv4 Representations</h3>
				<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Same Value, Different Form</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							An IPv4 address is a single 32-bit unsigned integer. Each representation (<code>dotted</code>, <code>integer</code>, <code>hex</code>, <code>binary</code>, <code>octal</code>) is just a different way of writing those same 32 bits.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>IPv6-Mapped</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The <code>::ffff:a.b.c.d</code> form (RFC 4291) lets IPv6 sockets accept IPv4 connections — common in dual-stack networking code.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
