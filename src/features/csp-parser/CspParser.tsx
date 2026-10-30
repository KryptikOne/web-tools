"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	ShieldCheckIcon,
	ShieldExclamationIcon,
	ExclamationTriangleIcon,
	InformationCircleIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import styles from "./CspParser.module.scss";

// --- Types ---

interface ParsedDirective {
	name: string;
	values: string[];
	description: string;
	severity: "secure" | "warning" | "risky";
	warnings: string[];
}

interface SecurityAssessment {
	score: number;
	label: string;
	severity: "secure" | "warning" | "risky";
	issues: string[];
	positives: string[];
}

// --- Constants ---

const DIRECTIVE_DESCRIPTIONS: Record<string, string> = {
	"default-src": "Fallback for other fetch directives when they are not explicitly set.",
	"script-src": "Controls which scripts can be executed.",
	"style-src": "Controls which stylesheets can be applied.",
	"img-src": "Controls which images can be loaded.",
	"connect-src": "Controls which URLs can be loaded via scripts (XHR, fetch, WebSocket).",
	"font-src": "Controls which fonts can be loaded.",
	"frame-src": "Controls which URLs can be embedded in frames.",
	"media-src": "Controls which media (audio/video) can be loaded.",
	"object-src": "Controls which plugins (object, embed, applet) can be loaded.",
	"child-src": "Controls which URLs can be loaded in workers and frames.",
	"worker-src": "Controls which URLs can be loaded as workers.",
	"manifest-src": "Controls which manifests can be applied.",
	"form-action": "Restricts URLs that can be used as the target of form submissions.",
	"frame-ancestors": "Controls which parents can embed the page in frames.",
	"base-uri": "Restricts the URLs that can be used in a document's base element.",
	"navigate-to": "Restricts the URLs to which the document can navigate.",
	"report-uri": "Specifies a URL where violation reports are sent (deprecated).",
	"report-to": "Specifies a reporting group for violation reports.",
	"upgrade-insecure-requests": "Instructs browsers to upgrade HTTP requests to HTTPS.",
	"block-all-mixed-content": "Prevents loading of mixed content (HTTP on HTTPS page).",
	"sandbox": "Applies restrictions to the page similar to the iframe sandbox attribute.",
	"plugin-types": "Restricts which MIME types plugins can be loaded with (deprecated).",
	"require-trusted-types-for": "Enforces Trusted Types for DOM XSS injection sinks.",
	"trusted-types": "Controls creation of Trusted Types policies.",
	"require-sri-for": "Requires SRI for scripts or styles (experimental).",
	"script-src-elem": "Controls which scripts can be executed via script elements.",
	"script-src-attr": "Controls which inline event handlers can be executed.",
	"style-src-elem": "Controls which stylesheets can be applied via style/link elements.",
	"style-src-attr": "Controls which inline styles can be applied.",
};

const RISKY_VALUES = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "*", "data:", "blob:"];
const WARNING_VALUES = ["'unsafe-hashes'", "data:", "blob:", "http:"];

const SOURCE_LABELS: Record<string, string> = {
	"'self'": "Same origin only",
	"'unsafe-inline'": "Allows inline scripts/styles",
	"'unsafe-eval'": "Allows eval() and similar",
	"'unsafe-hashes'": "Allows specific inline event handlers",
	"'none'": "Blocks all sources",
	"'strict-dynamic'": "Trust propagated via nonces/hashes",
	"'report-sample'": "Include violation sample in reports",
	"*": "Wildcard - allows any source",
	"data:": "Allows data: URIs",
	"blob:": "Allows blob: URIs",
	"http:": "Allows any HTTP source",
	"https:": "Allows any HTTPS source",
	"'wasm-unsafe-eval'": "Allows WebAssembly compilation",
};

interface CspPreset {
	name: string;
	description: string;
	csp: string;
}

const CSP_PRESETS: CspPreset[] = [
	{
		name: "Strict",
		description: "Highly restrictive policy suitable for security-critical apps",
		csp: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
	},
	{
		name: "Moderate",
		description: "Balanced policy allowing CDN resources and inline styles",
		csp: "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.example.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self'",
	},
	{
		name: "Permissive",
		description: "Relaxed policy - not recommended for production",
		csp: "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline'; img-src *; connect-src *; font-src *",
	},
	{
		name: "Nonce-based",
		description: "Modern approach using nonces for script/style elements",
		csp: "default-src 'self'; script-src 'nonce-abc123' 'strict-dynamic'; style-src 'self' 'nonce-abc123'; img-src 'self' https:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests",
	},
	{
		name: "GitHub Pages",
		description: "Example policy similar to GitHub Pages",
		csp: "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
	},
];

