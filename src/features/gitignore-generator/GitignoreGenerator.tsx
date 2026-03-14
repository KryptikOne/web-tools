"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowDownTrayIcon,
	ArrowPathIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import styles from "./GitignoreGenerator.module.scss";

// ---------------------------------------------------------------------------
// Template data
// ---------------------------------------------------------------------------

interface Template {
	id: string;
	name: string;
	category: string;
	patterns: string[];
}

const TEMPLATES: Template[] = [
	// ── Languages ──────────────────────────────────────────────────────────
	{
		id: "node",
		name: "Node.js",
		category: "Languages",
		patterns: [
			"node_modules/",
			"npm-debug.log*",
			"yarn-debug.log*",
			"yarn-error.log*",
			".pnpm-debug.log*",
			"dist/",
			"build/",
			".npm",
			".yarn/cache",
			".yarn/unplugged",
			".yarn/install-state.gz",
			"*.tgz",
			".env",
			".env.local",
			".env.*.local",
			"coverage/",
		],
	},
	{
		id: "python",
		name: "Python",
		category: "Languages",
		patterns: [
			"__pycache__/",
			"*.py[cod]",
			"*$py.class",
			"*.so",
			"dist/",
			"build/",
			"*.egg-info/",
			"*.egg",
			".eggs/",
			".venv/",
			"venv/",
			"env/",
			".env",
			"*.whl",
			".pytest_cache/",
			".mypy_cache/",
			".ruff_cache/",
			"htmlcov/",
			".coverage",
			".coverage.*",
			"*.cover",
		],
	},
	{
		id: "java",
		name: "Java",
		category: "Languages",
		patterns: [
			"*.class",
			"*.jar",
			"*.war",
			"*.ear",
			"*.nar",
			"target/",
			"build/",
			".gradle/",
			"gradle/wrapper/gradle-wrapper.jar",
			"*.log",
			"hs_err_pid*",
			".settings/",
			".classpath",
			".project",
			"bin/",
			"out/",
		],
	},
	{
		id: "go",
		name: "Go",
		category: "Languages",
		patterns: [
			"*.exe",
			"*.exe~",
			"*.dll",
			"*.so",
			"*.dylib",
			"*.test",
			"*.out",
			"vendor/",
			"go.work",
		],
	},
	{
		id: "rust",
		name: "Rust",
		category: "Languages",
		patterns: [
			"target/",
			"Cargo.lock",
			"*.pdb",
			"*.d",
		],
	},
	{
		id: "ruby",
		name: "Ruby",
		category: "Languages",
		patterns: [
			"*.gem",
			"*.rbc",
			".bundle/",
			"vendor/bundle",
			"coverage/",
			"log/*.log",
			"tmp/",
			".byebug_history",
			".ruby-version",
			".ruby-gemset",
			"Gemfile.lock",
		],
	},
	{
		id: "php",
		name: "PHP",
		category: "Languages",
		patterns: [
			"vendor/",
			"composer.lock",
			"*.cache",
			".env",
			".phpunit.result.cache",
			"storage/framework/cache/*",
			"storage/framework/sessions/*",
			"storage/framework/views/*",
			"bootstrap/cache/*",
		],
	},
	{
		id: "c-cpp",
		name: "C/C++",
		category: "Languages",
		patterns: [
			"*.o",
			"*.obj",
			"*.so",
			"*.dylib",
			"*.dll",
			"*.exe",
			"*.out",
			"*.a",
			"*.lib",
			"*.d",
			"*.pch",
			"*.gch",
			"build/",
			"cmake-build-*/",
			"CMakeFiles/",
			"CMakeCache.txt",
			"Makefile",
			"*.make",
		],
	},
	{
		id: "swift",
		name: "Swift",
		category: "Languages",
		patterns: [
			".build/",
			"Packages/",
			"xcuserdata/",
			"*.xcodeproj/project.xcworkspace/",
			"*.xcodeproj/xcuserdata/",
			"DerivedData/",
			".swiftpm/",
			"Package.resolved",
			"*.playground/timeline.xctimeline",
		],
	},
	{
		id: "kotlin",
		name: "Kotlin",
		category: "Languages",
		patterns: [
			"*.class",
			"*.jar",
			"*.war",
			"build/",
			".gradle/",
			"gradle/wrapper/gradle-wrapper.jar",
			"out/",
			".kotlin/",
			"local.properties",
		],
	},

	// ── Frameworks ─────────────────────────────────────────────────────────
	{
		id: "react-nextjs",
		name: "React/Next.js",
		category: "Frameworks",
		patterns: [
			"node_modules/",
			".next/",
			"out/",
			"build/",
			".env",
			".env.local",
			".env.development.local",
			".env.test.local",
			".env.production.local",
			"npm-debug.log*",
			"yarn-debug.log*",
			"yarn-error.log*",
			".vercel",
			"*.tsbuildinfo",
			"next-env.d.ts",
		],
	},
	{
		id: "vue",
		name: "Vue",
		category: "Frameworks",
		patterns: [
			"node_modules/",
			"dist/",
			".env.local",
			".env.*.local",
			"npm-debug.log*",
			"yarn-debug.log*",
			"yarn-error.log*",
			"pnpm-debug.log*",
			"*.local",
			".vite/",
		],
	},
	{
		id: "angular",
		name: "Angular",
		category: "Frameworks",
		patterns: [
			"node_modules/",
			"dist/",
			"tmp/",
			"out-tsc/",
			".angular/cache",
			".sass-cache/",
			"connect.lock",
			"coverage/",
			"e2e/",
			"*.js.map",
			"*.css.map",
		],
	},
	{
		id: "django",
		name: "Django",
		category: "Frameworks",
		patterns: [
			"__pycache__/",
			"*.py[cod]",
			"db.sqlite3",
			"db.sqlite3-journal",
			"media/",
			"staticfiles/",
			"*.log",
			".env",
			"*.pot",
			"*.mo",
			"local_settings.py",
			"venv/",
			".venv/",
		],
	},
	{
		id: "rails",
		name: "Rails",
		category: "Frameworks",
		patterns: [
			"log/*.log",
			"tmp/**/*",
			"storage/*",
			"public/assets",
			"public/packs",
			"public/packs-test",
			"node_modules/",
			"yarn-error.log",
			".byebug_history",
			"config/master.key",
			"config/credentials/*.key",
			".bundle/",
			"vendor/bundle",
		],
	},
	{
		id: "spring",
		name: "Spring",
		category: "Frameworks",
		patterns: [
			"target/",
			"build/",
			".gradle/",
			"*.class",
			"*.jar",
			"*.war",
			"*.log",
			"application-local.properties",
			"application-local.yml",
			".settings/",
			".classpath",
			".project",
			"bin/",
			"out/",
			"hs_err_pid*",
		],
	},
	{
		id: "laravel",
		name: "Laravel",
		category: "Frameworks",
		patterns: [
			"vendor/",
			"node_modules/",
			".env",
			".env.backup",
			"Homestead.yaml",
			"Homestead.json",
			"npm-debug.log",
			"yarn-error.log",
			"storage/*.key",
			"public/hot",
			"public/storage",
			"storage/framework/cache/data/*",
			"storage/framework/sessions/*",
			"storage/framework/views/*",
			"bootstrap/cache/*",
			"composer.lock",
		],
	},
	{
		id: "flutter",
		name: "Flutter",
		category: "Frameworks",
		patterns: [
			".dart_tool/",
			".packages",
			".pub-cache/",
			".pub/",
			"build/",
			"*.iml",
			"*.ipr",
			"*.iws",
			".idea/",
			"*.g.dart",
			"*.freezed.dart",
			"pubspec.lock",
			"android/.gradle/",
			"android/local.properties",
			"ios/Pods/",
			"ios/.symlinks/",
		],
	},

	// ── IDEs / Editors ─────────────────────────────────────────────────────
	{
		id: "vscode",
		name: "VS Code",
		category: "IDEs/Editors",
		patterns: [
			".vscode/*",
			"!.vscode/settings.json",
			"!.vscode/tasks.json",
			"!.vscode/launch.json",
			"!.vscode/extensions.json",
			"*.code-workspace",
			".history/",
		],
	},
	{
		id: "jetbrains",
		name: "IntelliJ/JetBrains",
		category: "IDEs/Editors",
		patterns: [
			".idea/",
			"*.iml",
			"*.iws",
			"*.ipr",
			"out/",
			"cmake-build-*/",
			".idea/**/workspace.xml",
			".idea/**/tasks.xml",
			".idea/**/usage.statistics.xml",
			".idea/**/dictionaries",
			".idea/**/shelf",
		],
	},
	{
		id: "vim",
		name: "Vim",
		category: "IDEs/Editors",
		patterns: [
			"[._]*.s[a-v][a-z]",
			"!*.svg",
			"[._]*.sw[a-p]",
			"[._]s[a-rt-v][a-z]",
			"[._]ss[a-gi-z]",
			"[._]sw[a-p]",
			"Session.vim",
			"Sessionx.vim",
			".netrwhist",
			"*~",
			"tags",
			"[._]*.un~",
		],
	},
	{
		id: "sublime",
		name: "Sublime Text",
		category: "IDEs/Editors",
		patterns: [
			"*.tmlanguage.cache",
			"*.tmPreferences.cache",
			"*.stTheme.cache",
			"*.sublime-workspace",
			"*.sublime-project",
			"sftp-config.json",
			"sftp-config-alt*.json",
			"Package Control.last-run",
			"Package Control.ca-list",
			"Package Control.ca-bundle",
			"Package Control.system-ca-bundle",
			"Package Control.cache/",
			"Package Control.ca-certs/",
		],
	},
	{
		id: "eclipse",
		name: "Eclipse",
		category: "IDEs/Editors",
		patterns: [
			".metadata/",
			"bin/",
			"tmp/",
			"*.tmp",
			"*.bak",
			"*.swp",
			"*~.nib",
			"local.properties",
			".settings/",
			".loadpath",
			".recommenders",
			".classpath",
			".project",
			".externalToolBuilders/",
			"*.launch",
		],
	},

	// ── Operating Systems ──────────────────────────────────────────────────
	{
		id: "macos",
		name: "macOS",
		category: "OS",
		patterns: [
			".DS_Store",
			".AppleDouble",
			".LSOverride",
			"Icon\\r",
			"._*",
			".DocumentRevisions-V100",
			".fseventsd",
			".Spotlight-V100",
			".TemporaryItems",
			".Trashes",
			".VolumeIcon.icns",
			".com.apple.timemachine.donotpresent",
			".AppleDB",
			".AppleDesktop",
		],
	},
	{
		id: "windows",
		name: "Windows",
		category: "OS",
		patterns: [
			"Thumbs.db",
			"Thumbs.db:encryptable",
			"ehthumbs.db",
			"ehthumbs_vista.db",
			"*.stackdump",
			"[Dd]esktop.ini",
			"$RECYCLE.BIN/",
			"*.cab",
			"*.msi",
			"*.msix",
			"*.msm",
			"*.msp",
			"*.lnk",
		],
	},
	{
		id: "linux",
		name: "Linux",
		category: "OS",
		patterns: [
			"*~",
			".fuse_hidden*",
			".directory",
			".Trash-*",
			".nfs*",
		],
	},

	// ── Other ──────────────────────────────────────────────────────────────
	{
		id: "docker",
		name: "Docker",
		category: "Other",
		patterns: [
			"docker-compose.override.yml",
			".docker/",
			"*.log",
		],
	},
	{
		id: "terraform",
		name: "Terraform",
		category: "Other",
		patterns: [
			".terraform/",
			".terraform.lock.hcl",
			"*.tfstate",
			"*.tfstate.*",
			"crash.log",
			"crash.*.log",
			"*.tfvars",
			"*.tfvars.json",
			"override.tf",
			"override.tf.json",
			"*_override.tf",
			"*_override.tf.json",
			".terraformrc",
			"terraform.rc",
		],
	},
	{
		id: "unity",
		name: "Unity",
		category: "Other",
		patterns: [
			"[Ll]ibrary/",
			"[Tt]emp/",
			"[Oo]bj/",
			"[Bb]uild/",
			"[Bb]uilds/",
			"[Ll]ogs/",
			"[Uu]ser[Ss]ettings/",
			"MemoryCaptures/",
			"Assets/Plugins/Editor/JetBrains*",
			"*.cginc",
			"*.unitypackage",
			"crashlytics-build.properties",
			"sysinfo.txt",
			"*.pidb.meta",
			"*.pdb.meta",
			"*.mdb.meta",
		],
	},
	{
		id: "unreal",
		name: "Unreal Engine",
		category: "Other",
		patterns: [
			"Binaries/",
			"DerivedDataCache/",
			"Intermediate/",
			"Saved/",
			"Build/",
			"*.VC.db",
			"*.opensdf",
			"*.opendb",
			"*.sdf",
			"*.sln",
			"*.suo",
			"*.xcworkspace",
			"*.xcodeproj",
		],
	},
];

