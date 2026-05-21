"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@heroicons/react/24/outline";
import styles from "./BasicAuthGenerator.module.scss";
import { bytesToBase64 } from "@/lib/cryptoUtils";
import { useClipboard } from "@/hooks/useClipboard";

function encodeBasicAuth(username: string, password: string): string {
	const bytes = new TextEncoder().encode(`${username}:${password}`);
	return bytesToBase64(bytes);
}

export default function BasicAuthGenerator() {
	const [username, setUsername] = useState("admin");
	const [password, setPassword] = useState("hunter2");
	const [exampleUrl, setExampleUrl] = useState("https://example.com");
	const [showPassword, setShowPassword] = useState(false);
	const { copy, isCopied } = useClipboard();

	const { token, header, curl } = useMemo(() => {
		const t = encodeBasicAuth(username, password);
		const h = `Authorization: Basic ${t}`;
		const safeUrl = exampleUrl.trim() || "https://example.com";
		const c = `curl -u ${shellQuote(username)}:${shellQuote(password)} ${shellQuote(safeUrl)}`;
		return { token: t, header: h, curl: c };
	}, [username, password, exampleUrl]);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h3 className={`text-lg font-semibold mb-1 m-0 ${styles.cardTitle}`}>
					Credentials
				</h3>
				<p className={`text-xs mb-4 m-0 ${styles.cardSubtitle}`}>
					Username and password are UTF-8 encoded and joined with <code>:</code>{" "}
					before Base64 encoding.
				</p>

				<div className={styles.fieldGrid}>
					<div className={styles.field}>
						<label htmlFor="ba-username" className={styles.label}>
							Username
						</label>
						<input
							id="ba-username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className={styles.input}
							autoComplete="off"
							spellCheck={false}
						/>
					</div>

					<div className={styles.field}>
						<label htmlFor="ba-password" className={styles.label}>
							Password
						</label>
						<div className={styles.inputWithButton}>
							<input
								id="ba-password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className={styles.input}
								autoComplete="off"
								spellCheck={false}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								className={styles.toggleBtn}
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? (
									<EyeSlashIcon className="w-4 h-4" />
								) : (
									<EyeIcon className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					<div className={`${styles.field} ${styles.fieldFull}`}>
						<label htmlFor="ba-url" className={styles.label}>
							Example URL (for curl)
						</label>
						<input
							id="ba-url"
							type="text"
							value={exampleUrl}
							onChange={(e) => setExampleUrl(e.target.value)}
							className={styles.input}
							placeholder="https://example.com"
							spellCheck={false}
						/>
					</div>
				</div>
			</div>

			<OutputBlock
				title="Authorization Header"
				subtitle="Use as the value of the HTTP Authorization header."
				value={header}
				field="header"
				copy={copy}
				isCopied={isCopied}
				styles={styles}
			/>

			<OutputBlock
				title="Encoded Token"
				subtitle="Base64-encoded username:password (without the Basic prefix)."
				value={token}
				field="token"
				copy={copy}
				isCopied={isCopied}
				styles={styles}
			/>

			<OutputBlock
				title="curl Example"
				subtitle="curl computes the header automatically from -u."
				value={curl}
				field="curl"
				copy={copy}
				isCopied={isCopied}
				styles={styles}
			/>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About HTTP Basic Auth
				</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							How it works
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The username and password are concatenated with a single colon
							(<code>username:password</code>), UTF-8 encoded, and Base64-encoded.
							The result is sent as <code>Authorization: Basic &lt;token&gt;</code>.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							Security note
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Base64 is encoding, not encryption — the credentials are trivially
							recoverable. Only send Basic Auth over HTTPS, and prefer stronger
							schemes (e.g. bearer tokens) where possible.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function OutputBlock({
	title,
	subtitle,
	value,
	field,
	copy,
	isCopied,
	styles,
}: {
	title: string;
	subtitle: string;
	value: string;
	field: string;
	copy: (text: string, field?: string) => Promise<boolean>;
	isCopied: (field?: string) => boolean;
	styles: Record<string, string>;
}) {
	return (
		<div className={`mt-4 ${styles.glassCard}`}>
			<div className="flex justify-between items-start mb-3 flex-wrap gap-4">
				<div>
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>{title}</h3>
					<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>{subtitle}</p>
				</div>
				<button
					type="button"
					onClick={() => copy(value, field)}
					className={`${styles.btnPrimary} ${isCopied(field) ? styles.copied : ""}`}
				>
					{isCopied(field) ? (
						<>
							<CheckIcon className="w-4 h-4" />
							Copied!
						</>
					) : (
						<>
							<ClipboardDocumentIcon className="w-4 h-4" />
							Copy
						</>
					)}
				</button>
			</div>
			<code className={styles.output}>{value}</code>
		</div>
	);
}

function shellQuote(s: string): string {
	if (s === "") return "''";
	if (/^[A-Za-z0-9_\-.:/@%+=,]+$/.test(s)) return s;
	return `'${s.replace(/'/g, `'\\''`)}'`;
}
