"use client";

import { useCallback, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./MacAddressGenerator.module.scss";
import {
	randomMacBytes,
	bytesToMacHex,
	formatMac,
	type MacSeparator,
	type MacCase,
} from "@/lib/macUtils";
import { useClipboard } from "@/hooks/useClipboard";

const SEPARATOR_OPTIONS: { value: MacSeparator; label: string }[] = [
	{ value: ":", label: "Colon" },
	{ value: "-", label: "Hyphen" },
	{ value: ".", label: "Dot (Cisco)" },
	{ value: "", label: "None" },
];

export default function MacAddressGenerator() {
	const [count, setCount] = useState(5);
	const [locallyAdministered, setLocallyAdministered] = useState(true);
	const [multicast, setMulticast] = useState(false);
	const [usePrefix, setUsePrefix] = useState(false);
	const [prefix, setPrefix] = useState("001451");
	const [separator, setSeparator] = useState<MacSeparator>(":");
	const [caseMode, setCaseMode] = useState<MacCase>("lower");
	const [generated, setGenerated] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	const handleGenerate = useCallback(() => {
		setError(null);
		const n = Math.max(1, Math.min(1000, count));
		try {
			const results: string[] = [];
			for (let i = 0; i < n; i++) {
				const bytes = randomMacBytes({
					locallyAdministered: usePrefix ? undefined : locallyAdministered,
					multicast: usePrefix ? undefined : multicast,
					prefix: usePrefix ? prefix : undefined,
				});
				const hex = bytesToMacHex(bytes);
				results.push(formatMac(hex, separator, caseMode));
			}
			setGenerated(results);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate");
		}
	}, [count, locallyAdministered, multicast, usePrefix, prefix, separator, caseMode]);

	const handleCopyAll = useCallback(() => {
		copy(generated.join("\n"), "all");
	}, [copy, generated]);

	const handleClear = useCallback(() => {
		setGenerated([]);
		setError(null);
	}, []);

	const handleCountChange = (v: string) => {
		const n = parseInt(v, 10);
		if (!Number.isNaN(n)) setCount(Math.max(1, Math.min(1000, n)));
	};

	return (
		<div className={styles.container}>
			{/* Options */}
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Generator Options</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label htmlFor="mac-count" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							Count (1-1000)
						</label>
						<input
							id="mac-count"
							type="number"
							min={1}
							max={1000}
							value={count}
							onChange={(e) => handleCountChange(e.target.value)}
							className={styles.input}
						/>
					</div>
					<div>
						<label htmlFor="mac-separator" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							Separator
						</label>
						<select
							id="mac-separator"
							value={separator}
							onChange={(e) => setSeparator(e.target.value as MacSeparator)}
							className={styles.input}
						>
							{SEPARATOR_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label} ({opt.value === "" ? "—" : opt.value})
								</option>
							))}
						</select>
					</div>
					<div>
						<label className={`block mb-2 text-sm font-medium ${styles.label}`}>Case</label>
						<div className="flex gap-2">
							<button
								onClick={() => setCaseMode("lower")}
								className={`${styles.toggleBtn} ${caseMode === "lower" ? styles.toggleActive : ""}`}
							>
								lowercase
							</button>
							<button
								onClick={() => setCaseMode("upper")}
								className={`${styles.toggleBtn} ${caseMode === "upper" ? styles.toggleActive : ""}`}
							>
								UPPERCASE
							</button>
						</div>
					</div>
					<div>
						<label htmlFor="mac-prefix" className={`block mb-2 text-sm font-medium ${styles.label}`}>
							Vendor Prefix (optional, 6 hex)
						</label>
						<div className="flex gap-2 items-center">
							<input
								type="checkbox"
								id="use-prefix"
								checked={usePrefix}
								onChange={(e) => setUsePrefix(e.target.checked)}
								className={styles.checkbox}
								aria-label="Use vendor prefix"
							/>
							<input
								id="mac-prefix"
								type="text"
								value={prefix}
								onChange={(e) => setPrefix(e.target.value)}
								placeholder="001451"
								disabled={!usePrefix}
								className={styles.input}
								spellCheck={false}
							/>
						</div>
					</div>
				</div>

				<div className={`flex flex-wrap gap-6 p-4 ${styles.optionsBar}`}>
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={locallyAdministered}
							onChange={(e) => setLocallyAdministered(e.target.checked)}
							disabled={usePrefix}
							className={styles.checkbox}
						/>
						Locally administered (U/L bit)
					</label>
					<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
						<input
							type="checkbox"
							checked={multicast}
							onChange={(e) => setMulticast(e.target.checked)}
							disabled={usePrefix}
							className={styles.checkbox}
						/>
						Multicast (I/G bit)
					</label>
				</div>

				<div className="flex gap-3 mt-4">
					<button onClick={handleGenerate} className={styles.btnPrimary}>
						<ArrowPathIcon className="w-4 h-4" />
						Generate
					</button>
					{generated.length > 0 && (
						<button onClick={handleClear} className={styles.btnSecondary}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					)}
				</div>
			</div>

			{error && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>{error}</div>
			)}

			{/* Generated List */}
			{generated.length > 0 && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-3">
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Generated MAC Addresses <span className={styles.countBadge}>{generated.length}</span>
						</h3>
						<button
							onClick={handleCopyAll}
							className={`${styles.btnPrimary} ${isCopied("all") ? styles.copied : ""}`}
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
						{generated.map((mac, i) => (
							<div key={`${mac}-${i}`} className={styles.row}>
								<span className={styles.rowIndex}>{i + 1}</span>
								<code className={styles.rowValue}>{mac}</code>
								<button
									onClick={() => copy(mac, `m-${i}`)}
									className={`${styles.copyBtn} ${isCopied(`m-${i}`) ? styles.copied : ""}`}
									aria-label={`Copy ${mac}`}
									title="Copy"
								>
									{isCopied(`m-${i}`) ? (
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
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About MAC Address Bits</h3>
				<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>U/L bit</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The second-least-significant bit of the first octet. <code>0</code> = universally administered (IEEE-assigned OUI). <code>1</code> = locally administered (the network admin chose it).
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>I/G bit</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The least-significant bit of the first octet. <code>0</code> = unicast (single destination). <code>1</code> = multicast/broadcast.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