const CATEGORIES = ["Languages", "Frameworks", "IDEs/Editors", "OS", "Other"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GitignoreGenerator() {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [customRules, setCustomRules] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [copied, setCopied] = useState(false);

	// ── Derived state ────────────────────────────────────────────────────

	const filteredTemplates = useMemo(() => {
		if (!searchQuery.trim()) return TEMPLATES;
		const q = searchQuery.toLowerCase();
		return TEMPLATES.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				t.category.toLowerCase().includes(q)
		);
	}, [searchQuery]);

	const generatedOutput = useMemo(() => {
		if (selectedIds.size === 0 && !customRules.trim()) return "";

		const sections: string[] = [];

		// Group selected templates by category for readable output
		for (const category of CATEGORIES) {
			const selected = TEMPLATES.filter(
				(t) => t.category === category && selectedIds.has(t.id)
			);
			if (selected.length === 0) continue;

			for (const template of selected) {
				sections.push(`# ${template.name}`);
				sections.push(template.patterns.join("\n"));
				sections.push("");
			}
		}

		if (customRules.trim()) {
			sections.push("# Custom Rules");
			sections.push(customRules.trim());
			sections.push("");
		}

		return sections.join("\n").trimEnd();
	}, [selectedIds, customRules]);

	// ── Handlers ─────────────────────────────────────────────────────────

	const toggleTemplate = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const handleCopy = useCallback(async () => {
		if (!generatedOutput) return;
		try {
			await navigator.clipboard.writeText(generatedOutput);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Silently fail
		}
	}, [generatedOutput]);

	const handleDownload = useCallback(() => {
		if (!generatedOutput) return;
		const blob = new Blob([generatedOutput], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = ".gitignore";
		a.click();
		URL.revokeObjectURL(url);
	}, [generatedOutput]);

	const handleReset = useCallback(() => {
		setSelectedIds(new Set());
		setCustomRules("");
		setSearchQuery("");
		setCopied(false);
	}, []);

	// ── Render ───────────────────────────────────────────────────────────

	const visibleCategories = useMemo(() => {
		return CATEGORIES.filter((cat) =>
			filteredTemplates.some((t) => t.category === cat)
		);
	}, [filteredTemplates]);

	return (
		<div className={styles.container}>
			{/* Template selection */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Templates</h2>

				{/* Search */}
				<div className={`relative mb-6 ${styles.searchWrapper}`}>
					<MagnifyingGlassIcon className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${styles.searchIcon}`} />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search templates..."
						className={styles.searchInput}
					/>
				</div>

				{/* Categories */}
				{visibleCategories.map((category) => (
					<div key={category} className="mb-5 last:mb-0">
						<h3 className={`mb-3 ${styles.categoryTitle}`}>{category}</h3>
						<div className="flex flex-wrap gap-2">
							{filteredTemplates
								.filter((t) => t.category === category)
								.map((template) => (
									<button
										key={template.id}
										onClick={() => toggleTemplate(template.id)}
										className={`${styles.templateChip} ${
											selectedIds.has(template.id) ? styles.active : ""
										}`}
									>
										{template.name}
									</button>
								))}
						</div>
					</div>
				))}

				{filteredTemplates.length === 0 && (
					<p className={`text-sm ${styles.emptyText}`}>
						No templates match your search.
					</p>
				)}
			</div>

			{/* Custom rules */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Custom Rules</h2>
				<textarea
					value={customRules}
					onChange={(e) => setCustomRules(e.target.value)}
					placeholder={"# Add your own patterns, one per line\n*.log\ntmp/\n.secret"}
					rows={5}
					className={styles.customTextarea}
				/>
			</div>

			{/* Generated output */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4">
					<h2 className={styles.sectionTitle}>Generated .gitignore</h2>
					<div className="flex gap-2">
						<Button
							onClick={handleCopy}
							disabled={!generatedOutput}
							className={styles.actionBtn}
						>
							{copied ? (
								<CheckIcon className="w-4 h-4" />
							) : (
								<ClipboardDocumentIcon className="w-4 h-4" />
							)}
							{copied ? "Copied" : "Copy"}
						</Button>
						<Button
							onClick={handleDownload}
							disabled={!generatedOutput}
							className={styles.actionBtn}
						>
							<ArrowDownTrayIcon className="w-4 h-4" />
							Download
						</Button>
						<Button
							onClick={handleReset}
							className={styles.resetBtn}
						>
							<ArrowPathIcon className="w-4 h-4" />
							Reset
						</Button>
					</div>
				</div>

				{generatedOutput ? (
					<pre className={styles.codeBlock}>
						<code>{generatedOutput}</code>
					</pre>
				) : (
					<div className={styles.placeholder}>
						Select templates or add custom rules to generate a .gitignore file.
					</div>
				)}
			</div>
		</div>
	);
}
