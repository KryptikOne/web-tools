"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	ClipboardDocumentCheckIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./GitCheatsheet.module.scss";
import { GIT_CATEGORIES, GitCommand } from "./data";

const ALL = "All";

export default function GitCheatsheet() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>(ALL);
	const { copy, isCopied } = useClipboard();

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return GIT_CATEGORIES.map((cat) => ({
			...cat,
			commands: cat.commands.filter((c) => {
				if (activeCategory !== ALL && cat.name !== activeCategory) return false;
				if (!q) return true;
				return (
					c.command.toLowerCase().includes(q) ||
					c.description.toLowerCase().includes(q) ||
					c.example.toLowerCase().includes(q)
				);
			}),
		})).filter((cat) => cat.commands.length > 0);
	}, [query, activeCategory]);

	const totalShown = filtered.reduce((n, cat) => n + cat.commands.length, 0);
	const totalAll = GIT_CATEGORIES.reduce((n, cat) => n + cat.commands.length, 0);

	return (
		<div className={styles.container}>
			<div className={`p-4 mb-4 ${styles.controlBar}`}>
				<div className={`flex items-center gap-2 ${styles.searchWrap}`}>
					<MagnifyingGlassIcon className={`w-5 h-5 ${styles.searchIcon}`} />
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search commands, descriptions, or examples..."
						className={styles.searchInput}
						aria-label="Search Git commands"
					/>
					{query && (
						<button
							onClick={() => setQuery("")}
							className={styles.clearBtn}
							aria-label="Clear search"
						>
							<XMarkIcon className="w-4 h-4" />
						</button>
					)}
				</div>

				<div className="flex flex-wrap gap-2 mt-3">
					<button
						onClick={() => setActiveCategory(ALL)}
						className={`${styles.chip} ${activeCategory === ALL ? styles.chipActive : ""}`}
					>
						All
					</button>
					{GIT_CATEGORIES.map((cat) => (
						<button
							key={cat.name}
							onClick={() => setActiveCategory(cat.name)}
							className={`${styles.chip} ${activeCategory === cat.name ? styles.chipActive : ""}`}
						>
							{cat.name}
						</button>
					))}
				</div>

				<p className={`mt-3 text-xs ${styles.countText}`}>
					Showing <strong>{totalShown}</strong> of {totalAll} commands.
				</p>
			</div>

			{filtered.length === 0 ? (
				<div className={`${styles.glassCard} ${styles.emptyState}`}>
					No commands match your search.
				</div>
			) : (
				filtered.map((cat) => (
					<section key={cat.name} className={`mb-6 ${styles.glassCard}`}>
						<h2 className={`text-lg font-semibold mb-4 ${styles.categoryTitle}`}>{cat.name}</h2>
						<div className={styles.cardGrid}>
							{cat.commands.map((cmd, i) => (
								<CommandCard
									key={`${cat.name}-${i}`}
									cmd={cmd}
									fieldId={`${cat.name}-${i}`}
									copy={copy}
									isCopied={isCopied}
								/>
							))}
						</div>
					</section>
				))
			)}
		</div>
	);
}

interface CommandCardProps {
	cmd: GitCommand;
	fieldId: string;
	copy: (text: string, field?: string) => Promise<boolean>;
	isCopied: (field?: string) => boolean;
}

function CommandCard({ cmd, fieldId, copy, isCopied }: CommandCardProps) {
	const copied = isCopied(fieldId);
	return (
		<button
			type="button"
			onClick={() => copy(cmd.command, fieldId)}
			className={`${styles.commandCard} ${copied ? styles.commandCardCopied : ""}`}
			title="Click to copy command"
		>
			<div className={styles.commandHeader}>
				<code className={styles.commandText}>{cmd.command}</code>
				<span className={styles.copyHint} aria-hidden>
					{copied ? (
						<ClipboardDocumentCheckIcon className="w-4 h-4" />
					) : (
						<ClipboardDocumentIcon className="w-4 h-4" />
					)}
				</span>
			</div>
			<p className={styles.commandDesc}>{cmd.description}</p>
			<code className={styles.exampleText}>{cmd.example}</code>
		</button>
	);
}
