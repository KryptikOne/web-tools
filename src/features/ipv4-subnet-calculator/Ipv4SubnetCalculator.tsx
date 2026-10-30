"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./Ipv4SubnetCalculator.module.scss";
import {
	parseCidr,
	parseIPv4,
	parseNetmask,
	maskToCidr,
	getSubnetInfo,
	type SubnetInfo,
} from "@/lib/ipv4Utils";
import { useClipboard } from "@/hooks/useClipboard";

type InputMode = "cidr" | "netmask";

interface ResultRow {
	label: string;
	value: string;
	field: string;
}

export default function Ipv4SubnetCalculator() {
	const [mode, setMode] = useState<InputMode>("cidr");
	const [cidrInput, setCidrInput] = useState("10.0.0.0/24");
	const [ipInput, setIpInput] = useState("10.0.0.0");
	const [netmaskInput, setNetmaskInput] = useState("255.255.255.0");
	const { copy, isCopied } = useClipboard();

	const result = useMemo<{ info: SubnetInfo | null; error: string | null }>(() => {
		try {
			if (mode === "cidr") {
				if (!cidrInput.trim()) return { info: null, error: null };
				const { ip, prefix } = parseCidr(cidrInput);
				return { info: getSubnetInfo(ip, prefix), error: null };
			}
			if (!ipInput.trim() || !netmaskInput.trim()) return { info: null, error: null };
			const ip = parseIPv4(ipInput);
			const mask = parseNetmask(netmaskInput);
			const prefix = maskToCidr(mask);
			return { info: getSubnetInfo(ip, prefix), error: null };
		} catch (err) {
			return {
				info: null,
				error: err instanceof Error ? err.message : "Invalid input",
			};
		}
	}, [mode, cidrInput, ipInput, netmaskInput]);

	const rows: ResultRow[] = useMemo(() => {
		const info = result.info;
		if (!info) return [];
		return [
			{ label: "Network Address", value: info.network, field: "network" },
			{ label: "Broadcast Address", value: info.broadcast, field: "broadcast" },
			{ label: "First Usable Host", value: info.firstHost, field: "first" },
			{ label: "Last Usable Host", value: info.lastHost, field: "last" },
			{ label: "Netmask (dotted)", value: info.netmask, field: "mask" },
			{ label: "Netmask (hex)", value: info.netmaskHex, field: "maskhex" },
			{ label: "Wildcard Mask", value: info.wildcard, field: "wildcard" },
			{ label: "CIDR Prefix", value: `/${info.prefix}`, field: "prefix" },
			{ label: "Total Addresses", value: info.totalHosts.toLocaleString(), field: "total" },
			{ label: "Usable Hosts", value: info.usableHosts.toLocaleString(), field: "usable" },
			{ label: "Address Class", value: info.addressClass, field: "class" },
		];
	}, [result.info]);

	return (
		<div className={styles.container}>
			{/* Mode Tabs */}
			<div className={`flex gap-2 mb-6 ${styles.tabBar}`}>
				<button
					onClick={() => setMode("cidr")}
					className={`${styles.tab} ${mode === "cidr" ? styles.activeTab : ""}`}
				>
					CIDR Notation
				</button>
				<button
					onClick={() => setMode("netmask")}
					className={`${styles.tab} ${mode === "netmask" ? styles.activeTab : ""}`}
				>
					IP + Netmask
				</button>
			</div>

			{/* Input Card */}
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Subnet Input</h3>
				{mode === "cidr" ? (
					<div>
						<label htmlFor="cidr-input" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							CIDR Block
						</label>
						<input
							id="cidr-input"
							type="text"
							value={cidrInput}
							onChange={(e) => setCidrInput(e.target.value)}
							placeholder="10.0.0.0/24"
							className={styles.input}
							spellCheck={false}
						/>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label htmlFor="ip-input" className={`block mb-2 text-sm font-medium ${styles.label}`}>
								IP Address
							</label>
							<input
								id="ip-input"
								type="text"
								value={ipInput}
								onChange={(e) => setIpInput(e.target.value)}
								placeholder="192.168.1.1"
								className={styles.input}
								spellCheck={false}
							/>
						</div>
						<div>
							<label htmlFor="netmask-input" className={`block mb-2 text-sm font-medium ${styles.label}`}>
								Netmask
							</label>
							<input
								id="netmask-input"
								type="text"
								value={netmaskInput}
								onChange={(e) => setNetmaskInput(e.target.value)}
								placeholder="255.255.255.0"
								className={styles.input}
								spellCheck={false}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Error */}
			{result.error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{/* Results */}
			{result.info && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Subnet Details</h3>
					<div className={styles.resultGrid}>
						{rows.map((row) => (
							<div key={row.field} className={styles.resultRow}>
								<span className={styles.resultLabel}>{row.label}</span>
								<div className={styles.resultValueWrap}>
									<code className={styles.resultValue}>{row.value}</code>
									<button
										onClick={() => copy(row.value, row.field)}
										className={`${styles.copyBtn} ${isCopied(row.field) ? styles.copied : ""}`}
										title="Copy"
										aria-label={`Copy ${row.label}`}
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

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About IPv4 Subnetting</h3>
				<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>CIDR Notation</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							CIDR (Classless Inter-Domain Routing) uses the format <code>IP/prefix</code>,
							where the prefix is the number of leading 1 bits in the subnet mask. A <code>/24</code> equals <code>255.255.255.0</code>.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Usable Hosts</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Most subnets reserve the network and broadcast addresses, leaving <code>2^(32-prefix) - 2</code> usable hosts. <code>/31</code> point-to-point links (RFC 3021) and <code>/32</code> single hosts are special cases with no reserved addresses.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
