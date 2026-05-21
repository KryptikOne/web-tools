"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	ClipboardDocumentCheckIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./RegexCheatsheet.module.scss";
import { REGEX_CATEGORIES, RegexToken } from "./data";

const ALL = "All";

export default function RegexCheatsheet() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>(ALL);
	const { copy, isCopied } = useClipboard();

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return REGEX_CATEGORIES.map((cat) => ({
			...cat,
			tokens: cat.tokens.filter((t) => {
				if (activeCategory !== ALL && cat.name !== activeCategory) return false;
				if (!q) return true;
				return (
					t.token.toLowerCase().includes(q) ||
					t.description.toLowerCase().includes(q) ||
					t.example.toLowerCase().includes(q)
				);
			}),
		})).filter((cat) => cat.tokens.length > 0);
	}, [query, activeCategory]);

	const totalShown = filtered.reduce((n, cat) => n + cat.tokens.length, 0);
	const totalAll = REGEX_CATEGORIES.reduce((n, cat) => n + cat.tokens.length, 0);

	return (
		<div className={styles.container}>
			<div className={`p-4 mb-4 ${styles.controlBar}`}>
				<div className={`flex items-center gap-2 ${styles.searchWrap}`}>
					<MagnifyingGlassIcon className={`w-5 h-5 ${styles.searchIcon}`} />
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search tokens, descriptions, or examples..."
						className={styles.searchInput}
						aria-label="Search regex tokens"
					/>
					{query && (
						<button onClick={() => setQuery("")} className={styles.clearBtn} aria-label="Clear search">
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
					{REGEX_CATEGORIES.map((cat) => (
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
					Showing <strong>{totalShown}</strong> of {totalAll} tokens.
				</p>
			</div>

			{filtered.length === 0 ? (
				<div className={`${styles.glassCard} ${styles.emptyState}`}>
					No tokens match your search.
				</div>
			) : (
				filtered.map((cat) => (
					<section key={cat.name} className={`mb-6 ${styles.glassCard}`}>
						<h2 className={`text-lg font-semibold mb-4 ${styles.categoryTitle}`}>{cat.name}</h2>
						<div className={styles.cardGrid}>
							{cat.tokens.map((t, i) => (
								<TokenCard
									key={`${cat.name}-${i}`}
									token={t}
									fieldId={`${cat.name}-${i}`}
									copy={copy}
									isCopied={isCopied}
								/>
							))}
						</div>
					</section>
				))
			)}

			<div className={`mt-2 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 ${styles.categoryTitle}`}>JavaScript notes</h3>
				<ul className={styles.notesList}>
					<li>JS regexes don&apos;t support <code>\A</code>, <code>\Z</code>, or atomic groups (<code>(?&gt;...)</code>).</li>
					<li>Lookbehind (<code>(?&lt;=...)</code>, <code>(?&lt;!...)</code>) requires modern engines (Chrome 62+, Node 10+).</li>
					<li>The <code>u</code> flag enables Unicode property escapes like <code>\p&#123;Letter&#125;</code> and proper surrogate handling.</li>
					<li>Always escape literal regex characters (<code>. * + ? ^ $ ( ) [ ] {`{`} {`}`} | \\ /</code>) with a backslash.</li>
				</ul>
			</div>
		</div>
	);
}

interface TokenCardProps {
	token: RegexToken;
	fieldId: string;
	copy: (text: string, field?: string) => Promise<boolean>;
	isCopied: (field?: string) => boolean;
}

function TokenCard({ token, fieldId, copy, isCopied }: TokenCardProps) {
	const copied = isCopied(fieldId);
	return (
		<button
			type="button"
			onClick={() => copy(token.token, fieldId)}
			className={`${styles.tokenCard} ${copied ? styles.tokenCardCopied : ""}`}
			title="Click to copy token"
		>
			<div className={styles.tokenHeader}>
				<code className={styles.tokenText}>{token.token}</code>
				<span className={styles.copyHint} aria-hidden>
					{copied ? (
						<ClipboardDocumentCheckIcon className="w-4 h-4" />
					) : (
						<ClipboardDocumentIcon className="w-4 h-4" />
					)}
				</span>
			</div>
			<p className={styles.tokenDesc}>{token.description}</p>
			<code className={styles.exampleText}>{token.example}</code>
		</button>
	);
}
