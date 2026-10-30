"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./OtpTotpGenerator.module.scss";
import { decodeBase32Rfc4648 } from "@/lib/base32Utils";
import { hmac, type HmacAlgo } from "@/lib/cryptoUtils";
import { useClipboard } from "@/hooks/useClipboard";

type Digits = 6 | 8;
type Algorithm = HmacAlgo;

const SUPPORTED_ALGOS: Algorithm[] = ["SHA-1", "SHA-256", "SHA-512"];

function counterBytes(counter: number): Uint8Array {
	const buf = new Uint8Array(8);
	// JS bitwise ops are 32-bit; split into high/low.
	const high = Math.floor(counter / 0x100000000);
	const low = counter >>> 0;
	const view = new DataView(buf.buffer);
	view.setUint32(0, high, false);
	view.setUint32(4, low, false);
	return buf;
}

async function computeTotp(
	secret: Uint8Array,
	counter: number,
	digits: Digits,
	algorithm: Algorithm
): Promise<string> {
	const hashBuf = await hmac(algorithm, secret, counterBytes(counter));
	const hash = new Uint8Array(hashBuf);
	const offset = hash[hash.length - 1] & 0x0f;
	const binary =
		((hash[offset] & 0x7f) << 24) |
		((hash[offset + 1] & 0xff) << 16) |
		((hash[offset + 2] & 0xff) << 8) |
		(hash[offset + 3] & 0xff);
	const mod = 10 ** digits;
	return (binary % mod).toString().padStart(digits, "0");
}

