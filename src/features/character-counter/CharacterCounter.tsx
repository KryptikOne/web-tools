"use client";

import { useState, useMemo, useCallback } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./CharacterCounter.module.scss";

interface PlatformLimit {
	name: string;
	limit: number;
	color: string;
}

const PLATFORM_LIMITS: PlatformLimit[] = [
	{ name: "Twitter / X", limit: 280, color: "#1DA1F2" },
	{ name: "Instagram Caption", limit: 2200, color: "#E1306C" },
	{ name: "LinkedIn Post", limit: 3000, color: "#0A66C2" },
	{ name: "Facebook Post", limit: 63206, color: "#1877F2" },
	{ name: "YouTube Title", limit: 100, color: "#FF0000" },
	{ name: "YouTube Description", limit: 5000, color: "#FF0000" },
	{ name: "TikTok Caption", limit: 2200, color: "#010101" },
	{ name: "Pinterest Pin", limit: 500, color: "#E60023" },
];

const WORDS_PER_MINUTE_READING = 200;
const WORDS_PER_MINUTE_SPEAKING = 150;

interface CharFrequency {
	char: string;
	count: number;
	percentage: number;
}

function computeStats(text: string) {
	const characters = text.length;
	const charactersNoSpaces = text.replace(/\s/g, "").length;
	const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
	const sentences = text.trim() === "" ? 0 : text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
	const paragraphs = text.trim() === "" ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
	const lines = text === "" ? 0 : text.split(/\n/).length;

	const readingTimeMinutes = words / WORDS_PER_MINUTE_READING;
	const speakingTimeMinutes = words / WORDS_PER_MINUTE_SPEAKING;

	return {
		characters,
		charactersNoSpaces,
		words,
		sentences,
		paragraphs,
		lines,
		readingTimeMinutes,
		speakingTimeMinutes,
	};
}

