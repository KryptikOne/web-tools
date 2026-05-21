"use client";

import { useState, useMemo } from "react";
import yaml from "js-yaml";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./DockerRunToCompose.module.scss";

/**
 * Tokenize a shell-style command string into argv tokens.
 * Respects single/double quotes and `\` escapes (outside single quotes).
 */
function tokenize(input: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	const len = input.length;

	while (i < len) {
		// skip whitespace between tokens
		while (i < len && /\s/.test(input[i])) i++;
		if (i >= len) break;

		let token = "";
		while (i < len && !/\s/.test(input[i])) {
			const ch = input[i];
			if (ch === "\\" && i + 1 < len) {
				// escape next character
				token += input[i + 1];
				i += 2;
				continue;
			}
			if (ch === '"') {
				i++;
				while (i < len && input[i] !== '"') {
					if (input[i] === "\\" && i + 1 < len) {
						token += input[i + 1];
						i += 2;
					} else {
						token += input[i];
						i++;
					}
				}
				i++; // consume closing "
				continue;
			}
			if (ch === "'") {
				i++;
				while (i < len && input[i] !== "'") {
					token += input[i];
					i++;
				}
				i++; // consume closing '
				continue;
			}
			token += ch;
			i++;
		}
		tokens.push(token);
	}
	return tokens;
}

// Flags that consume a value (either via `=` or the next token)
const VALUE_FLAGS = new Set([
	"-p", "--publish",
	"-v", "--volume",
	"-e", "--env",
	"--env-file",
	"--name",
	"--restart",
	"--network",
	"--label", "-l",
	"--cap-add",
	"-w", "--workdir",
	"--entrypoint",
	"-u", "--user",
	"--hostname", "-h",
	"--dns",
	"--device",
	"--health-cmd",
	"--health-interval",
	"--health-timeout",
	"--health-retries",
	"--health-start-period",
]);

// Boolean flags that take no value
const BOOL_FLAGS = new Set([
	"-d", "--detach",
	"--privileged",
	"-it", "-i", "-t",
	"--rm",
	"--init",
]);

interface ParsedRun {
	flags: Record<string, string[]>;
	booleans: Set<string>;
	image: string | null;
	command: string[];
	unknown: string[];
}

function parseDockerRun(tokens: string[]): ParsedRun {
	const flags: Record<string, string[]> = {};
	const booleans = new Set<string>();
	const unknown: string[] = [];

	// Drop a leading `docker` and/or `run`
	let i = 0;
	if (tokens[i] === "docker") i++;
	if (tokens[i] === "run") i++;

	let image: string | null = null;
	let command: string[] = [];

	while (i < tokens.length) {
		const t = tokens[i];
		if (!t.startsWith("-")) {
			image = t;
			i++;
			command = tokens.slice(i);
			break;
		}

		// flag — may be --flag=value or --flag value
		let name = t;
		let value: string | null = null;
		const eq = t.indexOf("=");
		if (eq !== -1) {
			name = t.slice(0, eq);
			value = t.slice(eq + 1);
		}

		if (BOOL_FLAGS.has(name)) {
			booleans.add(name);
			i++;
			continue;
		}

		if (VALUE_FLAGS.has(name)) {
			if (value === null) {
				value = tokens[i + 1] ?? "";
				i += 2;
			} else {
				i++;
			}
			(flags[name] ||= []).push(value);
			continue;
		}

		// unknown flag — record it and try to skip a value if not =-style
		unknown.push(t);
		if (value === null && i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
			// best effort: consume one token as the value
			i += 2;
		} else {
			i++;
		}
	}

	return { flags, booleans, image, command, unknown };
}

function pickFirst(flags: Record<string, string[]>, ...keys: string[]): string | undefined {
	for (const k of keys) {
		const v = flags[k];
		if (v && v.length) return v[0];
	}
	return undefined;
}

