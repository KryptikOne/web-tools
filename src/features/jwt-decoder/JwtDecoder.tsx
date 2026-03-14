"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ExclamationTriangleIcon,
	ShieldCheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./JwtDecoder.module.scss";

interface DecodedJwt {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signatureHex: string;
}

const STANDARD_CLAIMS: Record<string, string> = {
	iss: "Issuer",
	sub: "Subject",
	aud: "Audience",
	exp: "Expiration Time",
	nbf: "Not Before",
	iat: "Issued At",
	jti: "JWT ID",
};

function base64UrlDecode(str: string): string {
	// Replace base64url chars with base64 equivalents
	let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

	// Pad with '=' to make length a multiple of 4
	const pad = base64.length % 4;
	if (pad) {
		base64 += "=".repeat(4 - pad);
	}

	try {
		return atob(base64);
	} catch {
		throw new Error("Invalid base64url encoding");
	}
}

function base64UrlToHex(str: string): string {
	const raw = base64UrlDecode(str);
	return Array.from(raw)
		.map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
		.join("");
}

function formatTimestamp(epoch: number): string {
	const date = new Date(epoch * 1000);
	return date.toLocaleString("en-US", {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
		timeZoneName: "short",
	});
}

function getTimeRemaining(exp: number): string {
	const now = Math.floor(Date.now() / 1000);
	const diff = exp - now;

	if (diff <= 0) {
		const elapsed = Math.abs(diff);
		if (elapsed < 60) return `Expired ${elapsed}s ago`;
		if (elapsed < 3600) return `Expired ${Math.floor(elapsed / 60)}m ago`;
		if (elapsed < 86400) return `Expired ${Math.floor(elapsed / 3600)}h ago`;
		return `Expired ${Math.floor(elapsed / 86400)}d ago`;
	}

	if (diff < 60) return `Expires in ${diff}s`;
	if (diff < 3600) return `Expires in ${Math.floor(diff / 60)}m`;
	if (diff < 86400) return `Expires in ${Math.floor(diff / 3600)}h`;
	return `Expires in ${Math.floor(diff / 86400)}d`;
}

