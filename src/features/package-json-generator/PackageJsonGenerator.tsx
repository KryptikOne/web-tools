"use client";

import { useState, useCallback, useMemo, KeyboardEvent } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
	ArrowDownTrayIcon,
	XMarkIcon,
	PlusIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import styles from "./PackageJsonGenerator.module.scss";

// --- Types ---

interface ScriptEntry {
	key: string;
	value: string;
}

interface PackageJsonState {
	name: string;
	version: string;
	description: string;
	author: string;
	license: string;
	private: boolean;
	type: "module" | "commonjs" | "";
	main: string;
	module: string;
	types: string;
	exports: string;
	repositoryType: string;
	repositoryUrl: string;
	keywords: string[];
	scripts: ScriptEntry[];
	engineNode: string;
	engineNpm: string;
	enginePnpm: string;
}

interface Preset {
	name: string;
	description: string;
	state: Partial<PackageJsonState>;
}

// --- Constants ---

const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "ISC", "BSD-2-Clause", "Unlicense"];

const DEFAULT_STATE: PackageJsonState = {
	name: "",
	version: "1.0.0",
	description: "",
	author: "",
	license: "MIT",
	private: false,
	type: "",
	main: "",
	module: "",
	types: "",
	exports: "",
	repositoryType: "git",
	repositoryUrl: "",
	keywords: [],
	scripts: [
		{ key: "dev", value: "" },
		{ key: "build", value: "" },
		{ key: "test", value: "" },
		{ key: "lint", value: "" },
		{ key: "start", value: "" },
	],
	engineNode: "",
	engineNpm: "",
	enginePnpm: "",
};

const PRESETS: Preset[] = [
	{
		name: "Node.js Library",
		description: "CommonJS library with standard scripts",
		state: {
			type: "commonjs",
			main: "dist/index.js",
			types: "dist/index.d.ts",
			license: "MIT",
			scripts: [
				{ key: "build", value: "tsc" },
				{ key: "test", value: "jest" },
				{ key: "lint", value: "eslint ." },
				{ key: "prepublishOnly", value: "npm run build" },
			],
			engineNode: ">=18",
		},
	},
	{
		name: "React App",
		description: "Vite + React project setup",
		state: {
			type: "module",
			private: true,
			scripts: [
				{ key: "dev", value: "vite" },
				{ key: "build", value: "vite build" },
				{ key: "preview", value: "vite preview" },
				{ key: "lint", value: "eslint ." },
				{ key: "test", value: "vitest" },
			],
			engineNode: ">=18",
		},
	},
	{
		name: "Next.js App",
		description: "Next.js with TypeScript",
		state: {
			type: "module",
			private: true,
			scripts: [
				{ key: "dev", value: "next dev" },
				{ key: "build", value: "next build" },
				{ key: "start", value: "next start" },
				{ key: "lint", value: "next lint" },
				{ key: "test", value: "jest" },
			],
			engineNode: ">=18.17",
		},
	},
	{
		name: "CLI Tool",
		description: "Command-line application with bin entry",
		state: {
			type: "module",
			main: "dist/index.js",
			license: "MIT",
			scripts: [
				{ key: "build", value: "tsc" },
				{ key: "start", value: "node dist/index.js" },
				{ key: "dev", value: "tsx src/index.ts" },
				{ key: "test", value: "vitest" },
				{ key: "lint", value: "eslint ." },
			],
			engineNode: ">=18",
		},
	},
	{
		name: "TypeScript Library",
		description: "ESM library with dual CJS/ESM exports",
		state: {
			type: "module",
			main: "dist/index.cjs",
			module: "dist/index.js",
			types: "dist/index.d.ts",
			exports: '{ ".": { "import": "./dist/index.js", "require": "./dist/index.cjs", "types": "./dist/index.d.ts" } }',
			license: "MIT",
			scripts: [
				{ key: "build", value: "tsup src/index.ts --format cjs,esm --dts" },
				{ key: "dev", value: "tsup src/index.ts --format cjs,esm --dts --watch" },
				{ key: "test", value: "vitest" },
				{ key: "lint", value: "eslint ." },
				{ key: "prepublishOnly", value: "npm run build" },
			],
			engineNode: ">=18",
		},
	},
];

// --- Component ---