function collectAll(flags: Record<string, string[]>, ...keys: string[]): string[] {
	const out: string[] = [];
	for (const k of keys) if (flags[k]) out.push(...flags[k]);
	return out;
}

function envArrayToObject(entries: string[]): Record<string, string> {
	const env: Record<string, string> = {};
	for (const entry of entries) {
		const eq = entry.indexOf("=");
		if (eq === -1) {
			env[entry] = "";
		} else {
			env[entry.slice(0, eq)] = entry.slice(eq + 1);
		}
	}
	return env;
}

function labelsToObject(entries: string[]): Record<string, string> {
	const labels: Record<string, string> = {};
	for (const entry of entries) {
		const eq = entry.indexOf("=");
		if (eq === -1) labels[entry] = "";
		else labels[entry.slice(0, eq)] = entry.slice(eq + 1);
	}
	return labels;
}

function buildHealthcheck(flags: Record<string, string[]>): Record<string, unknown> | null {
	const cmd = pickFirst(flags, "--health-cmd");
	const interval = pickFirst(flags, "--health-interval");
	const timeout = pickFirst(flags, "--health-timeout");
	const retries = pickFirst(flags, "--health-retries");
	const start = pickFirst(flags, "--health-start-period");
	if (!cmd && !interval && !timeout && !retries && !start) return null;
	const hc: Record<string, unknown> = {};
	if (cmd) hc.test = ["CMD-SHELL", cmd];
	if (interval) hc.interval = interval;
	if (timeout) hc.timeout = timeout;
	if (retries) hc.retries = Number.isFinite(+retries) ? Number(retries) : retries;
	if (start) hc.start_period = start;
	return hc;
}

function convert(input: string): { yaml: string; warnings: string[]; error: string | null } {
	const trimmed = input.trim();
	if (!trimmed) return { yaml: "", warnings: [], error: null };

	let tokens: string[];
	try {
		tokens = tokenize(trimmed);
	} catch (err) {
		return { yaml: "", warnings: [], error: err instanceof Error ? err.message : "Tokenize error" };
	}

	const parsed = parseDockerRun(tokens);
	if (!parsed.image) {
		return { yaml: "", warnings: [], error: "No image found in the docker run command." };
	}

	const service: Record<string, unknown> = {};
	service.image = parsed.image;

	const containerName = pickFirst(parsed.flags, "--name");
	if (containerName) service.container_name = containerName;

	const hostname = pickFirst(parsed.flags, "--hostname", "-h");
	if (hostname) service.hostname = hostname;

	const user = pickFirst(parsed.flags, "-u", "--user");
	if (user) service.user = user;

	const workdir = pickFirst(parsed.flags, "-w", "--workdir");
	if (workdir) service.working_dir = workdir;

	const entrypoint = pickFirst(parsed.flags, "--entrypoint");
	if (entrypoint) service.entrypoint = entrypoint;

	const restart = pickFirst(parsed.flags, "--restart");
	if (restart) service.restart = restart;

	if (parsed.booleans.has("--privileged")) service.privileged = true;
	if (parsed.booleans.has("--init")) service.init = true;

	const ports = collectAll(parsed.flags, "-p", "--publish");
	if (ports.length) service.ports = ports;

	const volumes = collectAll(parsed.flags, "-v", "--volume");
	if (volumes.length) service.volumes = volumes;

	const envEntries = collectAll(parsed.flags, "-e", "--env");
	if (envEntries.length) service.environment = envArrayToObject(envEntries);

	const envFile = collectAll(parsed.flags, "--env-file");
	if (envFile.length) service.env_file = envFile.length === 1 ? envFile[0] : envFile;

	const networks = collectAll(parsed.flags, "--network");
	if (networks.length) service.networks = networks;

	const labels = collectAll(parsed.flags, "--label", "-l");
	if (labels.length) service.labels = labelsToObject(labels);

	const capAdd = collectAll(parsed.flags, "--cap-add");
	if (capAdd.length) service.cap_add = capAdd;

	const dns = collectAll(parsed.flags, "--dns");
	if (dns.length) service.dns = dns;

	const devices = collectAll(parsed.flags, "--device");
	if (devices.length) service.devices = devices;

	const hc = buildHealthcheck(parsed.flags);
	if (hc) service.healthcheck = hc;

	if (parsed.command.length) {
		service.command = parsed.command;
	}

	const serviceKey = containerName || "app";
	const compose: Record<string, unknown> = {
		services: {
			[serviceKey]: service,
		},
	};

	let dumped: string;
	try {
		dumped = yaml.dump(compose, { lineWidth: -1, noRefs: true });
	} catch (err) {
		return { yaml: "", warnings: [], error: err instanceof Error ? err.message : "YAML dump error" };
	}

	const warnings: string[] = [];
	if (parsed.unknown.length) {
		warnings.push(`Unknown / unsupported flag(s) ignored: ${parsed.unknown.join(" ")}`);
	}

	let finalYaml = dumped;
	if (warnings.length) {
		const commentBlock = warnings.map((w) => `# ${w}`).join("\n");
		finalYaml = `${commentBlock}\n${dumped}`;
	}

	return { yaml: finalYaml, warnings, error: null };
}