// --- Parsing Logic ---

function getSourceLabel(value: string): string {
	if (SOURCE_LABELS[value]) return SOURCE_LABELS[value];
	if (value.startsWith("'nonce-")) return `Nonce: ${value.slice(7, -1)}`;
	if (value.startsWith("'sha256-") || value.startsWith("'sha384-") || value.startsWith("'sha512-")) {
		const algo = value.slice(1, 7);
		return `${algo.toUpperCase()} hash`;
	}
	if (value.startsWith("https://") || value.startsWith("http://")) return `URL: ${value}`;
	if (value.startsWith("*.")) return `Wildcard subdomain: ${value}`;
	return value;
}

function getValueSeverity(value: string): "secure" | "warning" | "risky" {
	if (value === "'unsafe-inline'" || value === "'unsafe-eval'" || value === "*") return "risky";
	if (WARNING_VALUES.includes(value)) return "warning";
	if (value === "http:") return "warning";
	return "secure";
}

function getDirectiveWarnings(name: string, values: string[]): string[] {
	const warnings: string[] = [];

	if (values.includes("'unsafe-inline'")) {
		if (name.includes("script")) {
			warnings.push("'unsafe-inline' allows execution of inline scripts, defeating much of CSP's XSS protection.");
		} else if (name.includes("style")) {
			warnings.push("'unsafe-inline' for styles is less risky but still reduces protection against CSS injection.");
		}
	}

	if (values.includes("'unsafe-eval'")) {
		warnings.push("'unsafe-eval' allows eval(), Function(), and similar, which are common XSS vectors.");
	}

	if (values.includes("*")) {
		warnings.push("Wildcard (*) allows loading resources from any source, largely negating the directive.");
	}

	if (values.includes("data:") && (name.includes("script") || name === "default-src")) {
		warnings.push("data: URIs in script contexts can be used to inject executable code.");
	}

	if (values.includes("http:")) {
		warnings.push("Allowing http: permits loading resources over unencrypted connections.");
	}

	if (values.includes("blob:") && name.includes("script")) {
		warnings.push("blob: URIs in script-src can be used to bypass CSP restrictions.");
	}

	return warnings;
}

function getDirectiveSeverity(warnings: string[], values: string[]): "secure" | "warning" | "risky" {
	if (values.some((v) => v === "'unsafe-inline'" || v === "'unsafe-eval'" || v === "*")) return "risky";
	if (warnings.length > 0) return "warning";
	return "secure";
}

function parseCsp(raw: string): ParsedDirective[] {
	const cleaned = raw.trim();
	if (!cleaned) return [];

	const directives = cleaned.split(";").map((d) => d.trim()).filter(Boolean);

	return directives.map((directive) => {
		const parts = directive.split(/\s+/);
		const name = parts[0]?.toLowerCase() ?? "";
		const values = parts.slice(1);

		const description = DIRECTIVE_DESCRIPTIONS[name] ?? "Custom or unknown directive.";
		const warnings = getDirectiveWarnings(name, values);
		const severity = getDirectiveSeverity(warnings, values);

		return { name, values, description, severity, warnings };
	});
}