export default function PackageJsonGenerator() {
	const [state, setState] = useState<PackageJsonState>({ ...DEFAULT_STATE });
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [keywordInput, setKeywordInput] = useState("");

	// --- State updaters ---

	const updateField = <K extends keyof PackageJsonState>(key: K, value: PackageJsonState[K]) => {
		setState((prev) => ({ ...prev, [key]: value }));
	};

	const updateScript = (index: number, field: "key" | "value", value: string) => {
		setState((prev) => {
			const scripts = [...prev.scripts];
			scripts[index] = { ...scripts[index], [field]: value };
			return { ...prev, scripts };
		});
	};

	const addScript = () => {
		setState((prev) => ({
			...prev,
			scripts: [...prev.scripts, { key: "", value: "" }],
		}));
	};

	const removeScript = (index: number) => {
		setState((prev) => ({
			...prev,
			scripts: prev.scripts.filter((_, i) => i !== index),
		}));
	};

	const addKeyword = (keyword: string) => {
		const trimmed = keyword.trim().toLowerCase();
		if (trimmed && !state.keywords.includes(trimmed)) {
			updateField("keywords", [...state.keywords, trimmed]);
		}
		setKeywordInput("");
	};

	const removeKeyword = (keyword: string) => {
		updateField(
			"keywords",
			state.keywords.filter((k) => k !== keyword)
		);
	};

	const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addKeyword(keywordInput);
		}
	};

	const applyPreset = (preset: Preset) => {
		setState({ ...DEFAULT_STATE, ...preset.state });
		setKeywordInput("");
	};

	const resetAll = () => {
		setState({ ...DEFAULT_STATE });
		setKeywordInput("");
	};

	// --- JSON generation ---

	const generatedJson = useMemo(() => {
		const pkg: Record<string, unknown> = {};

		if (state.name) pkg.name = state.name;
		if (state.version) pkg.version = state.version;
		if (state.description) pkg.description = state.description;
		if (state.author) pkg.author = state.author;
		if (state.license) pkg.license = state.license;
		if (state.private) pkg.private = true;
		if (state.type) pkg.type = state.type;
		if (state.main) pkg.main = state.main;
		if (state.module) pkg.module = state.module;
		if (state.types) pkg.types = state.types;

		if (state.exports) {
			try {
				pkg.exports = JSON.parse(state.exports);
			} catch {
				pkg.exports = state.exports;
			}
		}

		if (state.repositoryUrl) {
			pkg.repository = {
				type: state.repositoryType || "git",
				url: state.repositoryUrl,
			};
		}

		if (state.keywords.length > 0) {
			pkg.keywords = state.keywords;
		}

		const scripts: Record<string, string> = {};
		for (const s of state.scripts) {
			if (s.key && s.value) {
				scripts[s.key] = s.value;
			}
		}
		if (Object.keys(scripts).length > 0) {
			pkg.scripts = scripts;
		}

		const engines: Record<string, string> = {};
		if (state.engineNode) engines.node = state.engineNode;
		if (state.engineNpm) engines.npm = state.engineNpm;
		if (state.enginePnpm) engines.pnpm = state.enginePnpm;
		if (Object.keys(engines).length > 0) {
			pkg.engines = engines;
		}

		return JSON.stringify(pkg, null, 2);
	}, [state]);

	// --- Validation ---

	const validationErrors = useMemo(() => {
		const errors: string[] = [];

		if (state.name) {
			if (/[A-Z]/.test(state.name)) {
				errors.push("Package name must not contain uppercase letters.");
			}
			if (/\s/.test(state.name)) {
				errors.push("Package name must not contain spaces.");
			}
			if (state.name.startsWith(".") || state.name.startsWith("_")) {
				errors.push("Package name must not start with . or _");
			}
			if (state.name.length > 214) {
				errors.push("Package name must be 214 characters or fewer.");
			}
		}

		if (state.version && !/^\d+\.\d+\.\d+/.test(state.version)) {
			errors.push("Version should follow semver (e.g., 1.0.0).");
		}

		if (state.exports) {
			try {
				JSON.parse(state.exports);
			} catch {
				errors.push("Exports field contains invalid JSON.");
			}
		}

		// Check for duplicate script keys
		const scriptKeys = state.scripts.filter((s) => s.key).map((s) => s.key);
		const dupes = scriptKeys.filter((k, i) => scriptKeys.indexOf(k) !== i);
		if (dupes.length > 0) {
			errors.push(`Duplicate script keys: ${[...new Set(dupes)].join(", ")}`);
		}

		return errors;
	}, [state]);

	// --- Actions ---

	const copyToClipboard = useCallback(async (value: string, field: string) => {
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const downloadFile = useCallback(() => {
		const blob = new Blob([generatedJson], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "package.json";
		a.click();
		URL.revokeObjectURL(url);
	}, [generatedJson]);

	// --- Render ---

	return (
		<div className={styles.container}>
			{/* Presets */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Project Presets</h2>
				<div className={styles.presetsGrid}>
					{PRESETS.map((preset) => (
						<button key={preset.name} className={styles.presetBtn} onClick={() => applyPreset(preset)}>
							<span className={`text-sm font-semibold ${styles.presetName}`}>{preset.name}</span>
							<span className={`text-xs ${styles.presetDescription}`}>{preset.description}</span>
						</button>
					))}
				</div>
			</div>

			<div className={`mt-6 ${styles.mainGrid}`}>
				{/* Form Section */}
				<div className="flex flex-col gap-6">
					{/* Basic Fields */}
					<div className={styles.glassCard}>
						<h2 className={`mb-4 ${styles.sectionTitle}`}>Basic Information</h2>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className={styles.inputGroup}>
									<label className={styles.inputLabel}>Name</label>
									<input
										type="text"
										value={state.name}
										onChange={(e) => updateField("name", e.target.value)}
										placeholder="my-package"
										className={styles.inputField}
									/>
								</div>
								<div className={styles.inputGroup}>
									<label className={styles.inputLabel}>Version</label>
									<input
										type="text"
										value={state.version}
										onChange={(e) => updateField("version", e.target.value)}
										placeholder="1.0.0"
										className={styles.inputField}
									/>
								</div>
							</div>

							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>Description</label>
								<input
									type="text"
									value={state.description}
									onChange={(e) => updateField("description", e.target.value)}
									placeholder="A short description of your package"
									className={styles.inputField}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className={styles.inputGroup}>
									<label className={styles.inputLabel}>Author</label>
									<input
										type="text"
										value={state.author}
										onChange={(e) => updateField("author", e.target.value)}
										placeholder="Your Name <email@example.com>"
										className={styles.inputField}
									/>
								</div>
								<div className={styles.inputGroup}>
									<label className={styles.inputLabel}>License</label>
									<select value={state.license} onChange={(e) => updateField("license", e.target.value)} className={styles.inputField}>
										<option value="">None</option>
										{LICENSES.map((l) => (
											<option key={l} value={l}>
												{l}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className={styles.inputGroup}>
									<label className={styles.inputLabel}>Type</label>
									<select value={state.type} onChange={(e) => updateField("type", e.target.value as PackageJsonState["type"])} className={styles.inputField}>
										<option value="">Not specified</option>
										<option value="module">module (ESM)</option>
										<option value="commonjs">commonjs (CJS)</option>
									</select>
								</div>
								<div className={`flex items-end ${styles.inputGroup}`}>
									<label className={`flex items-center gap-2 cursor-pointer ${styles.toggleLabel}`}>
										<input type="checkbox" checked={state.private} onChange={(e) => updateField("private", e.target.checked)} className={styles.checkbox} />
										<span className={`text-sm font-medium ${styles.toggleText}`}>Private package</span>
									</label>
								</div>
							</div>
						</div>
					</div>

					{/* Entry Points */}
					<div className={styles.glassCard}>
						<h2 className={`mb-4 ${styles.sectionTitle}`}>Entry Points</h2>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className={styles.inputGroup}>
									<label className={styles.inputLabel}>main</label>
									<input
										type="text"
										value={state.main}
										onChange={(e) => updateField("main", e.target.value)}
										placeholder="dist/index.js"
										className={styles.inputField}
									/>
								</div>
								<div className={styles.inputGroup}>
									<label className={styles.inputLabel}>module</label>
									<input
										type="text"
										value={state.module}
										onChange={(e) => updateField("module", e.target.value)}
										placeholder="dist/index.mjs"
										className={styles.inputField}
									/>
								</div>
							</div>
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>types</label>
								<input
									type="text"
									value={state.types}
									onChange={(e) => updateField("types", e.target.value)}
									placeholder="dist/index.d.ts"
									className={styles.inputField}
								/>
							</div>
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>exports</label>
								<textarea
									value={state.exports}
									onChange={(e) => updateField("exports", e.target.value)}
									placeholder='{ ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" } }'
									rows={3}
									className={`${styles.inputField} ${styles.textarea}`}
								/>
							</div>
						</div>
					</div>

					{/* Repository */}
					<div className={styles.glassCard}>
						<h2 className={`mb-4 ${styles.sectionTitle}`}>Repository</h2>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>Type</label>
								<select value={state.repositoryType} onChange={(e) => updateField("repositoryType", e.target.value)} className={styles.inputField}>
									<option value="git">git</option>
									<option value="svn">svn</option>
									<option value="mercurial">mercurial</option>
								</select>
							</div>
							<div className={`md:col-span-3 ${styles.inputGroup}`}>
								<label className={styles.inputLabel}>URL</label>
								<input
									type="text"
									value={state.repositoryUrl}
									onChange={(e) => updateField("repositoryUrl", e.target.value)}
									placeholder="https://github.com/user/repo.git"
									className={styles.inputField}
								/>
							</div>
						</div>
					</div>

					{/* Scripts */}
					<div className={styles.glassCard}>
						<div className="flex items-center justify-between mb-4">
							<h2 className={styles.sectionTitle}>Scripts</h2>
							<button className={styles.addBtn} onClick={addScript}>
								<PlusIcon className="w-4 h-4" />
								Add Script
							</button>
						</div>
						<div className="flex flex-col gap-3">
							{state.scripts.map((script, index) => (
								<div key={index} className="flex gap-3 items-start">
									<div className="w-40 shrink-0">
										<input
											type="text"
											value={script.key}
											onChange={(e) => updateScript(index, "key", e.target.value)}
											placeholder="script name"
											className={styles.inputField}
										/>
									</div>
									<div className="flex-1">
										<input
											type="text"
											value={script.value}
											onChange={(e) => updateScript(index, "value", e.target.value)}
											placeholder="command"
											className={styles.inputField}
										/>
									</div>
									<button className={styles.deleteBtn} onClick={() => removeScript(index)} title="Remove script">
										<XMarkIcon className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Keywords */}
					<div className={styles.glassCard}>
						<h2 className={`mb-4 ${styles.sectionTitle}`}>Keywords</h2>
						<div className="flex flex-wrap gap-2 mb-3">
							{state.keywords.map((keyword) => (
								<span key={keyword} className={styles.keywordTag}>
									{keyword}
									<button className={styles.keywordRemove} onClick={() => removeKeyword(keyword)} title="Remove keyword">
										<XMarkIcon className="w-3 h-3" />
									</button>
								</span>
							))}
						</div>
						<input
							type="text"
							value={keywordInput}
							onChange={(e) => setKeywordInput(e.target.value)}
							onKeyDown={handleKeywordKeyDown}
							placeholder="Type a keyword and press Enter"
							className={styles.inputField}
						/>
					</div>

					{/* Engines */}
					<div className={styles.glassCard}>
						<h2 className={`mb-4 ${styles.sectionTitle}`}>Engines</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>Node</label>
								<input
									type="text"
									value={state.engineNode}
									onChange={(e) => updateField("engineNode", e.target.value)}
									placeholder=">=18"
									className={styles.inputField}
								/>
							</div>
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>npm</label>
								<input
									type="text"
									value={state.engineNpm}
									onChange={(e) => updateField("engineNpm", e.target.value)}
									placeholder=">=9"
									className={styles.inputField}
								/>
							</div>
							<div className={styles.inputGroup}>
								<label className={styles.inputLabel}>pnpm</label>
								<input
									type="text"
									value={state.enginePnpm}
									onChange={(e) => updateField("enginePnpm", e.target.value)}
									placeholder=">=8"
									className={styles.inputField}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Output Section */}
				<div className="flex flex-col gap-6">
					<div className={`${styles.glassCard} ${styles.outputCard}`}>
						<div className="flex items-center justify-between mb-4">
							<h2 className={styles.sectionTitle}>Generated package.json</h2>
							<div className="flex gap-2">
								<button className={styles.actionBtn} onClick={resetAll} title="Reset all fields">
									<ArrowPathIcon className="w-4 h-4" />
									Reset
								</button>
								<button className={styles.actionBtn} onClick={() => copyToClipboard(generatedJson, "json")} title="Copy to clipboard">
									{copiedField === "json" ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
									{copiedField === "json" ? "Copied" : "Copy"}
								</button>
								<button className={styles.actionBtn} onClick={downloadFile} title="Download as package.json">
									<ArrowDownTrayIcon className="w-4 h-4" />
									Download
								</button>
							</div>
						</div>

						{validationErrors.length > 0 && (
							<div className={styles.validationErrors}>
								{validationErrors.map((error, i) => (
									<div key={i} className={styles.validationError}>
										<ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
										<span>{error}</span>
									</div>
								))}
							</div>
						)}

						<div className={styles.codeOutput}>
							<pre className={styles.codeBlock}>
								<code>{generatedJson}</code>
							</pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