const EXAMPLE_CMD =
	'docker run -d --name web -p 8080:80 -e NODE_ENV=production -v ./data:/app/data --restart unless-stopped --label app=web nginx:alpine';

export default function DockerRunToCompose() {
	const [input, setInput] = useState("");
	const { copy, isCopied } = useClipboard();

	const result = useMemo(() => convert(input), [input]);

	return (
		<div className={styles.container}>
			<div className={`mb-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						Docker run command
					</h3>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setInput(EXAMPLE_CMD)}
							className={styles.btnSecondary}
						>
							Load example
						</button>
						<button
							type="button"
							onClick={() => setInput("")}
							className={styles.btnSecondary}
							disabled={!input}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				</div>
				<label htmlFor="docker-run-input" className="sr-only">Docker run command</label>
				<textarea
					id="docker-run-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Paste a docker run ... command here"
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{result.error && (
				<div className={`mb-4 px-4 py-3 rounded-lg text-sm ${styles.errorBox}`}>
					{result.error}
				</div>
			)}

			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<div>
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							compose.yml
						</h3>
						<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
							Drop this into a <code>compose.yml</code> next to your project.
						</p>
					</div>
					<button
						type="button"
						onClick={() => copy(result.yaml, "yaml")}
						className={`${styles.btnPrimary} ${isCopied("yaml") ? styles.copied : ""}`}
						disabled={!result.yaml}
					>
						{isCopied("yaml") ? (
							<>
								<CheckIcon className="w-4 h-4" />
								Copied
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="w-4 h-4" />
								Copy
							</>
						)}
					</button>
				</div>
				<label htmlFor="compose-output" className="sr-only">Generated compose.yml</label>
				<textarea
					id="compose-output"
					value={result.yaml}
					readOnly
					placeholder="Generated compose.yml will appear here"
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
				/>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About this converter
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Paste any <code>docker run …</code> command and get an equivalent
					<code>compose.yml</code>. Flags are mapped to their compose
					counterparts: <code>-p</code>/<code>--publish</code> → ports,
					<code>-v</code>/<code>--volume</code> → volumes,
					<code>-e</code>/<code>--env</code> → environment, <code>--name</code> →
					service key + <code>container_name</code>, <code>--restart</code>,
					<code>--network</code>, <code>--label</code>, <code>--cap-add</code>,
					<code>--workdir</code>, <code>--entrypoint</code>, <code>--user</code>,
					<code>--hostname</code>, <code>--dns</code>, <code>--device</code>, and
					<code>--health-*</code> flags. Unknown flags are listed as YAML
					comments so nothing is silently dropped.
				</p>
			</div>
		</div>
	);
}