export default function JwtDecoder() {
	const [token, setToken] = useState("");
	const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
	const [error, setError] = useState("");
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [, setTick] = useState(0);

	// Tick every second to keep expiration display fresh
	useEffect(() => {
		if (!decoded?.payload?.exp) return;
		const interval = setInterval(() => setTick((t) => t + 1), 1000);
		return () => clearInterval(interval);
	}, [decoded?.payload?.exp]);

	const decodeToken = useCallback((jwt: string) => {
		const trimmed = jwt.trim();
		if (!trimmed) {
			setDecoded(null);
			setError("");
			return;
		}

		const parts = trimmed.split(".");
		if (parts.length !== 3) {
			setDecoded(null);
			setError("Invalid JWT: expected 3 parts separated by dots (header.payload.signature)");
			return;
		}

		try {
			const headerJson = base64UrlDecode(parts[0]);
			const header = JSON.parse(headerJson);

			const payloadJson = base64UrlDecode(parts[1]);
			const payload = JSON.parse(payloadJson);

			const signatureHex = base64UrlToHex(parts[2]);

			setDecoded({ header, payload, signatureHex });
			setError("");
		} catch (e) {
			setDecoded(null);
			setError(e instanceof Error ? `Invalid JWT: ${e.message}` : "Invalid JWT: could not decode token");
		}
	}, []);

	const handleTokenChange = useCallback(
		(value: string) => {
			setToken(value);
			decodeToken(value);
		},
		[decodeToken]
	);

	const handleClear = useCallback(() => {
		setToken("");
		setDecoded(null);
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

	const tokenParts = useMemo(() => {
		const trimmed = token.trim();
		if (!trimmed) return null;
		const parts = trimmed.split(".");
		if (parts.length !== 3) return null;
		return parts;
	}, [token]);

	const standardClaims = useMemo(() => {
		if (!decoded) return [];
		return Object.entries(STANDARD_CLAIMS)
			.filter(([key]) => key in decoded.payload)
			.map(([key, label]) => {
				const value = decoded.payload[key];
				let displayValue = String(value);
				let extra = "";

				if ((key === "exp" || key === "nbf" || key === "iat") && typeof value === "number") {
					displayValue = String(value);
					extra = formatTimestamp(value);
				}

				return { key, label, value: displayValue, extra };
			});
	}, [decoded]);

	const isExpired = useMemo(() => {
		if (!decoded?.payload?.exp || typeof decoded.payload.exp !== "number") return null;
		return Date.now() / 1000 > decoded.payload.exp;
	}, [decoded?.payload?.exp]);

	return (
		<div className={styles.container}>
			{/* Token Input */}
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between mb-4">
					<h2 className={styles.sectionTitle} style={{ margin: 0 }}>
						JWT Token
					</h2>
					{token && (
						<button className={styles.btnSecondary} onClick={handleClear}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					)}
				</div>
				<label className={styles.inputLabel}>Paste your JWT token below</label>
				<textarea
					className={styles.tokenInput}
					value={token}
					onChange={(e) => handleTokenChange(e.target.value)}
					placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
					spellCheck={false}
					autoComplete="off"
				/>
			</div>

			{/* Error State */}
			{error && (
				<div className={`flex items-center gap-3 p-4 mt-4 ${styles.errorBox}`}>
					<ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* Color-coded Token Preview */}
			{tokenParts && decoded && (
				<div className={`mt-6 p-4 ${styles.tokenPreview}`}>
					<span className={styles.tokenHeader}>{tokenParts[0]}</span>
					<span className={styles.tokenDot}>.</span>
					<span className={styles.tokenPayload}>{tokenParts[1]}</span>
					<span className={styles.tokenDot}>.</span>
					<span className={styles.tokenSignature}>{tokenParts[2]}</span>
				</div>
			)}

			{/* Expiration Status */}
			{decoded && isExpired !== null && (
				<div className="mt-4 flex items-center gap-3">
					{isExpired ? (
						<span className={`${styles.expirationBadge} ${styles.expired}`}>
							<span className={`${styles.expirationDot} ${styles.dotExpired}`} />
							{getTimeRemaining(decoded.payload.exp as number)}
						</span>
					) : (
						<span className={`${styles.expirationBadge} ${styles.valid}`}>
							<span className={`${styles.expirationDot} ${styles.dotValid}`} />
							{getTimeRemaining(decoded.payload.exp as number)}
						</span>
					)}
				</div>
			)}

			{/* Decoded Sections */}
			{decoded && (
				<div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
					{/* Header */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<span className={`${styles.sectionBadge} ${styles.badgeHeader}`}>Header</span>
								<h3 className={styles.sectionTitle} style={{ margin: 0 }}>
									JOSE Header
								</h3>
							</div>
							<button
								className={`${styles.copyBtn} ${copiedField === "header" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), "header")}
								title="Copy header JSON"
							>
								{copiedField === "header" ? (
									<CheckIcon className={styles.copyIcon} />
								) : (
									<ClipboardDocumentIcon className={styles.copyIcon} />
								)}
							</button>
						</div>
						<pre className={`p-4 ${styles.codeBlock}`}>
							<code>{JSON.stringify(decoded.header, null, 2)}</code>
						</pre>
					</div>

					{/* Payload */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<span className={`${styles.sectionBadge} ${styles.badgePayload}`}>Payload</span>
								<h3 className={styles.sectionTitle} style={{ margin: 0 }}>
									Claims
								</h3>
							</div>
							<button
								className={`${styles.copyBtn} ${copiedField === "payload" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), "payload")}
								title="Copy payload JSON"
							>
								{copiedField === "payload" ? (
									<CheckIcon className={styles.copyIcon} />
								) : (
									<ClipboardDocumentIcon className={styles.copyIcon} />
								)}
							</button>
						</div>
						<pre className={`p-4 ${styles.codeBlock}`}>
							<code>{JSON.stringify(decoded.payload, null, 2)}</code>
						</pre>
					</div>

					{/* Signature */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<span className={`${styles.sectionBadge} ${styles.badgeSignature}`}>Signature</span>
								<h3 className={styles.sectionTitle} style={{ margin: 0 }}>
									Signature
								</h3>
							</div>
							<button
								className={`${styles.copyBtn} ${copiedField === "signature" ? styles.copied : ""}`}
								onClick={() => copyToClipboard(decoded.signatureHex, "signature")}
								title="Copy signature hex"
							>
								{copiedField === "signature" ? (
									<CheckIcon className={styles.copyIcon} />
								) : (
									<ClipboardDocumentIcon className={styles.copyIcon} />
								)}
							</button>
						</div>
						<div className={`p-4 ${styles.codeBlock}`}>
							<span className={styles.signatureHex}>{decoded.signatureHex}</span>
						</div>
						<p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
							<ShieldCheckIcon className="w-4 h-4 inline-block mr-1 align-text-bottom" />
							Signature verification requires the secret key and is not performed client-side.
						</p>
					</div>

					{/* Standard Claims */}
					{standardClaims.length > 0 && (
						<div className={styles.glassCard}>
							<h3 className={styles.sectionTitle}>Registered Claims</h3>
							<table className={styles.claimsTable}>
								<tbody>
									{standardClaims.map(({ key, label, value, extra }) => (
										<tr key={key} className={styles.claimRow}>
											<td className={`py-2 pr-3 ${styles.claimName}`}>{key}</td>
											<td className={`py-2 pr-3 ${styles.claimLabel}`}>{label}</td>
											<td className={`py-2 ${styles.claimValue}`}>
												{value}
												{extra && (
													<span className="block text-xs" style={{ color: "var(--text-muted)" }}>
														{extra}
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Info Section */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>About JWT Tokens</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>What is a JWT?</h3>
						<p className={styles.infoText}>
							A JSON Web Token (JWT) is a compact, URL-safe way to represent claims between two parties. It consists of three Base64URL-encoded parts: a header, a payload, and a signature, separated by dots.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Security Note</h3>
						<p className={styles.infoText}>
							This decoder runs entirely in your browser. No tokens are sent to any server. However, never paste production tokens with sensitive data into any online tool. JWTs are signed, not encrypted &mdash; anyone can read the payload.
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Registered Claims</h3>
						<p className={styles.infoText}>
							The JWT spec defines standard claims: <code>iss</code> (issuer), <code>sub</code> (subject), <code>aud</code> (audience), <code>exp</code> (expiration), <code>nbf</code> (not before), <code>iat</code> (issued at), and <code>jti</code> (JWT ID).
						</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Common Algorithms</h3>
						<p className={styles.infoText}>
							The <code>alg</code> header field specifies the signing algorithm. Common values include <code>HS256</code> (HMAC), <code>RS256</code> (RSA), and <code>ES256</code> (ECDSA). The algorithm determines how the signature is computed and verified.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
