"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./Ipv4RangeExpander.module.scss";
import { parseIPv4, rangeToCidrs } from "@/lib/ipv4Utils";
import { useClipboard } from "@/hooks/useClipboard";

export default function Ipv4RangeExpander() {
	const [startIp, setStartIp] = useState("10.0.0.5");
	const [endIp, setEndIp] = useState("10.0.0.250");
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => {
		if (!startIp.trim() || !endIp.trim()) {
			return { cidrs: null, total: 0, error: null as string | null };
		}
		try {
			const start = parseIPv4(startIp);
			const end = parseIPv4(endIp);
			if (end < start) throw new Error("End IP must be greater than or equal to start IP");
			const cidrs = rangeToCidrs(start, end);
			const total = (end >>> 0) - (start >>> 0) + 1;
			return { cidrs, total, error: null };
		} catch (err) {
			return {
				cidrs: null,
				total: 0,
				error: err instanceof Error ? err.message : "Invalid input",
			};
		}
	}, [startIp, endIp]);

	const allCidrsText = result.cidrs?.join("\n") ?? "";

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>IP Range</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="start-ip" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							Start IP
						</label>
						<input
							id="start-ip"
							type="text"
							value={startIp}
							onChange={(e) => setStartIp(e.target.value)}
							placeholder="10.0.0.0"
							className={styles.input}
							spellCheck={false}
						/>
					</div>
					<div>
						<label htmlFor="end-ip" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							End IP
						</label>
						<input
							id="end-ip"
							type="text"
							value={endIp}
							onChange={(e) => setEndIp(e.target.value)}
							placeholder="10.0.0.255"
							className={styles.input}
							spellCheck={false}
						/>
					</div>
				</div>
			</div>

			{result.error && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{result.cidrs && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
						<div>
							<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
								CIDR Blocks <span className={styles.countBadge}>{result.cidrs.length}</span>
							</h3>
							<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
								{result.total.toLocaleString()} total addresses
							</p>
						</div>
						<button
							onClick={() => copy(allCidrsText, "all")}
							className={`${styles.copyAllBtn} ${isCopied("all") ? styles.copied : ""}`}
							disabled={!allCidrsText}
						>
							{isCopied("all") ? (
								<>
									<CheckIcon className="w-4 h-4" />
									Copied!
								</>
							) : (
								<>
									<ClipboardDocumentIcon className="w-4 h-4" />
									Copy All
								</>
							)}
						</button>
					</div>
					<div className={styles.list}>
						{result.cidrs.map((cidr, i) => (
							<div key={`${cidr}-${i}`} className={styles.row}>
								<span className={styles.rowIndex}>{i + 1}</span>
								<code className={styles.rowValue}>{cidr}</code>
								<button
									onClick={() => copy(cidr, `c-${i}`)}
									className={`${styles.copyBtn} ${isCopied(`c-${i}`) ? styles.copied : ""}`}
									aria-label={`Copy ${cidr}`}
									title="Copy"
								>
									{isCopied(`c-${i}`) ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About Range Expansion</h3>
				<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Minimal CIDR Cover</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Any contiguous IPv4 range can be expressed as a small set of power-of-two-aligned CIDR blocks. This tool produces the minimal set covering exactly the inclusive range — useful for ACLs, firewall rules, and BGP prefix lists.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>How it Works</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							At each step the algorithm picks the largest block that is aligned to the current IP and does not exceed the end IP, then advances past it. Block sizes are always powers of two.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