function parseOtpAuthUri(uri: string): {
	secret?: string;
	digits?: Digits;
	period?: number;
	algorithm?: Algorithm;
	label?: string;
	issuer?: string;
} | null {
	try {
		if (!uri.startsWith("otpauth://")) return null;
		const url = new URL(uri);
		if (url.host.toLowerCase() !== "totp") return null;

		const params = url.searchParams;
		const secret = params.get("secret") ?? undefined;
		const digitsRaw = params.get("digits");
		const periodRaw = params.get("period");
		const algoRaw = params.get("algorithm");
		const issuer = params.get("issuer") ?? undefined;
		const label = decodeURIComponent(url.pathname.replace(/^\//, "")) || undefined;

		let digits: Digits | undefined;
		if (digitsRaw === "6" || digitsRaw === "8") digits = Number(digitsRaw) as Digits;

		let period: number | undefined;
		if (periodRaw) {
			const n = Number(periodRaw);
			if (Number.isFinite(n) && n > 0) period = n;
		}

		let algorithm: Algorithm | undefined;
		if (algoRaw) {
			const a = algoRaw.toUpperCase();
			if (a === "SHA1") algorithm = "SHA-1";
			else if (a === "SHA256") algorithm = "SHA-256";
			else if (a === "SHA512") algorithm = "SHA-512";
		}

		return { secret, digits, period, algorithm, label, issuer };
	} catch {
		return null;
	}
}

export default function OtpTotpGenerator() {
	const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
	const [digits, setDigits] = useState<Digits>(6);
	const [period, setPeriod] = useState<number>(30);
	const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-1");
	const [uri, setUri] = useState("");
	const [uriError, setUriError] = useState<string | null>(null);

	const [now, setNow] = useState<number>(() => Date.now());
	const [codes, setCodes] = useState<{ prev: string; current: string; next: string }>({
		prev: "",
		current: "",
		next: "",
	});
	const [secretError, setSecretError] = useState<string | null>(null);

	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	const secretBytes = useMemo(() => {
		const trimmed = secret.replace(/\s+/g, "").toUpperCase();
		if (!trimmed) {
			setSecretError(null);
			return null;
		}
		try {
			const bytes = decodeBase32Rfc4648(trimmed);
			if (bytes.length === 0) {
				setSecretError("Secret decoded to zero bytes");
				return null;
			}
			setSecretError(null);
			return bytes;
		} catch (err) {
			setSecretError(err instanceof Error ? err.message : "Invalid base32 secret");
			return null;
		}
	}, [secret]);

	useEffect(() => {
		let cancelled = false;
		if (!secretBytes || period <= 0) {
			setCodes({ prev: "", current: "", next: "" });
			return;
		}
		const counter = Math.floor(now / 1000 / period);
		(async () => {
			try {
				const [p, c, n] = await Promise.all([
					computeTotp(secretBytes, counter - 1, digits, algorithm),
					computeTotp(secretBytes, counter, digits, algorithm),
					computeTotp(secretBytes, counter + 1, digits, algorithm),
				]);
				if (!cancelled) setCodes({ prev: p, current: c, next: n });
			} catch {
				if (!cancelled) setCodes({ prev: "", current: "", next: "" });
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [secretBytes, now, digits, period, algorithm]);

	const secondsRemaining = period > 0 ? period - (Math.floor(now / 1000) % period) : 0;
	const progress = period > 0 ? secondsRemaining / period : 0;

	const handleParseUri = useCallback(() => {
		const trimmed = uri.trim();
		if (!trimmed) {
			setUriError("Paste an otpauth:// URI");
			return;
		}
		const parsed = parseOtpAuthUri(trimmed);
		if (!parsed) {
			setUriError("Not a valid otpauth://totp URI");
			return;
		}
		if (parsed.secret) setSecret(parsed.secret);
		if (parsed.digits) setDigits(parsed.digits);
		if (parsed.period) setPeriod(parsed.period);
		if (parsed.algorithm) setAlgorithm(parsed.algorithm);
		setUriError(null);
	}, [uri]);

	const formatCode = (code: string) => {
		if (!code) return "";
		const half = Math.ceil(code.length / 2);
		return `${code.slice(0, half)} ${code.slice(half)}`;
	};

	return (
		<div className={styles.container}>
			{/* Live code panel */}
			<div className={styles.glassCard}>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Current code
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							TOTP per RFC 6238 — computed entirely in the browser.
						</p>
					</div>
					<div className={styles.countdownWrap}>
						<svg className={styles.ring} viewBox="0 0 36 36" aria-hidden="true">
							<circle className={styles.ringTrack} cx="18" cy="18" r="16" />
							<circle
								className={styles.ringProgress}
								cx="18"
								cy="18"
								r="16"
								style={{
									strokeDasharray: `${2 * Math.PI * 16}`,
									strokeDashoffset: `${2 * Math.PI * 16 * (1 - progress)}`,
								}}
							/>
						</svg>
						<span className={styles.countdownLabel}>{secondsRemaining}s</span>
					</div>
				</div>

				<div className={styles.codeRow}>
					<button
						type="button"
						onClick={() => codes.current && copy(codes.current, "current")}
						className={`${styles.codeBtn} ${isCopied("current") ? styles.codeCopied : ""}`}
						disabled={!codes.current}
						aria-label="Copy current code"
					>
						<span className={styles.codeText}>
							{codes.current ? formatCode(codes.current) : "—"}
						</span>
						<span className={styles.codeHint}>
							{isCopied("current") ? (
								<>
									<CheckIcon className="w-4 h-4" /> Copied
								</>
							) : (
								<>
									<ClipboardDocumentIcon className="w-4 h-4" /> Click to copy
								</>
							)}
						</span>
					</button>
				</div>

				<div className={styles.adjacentCodes}>
					<AdjacentCode label="Previous" value={codes.prev} styles={styles} />
					<AdjacentCode label="Next" value={codes.next} styles={styles} />
				</div>

				{secretError && (
					<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
						{secretError}
					</div>
				)}
			</div>

			{/* Settings */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Settings</h3>
				<div className={styles.settingsGrid}>
					<div className={`${styles.field} ${styles.fieldFull}`}>
						<label htmlFor="totp-secret" className={styles.label}>
							Base32 secret
						</label>
						<input
							id="totp-secret"
							type="text"
							value={secret}
							onChange={(e) => setSecret(e.target.value)}
							className={styles.input}
							placeholder="JBSWY3DPEHPK3PXP"
							spellCheck={false}
							autoComplete="off"
						/>
					</div>
					<div className={styles.field}>
						<label htmlFor="totp-digits" className={styles.label}>
							Digits
						</label>
						<select
							id="totp-digits"
							value={digits}
							onChange={(e) => setDigits(Number(e.target.value) as Digits)}
							className={styles.select}
						>
							<option value={6}>6</option>
							<option value={8}>8</option>
						</select>
					</div>
					<div className={styles.field}>
						<label htmlFor="totp-period" className={styles.label}>
							Period (seconds)
						</label>
						<input
							id="totp-period"
							type="number"
							min={1}
							max={300}
							value={period}
							onChange={(e) => setPeriod(Math.max(1, Number(e.target.value) || 30))}
							className={styles.input}
						/>
					</div>
					<div className={styles.field}>
						<label htmlFor="totp-algo" className={styles.label}>
							Algorithm
						</label>
						<select
							id="totp-algo"
							value={algorithm}
							onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
							className={styles.select}
						>
							{SUPPORTED_ALGOS.map((a) => (
								<option key={a} value={a}>
									{a}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* otpauth URI parser */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
					otpauth:// URI
				</h3>
				<p className={`text-xs mt-1 mb-3 m-0 ${styles.cardSubtitle}`}>
					Paste a TOTP provisioning URI to populate the settings above.
				</p>
				<div className={styles.uriRow}>
					<label htmlFor="totp-uri" className="sr-only">
						otpauth URI
					</label>
					<input
						id="totp-uri"
						type="text"
						value={uri}
						onChange={(e) => setUri(e.target.value)}
						className={styles.input}
						placeholder="otpauth://totp/Issuer:user@example.com?secret=...&issuer=Issuer"
						spellCheck={false}
						autoComplete="off"
					/>
					<button type="button" onClick={handleParseUri} className={styles.btnPrimary}>
						<ArrowPathIcon className="w-4 h-4" />
						Parse
					</button>
				</div>
				{uriError && (
					<div className={`mt-3 px-4 py-3 text-sm ${styles.errorBox}`}>
						{uriError}
					</div>
				)}
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About TOTP
				</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							How it works
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							TOTP (RFC 6238) derives a code from a shared secret and the current
							time. The counter is <code>floor(unix_time / period)</code>; HMAC of
							that counter is dynamically truncated to a numeric code.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							Defaults
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Most providers use SHA-1, 6 digits, 30-second period. Some (e.g.
							Authy, Steam) use SHA-256 or longer periods. Match your issuer&apos;s
							exactly.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function AdjacentCode({
	label,
	value,
	styles,
}: {
	label: string;
	value: string;
	styles: Record<string, string>;
}) {
	return (
		<div className={styles.adjacentItem}>
			<div className={styles.adjacentLabel}>{label}</div>
			<div className={styles.adjacentValue}>{value || "—"}</div>
		</div>
	);
}