function computeCharFrequency(text: string, topN: number = 15): CharFrequency[] {
	if (text.length === 0) return [];

	const freq: Record<string, number> = {};
	for (const char of text) {
		const key = char;
		freq[key] = (freq[key] || 0) + 1;
	}

	const total = text.length;
	return Object.entries(freq)
		.map(([char, count]) => ({
			char,
			count,
			percentage: (count / total) * 100,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, topN);
}

function formatTime(minutes: number): string {
	if (minutes < 1) {
		const seconds = Math.round(minutes * 60);
		return seconds === 0 ? "0 sec" : `${seconds} sec`;
	}
	const mins = Math.floor(minutes);
	const secs = Math.round((minutes - mins) * 60);
	if (mins === 0) return `${secs} sec`;
	if (secs === 0) return `${mins} min`;
	return `${mins} min ${secs} sec`;
}

function formatCharLabel(char: string): string {
	if (char === " ") return "Space";
	if (char === "\n") return "Newline";
	if (char === "\t") return "Tab";
	if (char === "\r") return "Return";
	return char;
}

export default function CharacterCounter() {
	const [text, setText] = useState("");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const stats = useMemo(() => computeStats(text), [text]);
	const charFrequency = useMemo(() => computeCharFrequency(text), [text]);

	const handleCopy = useCallback(async (content: string, field: string) => {
		try {
			await navigator.clipboard.writeText(content);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}, []);

	const handleClear = () => setText("");

	const statsText = useMemo(() => {
		return [
			`Characters: ${stats.characters}`,
			`Characters (no spaces): ${stats.charactersNoSpaces}`,
			`Words: ${stats.words}`,
			`Sentences: ${stats.sentences}`,
			`Paragraphs: ${stats.paragraphs}`,
			`Lines: ${stats.lines}`,
			`Reading time: ${formatTime(stats.readingTimeMinutes)}`,
			`Speaking time: ${formatTime(stats.speakingTimeMinutes)}`,
		].join("\n");
	}, [stats]);

	return (
		<div className={styles.container}>
			{/* Input Area */}
			<div className={styles.glassCard}>
				<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Input Text</h3>
					<div className="flex flex-wrap gap-2">
						<button
							onClick={handleClear}
							className={styles.btnSecondary}
							disabled={!text}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				</div>

				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Start typing or paste your text here..."
					className={styles.textarea}
					spellCheck={false}
				/>
			</div>

			{/* Stats Grid */}
			<div className={`grid gap-4 ${styles.statsGrid}`}>
				{/* Core Stats */}
				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
						<h3 className={styles.sectionTitle}>Statistics</h3>
						<button
							onClick={() => handleCopy(statsText, "stats")}
							className={`${styles.btnPrimary} ${copiedField === "stats" ? styles.copied : ""}`}
							disabled={!text}
						>
							{copiedField === "stats" ? (
								<>
									<CheckIcon className="w-4 h-4" />
									Copied!
								</>
							) : (
								<>
									<ClipboardDocumentIcon className="w-4 h-4" />
									Copy Stats
								</>
							)}
						</button>
					</div>

					<div className={`grid gap-3 ${styles.statItemsGrid}`}>
						<div className={styles.statItem}>
							<span className={styles.statLabel}>Characters</span>
							<span className={styles.statValue}>{stats.characters.toLocaleString()}</span>
						</div>
						<div className={styles.statItem}>
							<span className={styles.statLabel}>Characters (no spaces)</span>
							<span className={styles.statValue}>{stats.charactersNoSpaces.toLocaleString()}</span>
						</div>
						<div className={styles.statItem}>
							<span className={styles.statLabel}>Words</span>
							<span className={styles.statValue}>{stats.words.toLocaleString()}</span>
						</div>
						<div className={styles.statItem}>
							<span className={styles.statLabel}>Sentences</span>
							<span className={styles.statValue}>{stats.sentences.toLocaleString()}</span>
						</div>
						<div className={styles.statItem}>
							<span className={styles.statLabel}>Paragraphs</span>
							<span className={styles.statValue}>{stats.paragraphs.toLocaleString()}</span>
						</div>
						<div className={styles.statItem}>
							<span className={styles.statLabel}>Lines</span>
							<span className={styles.statValue}>{stats.lines.toLocaleString()}</span>
						</div>
					</div>

					{/* Reading / Speaking time */}
					<div className={`flex flex-wrap gap-4 mt-4 pt-4 ${styles.timeDivider}`}>
						<div className={styles.timeItem}>
							<span className={styles.timeLabel}>Reading time</span>
							<span className={styles.timeValue}>{formatTime(stats.readingTimeMinutes)}</span>
							<span className={styles.timeNote}>~{WORDS_PER_MINUTE_READING} WPM</span>
						</div>
						<div className={styles.timeItem}>
							<span className={styles.timeLabel}>Speaking time</span>
							<span className={styles.timeValue}>{formatTime(stats.speakingTimeMinutes)}</span>
							<span className={styles.timeNote}>~{WORDS_PER_MINUTE_SPEAKING} WPM</span>
						</div>
					</div>
				</div>

				{/* Social Media Limits */}
				<div className={styles.glassCard}>
					<h3 className={styles.sectionTitle}>Social Media Limits</h3>

					<div className="flex flex-col gap-3">
						{PLATFORM_LIMITS.map((platform) => {
							const percentage = text.length === 0 ? 0 : Math.min((text.length / platform.limit) * 100, 100);
							const isOver = text.length > platform.limit;

							return (
								<div key={platform.name} className={styles.platformItem}>
									<div className="flex justify-between items-center mb-1">
										<span className={styles.platformName}>{platform.name}</span>
										<span className={`text-xs font-mono ${isOver ? styles.platformOver : styles.platformCount}`}>
											{text.length.toLocaleString()} / {platform.limit.toLocaleString()}
										</span>
									</div>
									<div className={styles.progressTrack}>
										<div
											className={`${styles.progressBar} ${isOver ? styles.progressOver : ""}`}
											style={{
												width: `${percentage}%`,
												backgroundColor: isOver ? undefined : platform.color,
											}}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Character Frequency */}
			<div className={styles.glassCard}>
				<h3 className={styles.sectionTitle}>Character Frequency</h3>

				{charFrequency.length === 0 ? (
					<p className={`text-sm m-0 ${styles.emptyText}`}>Type some text to see character frequency analysis.</p>
				) : (
					<div className={`grid gap-2 ${styles.frequencyGrid}`}>
						{charFrequency.map((item, index) => (
							<div key={index} className={`flex items-center gap-3 ${styles.frequencyItem}`}>
								<span className={styles.frequencyChar}>
									{formatCharLabel(item.char)}
								</span>
								<div className={`flex-1 ${styles.frequencyBarTrack}`}>
									<div
										className={styles.frequencyBar}
										style={{ width: `${item.percentage}%` }}
									/>
								</div>
								<span className={styles.frequencyCount}>{item.count}</span>
								<span className={styles.frequencyPercent}>{item.percentage.toFixed(1)}%</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