function assessSecurity(directives: ParsedDirective[]): SecurityAssessment {
	if (directives.length === 0) {
		return { score: 0, label: "No Policy", severity: "risky", issues: ["No CSP directives found."], positives: [] };
	}

	const issues: string[] = [];
	const positives: string[] = [];
	let score = 100;

	const directiveNames = directives.map((d) => d.name);

	// Check for default-src
	if (!directiveNames.includes("default-src")) {
		issues.push("Missing default-src: no fallback for undefined directives.");
		score -= 15;
	}

	// Check for frame-ancestors
	if (!directiveNames.includes("frame-ancestors")) {
		issues.push("Missing frame-ancestors: page may be vulnerable to clickjacking.");
		score -= 10;
	} else {
		const fa = directives.find((d) => d.name === "frame-ancestors");
		if (fa?.values.includes("'none'") || fa?.values.includes("'self'")) {
			positives.push("frame-ancestors restricts framing (clickjacking protection).");
		}
	}

	// Check for base-uri
	if (!directiveNames.includes("base-uri")) {
		issues.push("Missing base-uri: page may be vulnerable to base tag injection.");
		score -= 5;
	} else {
		positives.push("base-uri is defined, protecting against base tag injection.");
	}

	// Check for form-action
	if (!directiveNames.includes("form-action")) {
		issues.push("Missing form-action: forms can submit to any URL.");
		score -= 5;
	} else {
		positives.push("form-action restricts form submission targets.");
	}

	// Check upgrade-insecure-requests
	if (directiveNames.includes("upgrade-insecure-requests")) {
		positives.push("upgrade-insecure-requests ensures HTTPS for all requests.");
	}

	// Check object-src
	if (!directiveNames.includes("object-src")) {
		const defaultSrc = directives.find((d) => d.name === "default-src");
		if (!defaultSrc || (!defaultSrc.values.includes("'none'") && !defaultSrc.values.includes("'self'"))) {
			issues.push("Missing object-src without restrictive default-src: plugins may load from any source.");
			score -= 10;
		}
	} else {
		const objSrc = directives.find((d) => d.name === "object-src");
		if (objSrc?.values.includes("'none'")) {
			positives.push("object-src 'none' blocks plugin content (Flash, Java, etc.).");
		}
	}

	// Penalize risky values
	for (const directive of directives) {
		if (directive.severity === "risky") {
			score -= 15;
		} else if (directive.severity === "warning") {
			score -= 5;
		}
		issues.push(...directive.warnings);
	}

	score = Math.max(0, Math.min(100, score));

	let label: string;
	let severity: "secure" | "warning" | "risky";
	if (score >= 80) {
		label = "Strong";
		severity = "secure";
	} else if (score >= 50) {
		label = "Moderate";
		severity = "warning";
	} else {
		label = "Weak";
		severity = "risky";
	}

	// Deduplicate issues
	const uniqueIssues = [...new Set(issues)];

	return { score, label, severity, issues: uniqueIssues, positives };
}

// --- Component ---

