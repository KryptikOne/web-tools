"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./SafelinkDecoder.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

interface DecodedRow {
	id: string;
	original: string;
	decoded: string;
	source: string;
	changed: boolean;
}

// ---- Decoders ----

function refangText(text: string): string {
	return text
		.replace(/\[\.\]/g, ".")
		.replace(/\(\.\)/g, ".")
		.replace(/\[:\]/g, ":")
		.replace(/\[\/\]/g, "/")
		.replace(/\[@\]/g, "@")
		.replace(/\bhxxps?:\/\//gi, (m) => m.toLowerCase().replace("hxxp", "http"))
		.replace(/\bfxp:\/\//gi, "ftp://");
}

function tryDecode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		try {
			return decodeURIComponent(value.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
		} catch {
			return value;
		}
	}
}

function safeUrl(input: string): URL | null {
	try {
		return new URL(input);
	} catch {
		return null;
	}
}

interface DecodeResult {
	url: string;
	source: string;
}

function decodeSafelinks(u: URL): DecodeResult | null {
	if (!/safelinks\.protection\.outlook\.com$/i.test(u.hostname)) return null;
	const target = u.searchParams.get("url");
	if (!target) return null;
	return { url: tryDecode(target), source: "Microsoft SafeLinks" };
}

function decodeBarracuda(u: URL): DecodeResult | null {
	if (!/linkprotect\.cudasvc\.com$/i.test(u.hostname)) return null;
	const a = u.searchParams.get("a");
	if (!a) return null;
	return { url: tryDecode(a), source: "Barracuda LinkProtect" };
}

function decodeMimecast(u: URL): DecodeResult | null {
	if (!/(^|\.)mimecast\.com$/i.test(u.hostname)) return null;
	const domain = u.searchParams.get("domain");
	if (domain) {
		const decoded = tryDecode(domain);
		const withScheme = /^https?:\/\//i.test(decoded) ? decoded : `https://${decoded}`;
		return { url: withScheme, source: "Mimecast" };
	}
	return null;
}

function decodeProofpointV1V2(u: URL): DecodeResult | null {
	if (!/urldefense\.proofpoint\.com$/i.test(u.hostname)) return null;
	const m = u.pathname.match(/^\/(v[12])\//);
	if (!m) return null;
	const target = u.searchParams.get("u");
	if (!target) return null;
	// Proofpoint v1/v2 replace - with _ and _ with - for some chars, plus encode
	const swapped = target.replace(/-/g, "%").replace(/_/g, "/");
	const decoded = tryDecode(swapped);
	return { url: decoded, source: `Proofpoint URLDefense ${m[1]}` };
}

function decodeProofpointV3(input: string): DecodeResult | null {
	// v3 format: https://urldefense.com/v3/__<URL>__;<base64-encoded-replacement-chars>!<random>!<more>
	const re =
		/^https?:\/\/urldefense(?:\.proofpoint)?\.com\/v3\/__(.+?)__;([A-Za-z0-9+/=_-]*)!.*$/i;
	const m = input.match(re);
	if (!m) return null;
	let url = m[1];
	const replacementsB64 = m[2];

	if (replacementsB64) {
		try {
			const padded =
				replacementsB64 + "=".repeat((4 - (replacementsB64.length % 4)) % 4);
			const standard = padded.replace(/-/g, "+").replace(/_/g, "/");
			const decoded = atob(standard);
			let i = 0;
			url = url.replace(/\*/g, () => {
				const ch = decoded[i] ?? "";
				i += 1;
				return ch;
			});
		} catch {
			// fall through with literal asterisks
		}
	}
	return { url, source: "Proofpoint URLDefense v3" };
}

function decodeOne(rawInput: string): DecodeResult {
	const input = rawInput.trim();
	if (!input) return { url: input, source: "" };

	// Refang first so hxxp:// or [.] notation reaches the URL parser
	const refanged = refangText(input);
	const wasRefanged = refanged !== input;

	const v3 = decodeProofpointV3(refanged);
	if (v3) {
		const inner = decodeOne(v3.url);
		return inner.source && inner.source !== v3.source
			? { url: inner.url, source: `${v3.source} → ${inner.source}` }
			: v3;
	}

	const url = safeUrl(refanged);
	if (!url) {
		return wasRefanged
			? { url: refanged, source: "Defanged URL" }
			: { url: refanged, source: "" };
	}

	const handlers = [decodeSafelinks, decodeBarracuda, decodeMimecast, decodeProofpointV1V2];
	for (const h of handlers) {
		const out = h(url);
		if (out) {
			// Recursively decode in case of nested wrappers
			const inner = decodeOne(out.url);
			return inner.source && inner.source !== out.source
				? { url: inner.url, source: `${out.source} → ${inner.source}` }
				: out;
		}
	}

	return wasRefanged
		? { url: refanged, source: "Defanged URL" }
		: { url: refanged, source: "Unchanged" };
}

// Extract URLs (including defanged) from a free-text blob.
function extractCandidates(text: string): string[] {
	if (!text) return [];
	const re = /\b((?:https?|hxxps?|ftp|fxp):\/\/[^\s<>"']+|\b[\w.-]+\[\.\][\w.-]+(?:\/[^\s<>"']*)?)/gi;
	const matches = text.match(re) ?? [];
	// Trim trailing punctuation that often follows URLs
	return matches
		.map((m) => m.replace(/[),.;:!?]+$/u, ""))
		.filter((m) => m.length > 0);
}

export default function SafelinkDecoder() {
	const [input, setInput] = useState("");
	const { copy, isCopied } = useClipboard();

	const rows = useMemo<DecodedRow[]>(() => {
		const trimmed = input.trim();
		if (!trimmed) return [];

		const candidates = extractCandidates(trimmed);
		// If there are no extracted candidates but the user pasted a single line that
		// looks like a URL after refanging, treat the whole thing as one candidate.
		const targets = candidates.length > 0 ? candidates : [trimmed];

		return targets.map((original, idx) => {
			const { url: decoded, source } = decodeOne(original);
			return {
				id: `row-${idx}`,
				original,
				decoded,
				source: source || "Unchanged",
				changed: decoded !== original,
			};
		});
	}, [input]);

	const decodedCount = rows.filter((r) => r.changed).length;

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between mb-3 flex-wrap gap-3">
					<div>
						<h2 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Paste wrapped, defanged, or rewritten URLs
						</h2>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Supports Microsoft SafeLinks, Proofpoint URLDefense v1/v2/v3, Barracuda,
							Mimecast, and defanged links (<code>hxxp://</code>, <code>example[.]com</code>).
						</p>
					</div>
					<button
						type="button"
						onClick={() => setInput("")}
						disabled={!input}
						className={styles.btnSecondary}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>

				<label htmlFor="safelink-input" className="sr-only">
					Input text or URL
				</label>
				<textarea
					id="safelink-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={
						"Paste a single URL or a block of text containing one or more wrapped/defanged URLs..."
					}
					className={styles.textarea}
					spellCheck={false}
				/>

				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>
						{rows.length} URL{rows.length === 1 ? "" : "s"} found
						{rows.length > 0 ? ` · ${decodedCount} decoded` : ""}
					</span>
				</div>
			</div>

			{rows.length > 0 && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<h3 className={`text-base font-semibold mb-3 m-0 ${styles.cardTitle}`}>
						Decoded URLs
					</h3>
					<div className={styles.rowsWrap}>
						{rows.map((row) => (
							<div key={row.id} className={styles.row}>
								<div className={styles.rowMeta}>
									<span className={`${styles.badge} ${row.changed ? styles.badgeChanged : ""}`}>
										{row.source}
									</span>
								</div>
								<dl className={styles.urls}>
									<div className={styles.urlPair}>
										<dt className={styles.term}>Original</dt>
										<dd className={styles.def}>
											<code className={styles.urlText}>{row.original}</code>
										</dd>
									</div>
									<div className={styles.urlPair}>
										<dt className={styles.term}>Decoded</dt>
										<dd className={styles.def}>
											<code className={`${styles.urlText} ${styles.decoded}`}>
												{row.decoded}
											</code>
											<button
												type="button"
												onClick={() => copy(row.decoded, row.id)}
												className={`${styles.copyBtn} ${
													isCopied(row.id) ? styles.copied : ""
												}`}
												aria-label="Copy decoded URL"
											>
												{isCopied(row.id) ? (
													<CheckIcon className="w-4 h-4" />
												) : (
													<ClipboardDocumentIcon className="w-4 h-4" />
												)}
											</button>
										</dd>
									</div>
								</dl>
							</div>
						))}
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					What this decodes
				</h3>
				<ul className={`list-disc pl-5 m-0 ${styles.infoList}`}>
					<li>
						<strong>Microsoft SafeLinks</strong> — <code>*.safelinks.protection.outlook.com/?url=…</code>
					</li>
					<li>
						<strong>Proofpoint URLDefense</strong> — <code>v1</code>, <code>v2</code> (<code>u=</code> param) and <code>v3</code> (<code>__URL__;b64!…</code>)
					</li>
					<li>
						<strong>Barracuda LinkProtect</strong> — <code>linkprotect.cudasvc.com/url?a=…</code>
					</li>
					<li>
						<strong>Mimecast</strong> — <code>*.mimecast.com/s/?domain=…</code>
					</li>
					<li>
						<strong>Defanged URLs</strong> — refangs <code>hxxp://</code>, <code>[.]</code>, <code>[:]</code>, <code>[/]</code>, and <code>[@]</code>
					</li>
				</ul>
			</div>
		</div>
	);
}
