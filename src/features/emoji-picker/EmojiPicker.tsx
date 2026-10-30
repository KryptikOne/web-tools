"use client";

import { useEffect, useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import styles from "./EmojiPicker.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

interface EmojiEntry {
	name: string;
	slug: string;
	group: string;
	emoji_version: string;
	unicode_version: string;
	skin_tone_support: boolean;
}

type EmojiMap = Record<string, EmojiEntry>;

interface SkinTone {
	id: string;
	label: string;
	modifier: string; // empty string for default
}

const SKIN_TONES: SkinTone[] = [
	{ id: "default", label: "Default", modifier: "" },
	{ id: "light", label: "Light", modifier: "\u{1F3FB}" },
	{ id: "medium-light", label: "Medium-light", modifier: "\u{1F3FC}" },
	{ id: "medium", label: "Medium", modifier: "\u{1F3FD}" },
	{ id: "medium-dark", label: "Medium-dark", modifier: "\u{1F3FE}" },
	{ id: "dark", label: "Dark", modifier: "\u{1F3FF}" },
];

const SKIN_TONE_SWATCHES: Record<string, string> = {
	default: "\u{270B}",
	light: "\u{270B}\u{1F3FB}",
	"medium-light": "\u{270B}\u{1F3FC}",
	medium: "\u{270B}\u{1F3FD}",
	"medium-dark": "\u{270B}\u{1F3FE}",
	dark: "\u{270B}\u{1F3FF}",
};

function emojiCodepoints(emoji: string): string {
	const points: string[] = [];
	for (const ch of emoji) {
		const cp = ch.codePointAt(0);
		if (cp !== undefined) {
			points.push("U+" + cp.toString(16).toUpperCase().padStart(4, "0"));
		}
	}
	return points.join(" ");
}

export default function EmojiPicker() {
	const [emojiMap, setEmojiMap] = useState<EmojiMap | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [activeGroup, setActiveGroup] = useState<string>("All");
	const [skinTone, setSkinTone] = useState<string>("default");
	const [selected, setSelected] = useState<{ char: string; entry: EmojiEntry } | null>(null);
	const { copy, isCopied } = useClipboard();

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const mod = await import("unicode-emoji-json");
				if (cancelled) return;
				const data = (mod.default ?? mod) as EmojiMap;
				setEmojiMap(data);
			} catch (err) {
				if (cancelled) return;
				setLoadError(err instanceof Error ? err.message : "Failed to load emoji data");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const groups = useMemo(() => {
		if (!emojiMap) return ["All"];
		const set = new Set<string>();
		for (const entry of Object.values(emojiMap)) set.add(entry.group);
		return ["All", ...Array.from(set)];
	}, [emojiMap]);

	const tone = useMemo(
		() => SKIN_TONES.find((t) => t.id === skinTone) ?? SKIN_TONES[0],
		[skinTone]
	);

	const filtered = useMemo(() => {
		if (!emojiMap) return [] as { char: string; entry: EmojiEntry }[];
		const query = search.trim().toLowerCase();
		const out: { char: string; entry: EmojiEntry }[] = [];
		for (const [char, entry] of Object.entries(emojiMap)) {
			if (activeGroup !== "All" && entry.group !== activeGroup) continue;
			if (query) {
				if (
					!entry.name.toLowerCase().includes(query) &&
					!entry.slug.toLowerCase().includes(query)
				) {
					continue;
				}
			}
			out.push({ char, entry });
		}
		return out.slice(0, 600);
	}, [emojiMap, search, activeGroup]);

	const applyTone = (char: string, supports: boolean): string => {
		if (!supports || !tone.modifier) return char;
		return char + tone.modifier;
	};

	const handlePick = (char: string, entry: EmojiEntry) => {
		const final = applyTone(char, entry.skin_tone_support);
		setSelected({ char: final, entry });
		copy(final, "selected");
	};

	const selectedChar = selected?.char ?? "";
	const selectedEntry = selected?.entry ?? null;

	return (
		<div className={styles.container}>
			{/* Controls */}
			<div className={`flex flex-col gap-4 mb-6 p-4 ${styles.controls}`}>
				<label className="relative block">
					<span className="sr-only">Search emojis</span>
					<MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
					<input
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by name or slug (e.g. heart, smiling_face)..."
						className={`${styles.searchInput} pl-9`}
					/>
				</label>

				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<div className={`flex gap-2 overflow-x-auto pb-1 ${styles.chipRow}`}>
						{groups.map((g) => (
							<button
								key={g}
								type="button"
								onClick={() => setActiveGroup(g)}
								className={`${styles.chip} ${activeGroup === g ? styles.activeChip : ""}`}
							>
								{g}
							</button>
						))}
					</div>

					<div className="flex items-center gap-2">
						<span className="text-xs text-gray-400">Skin tone:</span>
						<div className="flex gap-1" role="group" aria-label="Skin tone">
							{SKIN_TONES.map((t) => (
								<button
									key={t.id}
									type="button"
									aria-label={t.label}
									aria-pressed={skinTone === t.id}
									onClick={() => setSkinTone(t.id)}
									className={`${styles.skinTone} ${skinTone === t.id ? styles.activeSkinTone : ""}`}
								>
									{SKIN_TONE_SWATCHES[t.id]}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Selected detail */}
			<div className={styles.glassCard}>
				<div className="flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-4">
						<span className={styles.selectedEmoji} aria-hidden={!selectedChar}>
							{selectedChar || "\u{1F642}"}
						</span>
						<div>
							<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
								{selectedEntry ? selectedEntry.name : "Pick an emoji"}
							</h3>
							<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
								{selectedEntry ? (
									<>
										<span className={styles.codepoint}>{emojiCodepoints(selectedChar)}</span>
										<span> · {selectedEntry.group}</span>
									</>
								) : (
									"Click any emoji below to copy it"
								)}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => selectedChar && copy(selectedChar, "selected")}
						className={`${styles.btnPrimary} ${isCopied("selected") ? styles.copied : ""}`}
						disabled={!selectedChar}
					>
						{isCopied("selected") ? (
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
			</div>

			{loadError && (
				<div className={`mt-4 px-4 py-3 text-sm ${styles.errorBox}`}>
					{loadError}
				</div>
			)}

			{/* Grid */}
			<div className={`mt-4 ${styles.glassCard}`}>
				{!emojiMap && !loadError && (
					<p className={`text-sm m-0 ${styles.loadingText}`}>Loading emoji dataset...</p>
				)}
				{emojiMap && filtered.length === 0 && (
					<p className={`text-sm m-0 ${styles.emptyText}`}>No emojis match your search.</p>
				)}
				{emojiMap && filtered.length > 0 && (
					<div
						className={`grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-1 ${styles.grid}`}
					>
						{filtered.map(({ char, entry }) => {
							const display = applyTone(char, entry.skin_tone_support);
							return (
								<button
									key={entry.slug}
									type="button"
									title={entry.name}
									aria-label={entry.name}
									onClick={() => handlePick(char, entry)}
									className={styles.emojiBtn}
								>
									{display}
								</button>
							);
						})}
					</div>
				)}
				{emojiMap && filtered.length > 0 && (
					<p className={`mt-3 text-xs m-0 ${styles.cardFooter}`}>
						Showing {filtered.length} emoji{filtered.length === 1 ? "" : "s"}
						{filtered.length >= 600 ? " (capped at 600 — narrow your search)" : ""}
					</p>
				)}
			</div>

			{/* Info */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Skin tones</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Skin-tone modifiers are codepoints <code>U+1F3FB</code> through{" "}
							<code>U+1F3FF</code> appended to emojis that support them. Emojis without
							support are shown unchanged.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>Privacy</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							The emoji dataset is bundled locally and lazy-loaded on first use. Nothing
							you click or search is sent anywhere.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