export default function CspParser() {
	const [rawCsp, setRawCsp] = useState("");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const directives = useMemo(() => parseCsp(rawCsp), [rawCsp]);
	const assessment = useMemo(() => assessSecurity(directives), [directives]);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch {
			// Silently fail
		}
	}, []);

	const handleClear = useCallback(() => {
		setRawCsp("");
	}, []);

	const loadPreset = useCallback((csp: string) => {
		setRawCsp(csp);
	}, []);

	const reconstructedCsp = useMemo(() => {
		return directives.map((d) => [d.name, ...d.values].join(" ")).join("; ");
	}, [directives]);

	const severityIcon = (severity: "secure" | "warning" | "risky") => {
		switch (severity) {
			case "secure":
				return <ShieldCheckIcon className="w-5 h-5" />;
			case "warning":
				return <ExclamationTriangleIcon className="w-5 h-5" />;
			case "risky":
				return <ShieldExclamationIcon className="w-5 h-5" />;
		}
	};

	return (
		<div className={`flex flex-col gap-6 ${styles.container}`}>
			{/* Input Section */}
			<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
				<div className="flex items-center justify-between">
					<h2 className={styles.sectionTitle}>CSP Header Input</h2>
					<div className="flex gap-2">
						<button
							className={`${styles.btnPrimary} ${copiedField === "csp" ? styles.copied : ""}`}
							onClick={() => handleCopy(reconstructedCsp, "csp")}
							disabled={!rawCsp.trim()}
						>
							{copiedField === "csp" ? (
								<CheckIcon className="w-4 h-4" />
							) : (
								<ClipboardDocumentIcon className="w-4 h-4" />
							)}
							{copiedField === "csp" ? "Copied" : "Copy CSP"}
						</button>
						<button
							className={styles.btnSecondary}
							onClick={handleClear}
							disabled={!rawCsp}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				</div>
				<textarea
					className={styles.textarea}
					value={rawCsp}
					onChange={(e) => setRawCsp(e.target.value)}
					placeholder="Paste your Content-Security-Policy header here, e.g.: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'"
					spellCheck={false}
				/>
				<div className="flex items-center gap-2">
					<InformationCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
					<span className={styles.helperText}>
						Paste a full CSP header string. Directives are separated by semicolons.
					</span>
				</div>
			</div>

			{/* Preset Examples */}
			<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>Example Presets</h2>
				<div className="flex flex-wrap gap-3">
					{CSP_PRESETS.map((preset) => (
						<button
							key={preset.name}
							className={styles.presetBtn}
							onClick={() => loadPreset(preset.csp)}
							title={preset.description}
						>
							<DocumentTextIcon className="w-4 h-4" />
							{preset.name}
						</button>
					))}
				</div>
			</div>

			{/* Security Assessment */}
			{directives.length > 0 && (
				<div className={`flex flex-col gap-4 ${styles.glassCard}`}>
					<h2 className={styles.sectionTitle}>Security Assessment</h2>

					<div className={`flex items-center gap-4 p-4 ${styles.assessmentBanner} ${styles[assessment.severity]}`}>
						<div className={styles.scoreCircle}>
							<span className={styles.scoreValue}>{assessment.score}</span>
							<span className={styles.scoreLabel}>/100</span>
						</div>
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								{severityIcon(assessment.severity)}
								<span className="text-lg font-semibold">{assessment.label} Policy</span>
							</div>
							<span className={styles.assessmentSubtext}>
								{directives.length} directive{directives.length !== 1 ? "s" : ""} parsed
							</span>
						</div>
					</div>

					{/* Positives */}
					{assessment.positives.length > 0 && (
						<div className="flex flex-col gap-2">
							<h3 className={styles.subHeading}>Strengths</h3>
							<ul className={`flex flex-col gap-1 ${styles.assessmentList}`}>
								{assessment.positives.map((p, i) => (
									<li key={i} className={styles.positiveItem}>
										<ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
										<span>{p}</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Issues */}
					{assessment.issues.length > 0 && (
						<div className="flex flex-col gap-2">
							<h3 className={styles.subHeading}>Issues</h3>
							<ul className={`flex flex-col gap-1 ${styles.assessmentList}`}>
								{assessment.issues.map((issue, i) => (
									<li key={i} className={styles.issueItem}>
										<ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
										<span>{issue}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* Parsed Directives */}
			{directives.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className={styles.sectionTitle}>Parsed Directives</h2>
					<div className="flex flex-col gap-4">
						{directives.map((directive) => (
							<div key={directive.name} className={`flex flex-col gap-3 ${styles.directiveCard} ${styles[directive.severity]}`}>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className={`${styles.severityDot} ${styles[directive.severity]}`} />
										<h3 className={styles.directiveName}>{directive.name}</h3>
									</div>
									<span className={`${styles.severityBadge} ${styles[directive.severity]}`}>
										{directive.severity}
									</span>
								</div>

								<p className={styles.directiveDescription}>{directive.description}</p>

								{/* Values */}
								{directive.values.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{directive.values.map((value, i) => {
											const valueSeverity = getValueSeverity(value);
											return (
												<div key={i} className={`${styles.sourceTag} ${styles[valueSeverity]}`}>
													<code className={styles.sourceValue}>{value}</code>
													<span className={styles.sourceLabel}>{getSourceLabel(value)}</span>
												</div>
											);
										})}
									</div>
								)}

								{directive.values.length === 0 && (
									<span className={styles.noValues}>No values (boolean directive)</span>
								)}

								{/* Warnings */}
								{directive.warnings.length > 0 && (
									<div className={`flex flex-col gap-2 p-3 ${styles.warningBox}`}>
										{directive.warnings.map((w, i) => (
											<div key={i} className="flex items-start gap-2">
												<ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
												<span className={styles.warningText}>{w}</span>
											</div>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Empty State */}
			{rawCsp.trim() === "" && (
				<div className={`flex flex-col items-center justify-center gap-3 py-12 ${styles.emptyState}`}>
					<ShieldCheckIcon className="w-12 h-12" style={{ color: "var(--text-muted)" }} />
					<p className={styles.emptyText}>Paste a CSP header above or load a preset to get started.</p>
				</div>
			)}
		</div>
	);
}
