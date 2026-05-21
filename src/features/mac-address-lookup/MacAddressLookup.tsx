"use client";

import { useEffect, useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import styles from "./MacAddressLookup.module.scss";
import {
	normalizeMac,
	getOui,
	formatMac,
	isLocallyAdministered,
	isMulticast,
} from "@/lib/macUtils";
import { useClipboard } from "@/hooks/useClipboard";

interface LookupResult {
	normalized: string;
	formatted: string;
	oui: string;
	vendor: string | null;
	locallyAdministered: boolean;
	multicast: boolean;
}

export default function MacAddressLookup() {
	const [input, setInput] = useState("00:14:51:00:00:01");
	const [ouiDb, setOuiDb] = useState<Record<string, string> | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		let cancelled = false;
		import("@/data/oui-data.json")
			.then((mod) => {
				if (cancelled) return;
				setOuiDb((mod.default ?? mod) as Record<string, string>);
			})
			.catch((err) => {
				if (cancelled) return;
				setLoadError(err instanceof Error ? err.message : "Failed to load OUI database");
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const result = useMemo<{ data: LookupResult | null; error: string | null }>(() => {
		if (!input.trim()) return { data: null, error: null };
		try {
			const normalized = normalizeMac(input);
			const oui = getOui(normalized);
			const vendor = ouiDb ? (ouiDb[oui] ?? null) : null;
			return {
				data: {
					normalized,
					formatted: formatMac(normalized, ":", "upper"),
					oui,
					vendor,
					locallyAdministered: isLocallyAdministered(normalized),
					multicast: isMulticast(normalized),
				},
				error: null,
			};
		} catch (err) {
			return {
				data: null,
				error: err instanceof Error ? err.message : "Invalid MAC address",
			};
		}
	}, [input, ouiDb]);

	const ouiCount = ouiDb ? Object.keys(ouiDb).length : 0;

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>MAC Address</h3>
				<label htmlFor="mac-input" className={`block mb-2 text-sm font-medium ${styles.label}`}>
					Enter MAC (any format)
				</label>
				<div className={styles.inputWrap}>
					<MagnifyingGlassIcon className={`w-5 h-5 ${styles.searchIcon}`} />
					<input
						id="mac-input"
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="00:14:51:00:00:01  /  00-14-51-00-00-01  /  0014.5100.0001  /  001451000001"
						className={styles.input}
						spellCheck={false}
					/>
				</div>
				<p className={`mt-2 text-xs m-0 ${styles.hint}`}>
					Accepts <code>:</code>, <code>-</code>, <code>.</code>, or no separator.
					{ouiDb && <> Bundled OUI database: {ouiCount.toLocaleString()} entries.</>}
				</p>
			</div>

			{loadError && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					OUI database failed to load: {loadError}
				</div>
			)}

			{result.error && (
				<div className={`mt-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			{result.data && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Lookup Result</h3>
					<div className={styles.resultGrid}>
						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>Vendor</span>
							<div className={styles.resultValueWrap}>
								<code className={styles.resultValue}>
									{result.data.vendor ?? "Vendor not in bundled OUI database"}
								</code>
								{result.data.vendor && (
									<button
										onClick={() => copy(result.data!.vendor!, "vendor")}
										className={`${styles.copyBtn} ${isCopied("vendor") ? styles.copied : ""}`}
										aria-label="Copy vendor"
										title="Copy"
									>
										{isCopied("vendor") ? (
											<CheckIcon className="w-4 h-4" />
										) : (
											<ClipboardDocumentIcon className="w-4 h-4" />
										)}
									</button>
								)}
							</div>
						</div>

						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>OUI</span>
							<div className={styles.resultValueWrap}>
								<code className={styles.resultValue}>{result.data.oui}</code>
								<button
									onClick={() => copy(result.data!.oui, "oui")}
									className={`${styles.copyBtn} ${isCopied("oui") ? styles.copied : ""}`}
									aria-label="Copy OUI"
									title="Copy"
								>
									{isCopied("oui") ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>Normalized MAC</span>
							<div className={styles.resultValueWrap}>
								<code className={styles.resultValue}>{result.data.formatted}</code>
								<button
									onClick={() => copy(result.data!.formatted, "formatted")}
									className={`${styles.copyBtn} ${isCopied("formatted") ? styles.copied : ""}`}
									aria-label="Copy MAC"
									title="Copy"
								>
									{isCopied("formatted") ? (
										<CheckIcon className="w-4 h-4" />
									) : (
										<ClipboardDocumentIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>Cast Type</span>
							<div className={styles.resultValueWrap}>
								<span className={`${styles.tag} ${result.data.multicast ? styles.tagWarn : styles.tagOk}`}>
									{result.data.multicast ? "Multicast (I/G = 1)" : "Unicast (I/G = 0)"}
								</span>
							</div>
						</div>

						<div className={styles.resultRow}>
							<span className={styles.resultLabel}>Administration</span>
							<div className={styles.resultValueWrap}>
								<span className={`${styles.tag} ${result.data.locallyAdministered ? styles.tagWarn : styles.tagOk}`}>
									{result.data.locallyAdministered
										? "Locally administered (U/L = 1)"
										: "Universally administered (U/L = 0)"}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About OUI Lookup</h3>
				<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>OUI (Organizationally Unique Identifier)</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The first 24 bits of a MAC address identify the manufacturer. IEEE assigns these. This tool ships a curated subset of common vendor OUIs as a static asset — no network calls are made.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Limited Database</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The bundled list contains ~200 popular OUIs (Apple, Cisco, Intel, Samsung, etc.) plus virtualization prefixes. For complete lookups, the full IEEE registry is publicly available.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
