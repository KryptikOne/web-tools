"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowDownTrayIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import {
	SPELLING_ALPHABETS,
	getSpellingAlphabet,
	spellText,
	spellTokensToString,
	readSpelledText,
	resolveSpellingMode,
	type SpellingAlphabetId,
	type SpellingMode,
} from "@/lib/natoPhoneticUtils";
import { charToMorse } from "@/lib/morseUtils";
import { semaphoreAngles } from "@/lib/semaphoreUtils";
import { downloadTextFile } from "@/lib/downloadUtils";
import SignalFlag from "./SignalFlag";
import styles from "./NatoPhoneticConverter.module.scss";

const MODES: { id: SpellingMode; label: string }[] = [
	{ id: "auto", label: "Auto" },
	{ id: "spell", label: "Spell" },
	{ id: "read", label: "Read" },
];

/** Arm-end coordinate on a 28×28 glyph for an angle clockwise from 12 o'clock. */
function armEnd(angleDeg: number): { x: number; y: number } {
	const rad = (angleDeg * Math.PI) / 180;
	return { x: 14 + 11 * Math.sin(rad), y: 14 - 11 * Math.cos(rad) };
}

function SemaphoreGlyph({ letter }: { letter: string }) {
	const angles = semaphoreAngles(letter);
	if (!angles) return null;
	return (
		<svg viewBox="0 0 28 28" className={styles.semaphore} aria-hidden="true" focusable="false">
			<circle cx="14" cy="14" r="12" />
			{angles.map((a, i) => {
				const { x, y } = armEnd(a);
				return <line key={i} x1="14" y1="14" x2={x} y2={y} />;
			})}
			<circle cx="14" cy="14" r="1.5" className={styles.semaphoreHub} />
		</svg>
	);
}

function MorseGlyph({ letter }: { letter: string }) {
	const code = charToMorse(letter);
	if (!code) return null;
	return (
		<span className={styles.morse} aria-hidden="true">
			{code.split("").map((s, i) => (
				<i key={i} className={s === "." ? styles.dot : styles.dash} />
			))}
		</span>
	);
}

export default function NatoPhoneticConverter() {
	const [alphabetId, setAlphabetId] = useState<SpellingAlphabetId>("nato");
	const [mode, setMode] = useState<SpellingMode>("auto");
	const [input, setInput] = useState("");
	const { copy, isCopied } = useClipboard();

	const alphabet = getSpellingAlphabet(alphabetId);
	const effectiveMode = resolveSpellingMode(mode, input, alphabet);

	const tokens = useMemo(
		() => (effectiveMode === "spell" ? spellText(input, alphabet) : []),
		[effectiveMode, input, alphabet]
	);
	const readOutput = useMemo(
		() => (effectiveMode === "read" ? readSpelledText(input, alphabet) : ""),
		[effectiveMode, input, alphabet]
	);
	const outputText = effectiveMode === "spell" ? spellTokensToString(tokens) : readOutput;

	const usedChars = useMemo(() => {
		const set = new Set<string>();
		const add = (ch: string) => {
			const upper = ch.toUpperCase();
			set.add(upper);
			set.add(upper.normalize("NFD").replace(/[̀-ͯ]/g, ""));
		};
		if (effectiveMode === "spell") {
			for (const t of tokens) if (t.kind === "pair") add(t.char);
		} else {
			for (const ch of Array.from(readOutput)) add(ch);
		}
		return set;
	}, [effectiveMode, tokens, readOutput]);

	const handleTap = (char: string, word: string) => {
		setInput((prev) => {
			if (effectiveMode === "read") {
				const sep = prev && !/\s$/.test(prev) ? " " : "";
				return `${prev}${sep}${word} `;
			}
			return prev + char;
		});
	};

	const handleDownload = () => {
		const name = effectiveMode === "spell" ? `${alphabet.id}-spelling.txt` : "decoded-text.txt";
		downloadTextFile(name, outputText);
	};

	const hasOutput = outputText.trim().length > 0;

	return (
		<div className={styles.container}>
			{/* Controls */}
			<div className="grid gap-3 md:grid-cols-2 mb-4">
				<div role="radiogroup" aria-label="Spelling alphabet" className={styles.segmented}>
					{SPELLING_ALPHABETS.map((a) => (
						<button
							key={a.id}
							type="button"
							role="radio"
							aria-checked={alphabetId === a.id}
							title={a.description}
							className={`${styles.segment} ${alphabetId === a.id ? styles.active : ""}`}
							onClick={() => setAlphabetId(a.id)}
						>
							{a.name}
						</button>
					))}
				</div>
				<div role="radiogroup" aria-label="Mode" className={styles.segmented}>
					{MODES.map((m) => (
						<button
							key={m.id}
							type="button"
							role="radio"
							aria-checked={mode === m.id}
							className={`${styles.segment} ${mode === m.id ? styles.active : ""}`}
							onClick={() => setMode(m.id)}
						>
							{m.label}
							{m.id === "auto" && mode === "auto" && input && (
								<span className={styles.segmentHint}>{effectiveMode === "spell" ? "spelling" : "reading"}</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Input + output */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-3 flex-wrap gap-3">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						{effectiveMode === "spell" ? "Text to spell" : "Calls to read"}
					</h3>
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

				<label htmlFor="nato-input" className="sr-only">
					Input
				</label>
				<textarea
					id="nato-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={
						effectiveMode === "read"
							? "Hotel Echo Lima Lima Oscar / Whiskey Oscar Romeo Lima Delta"
							: "Type or paste"
					}
					className={styles.textarea}
					spellCheck={false}
				/>

				<div className={styles.output} role="region" aria-label="Output" aria-live="polite">
					{!hasOutput && <span className={styles.placeholder}>Output will appear here</span>}
					{hasOutput && effectiveMode === "spell" && (
						<div className={styles.pairs}>
							{tokens.map((t, i) =>
								t.kind === "pair" ? (
									<span key={i} className={styles.pair}>
										<span className={styles.pairChar}>{t.char}</span>
										<span className={styles.pairWord}>{t.word}</span>
									</span>
								) : t.kind === "break" ? (
									<span key={i} className={styles.break}>
										/
									</span>
								) : (
									<span key={i} className={styles.pair}>
										<span className={styles.pairChar}>{t.char}</span>
									</span>
								)
							)}
						</div>
					)}
					{hasOutput && effectiveMode === "read" && <p className={styles.readOut}>{readOutput}</p>}
				</div>

				<div className={`flex gap-2 mt-3 ${styles.actions}`}>
					<button
						type="button"
						onClick={() => copy(outputText, "output")}
						className={`${styles.btnPrimary} ${isCopied("output") ? styles.copied : ""}`}
						disabled={!hasOutput}
					>
						{isCopied("output") ? (
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
					<button
						type="button"
						onClick={handleDownload}
						className={styles.btnSecondary}
						disabled={!hasOutput}
					>
						<ArrowDownTrayIcon className="w-4 h-4" />
						Download
					</button>
				</div>
			</div>

			{/* Chart */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Chart</h3>
					<span className={`text-xs ${styles.hint}`}>
						{effectiveMode === "read" ? "Tap to add a call" : "Tap to spell"}
					</span>
				</div>
				<div className={styles.chart}>
					{alphabet.letters.map((l) => (
						<button
							key={l.char}
							type="button"
							onClick={() => handleTap(l.char, l.word)}
							className={`${styles.cell} ${usedChars.has(l.char) ? styles.cellActive : ""} ${
								l.extra ? styles.cellExtra : ""
							}`}
							aria-label={`${l.char}, ${l.word}`}
						>
							<span className={styles.cellLetter}>{l.char}</span>
							{!l.extra && <MorseGlyph letter={l.char} />}
							{!l.extra && <SemaphoreGlyph letter={l.char} />}
							<span className={styles.cellWord}>{l.word}</span>
							{!l.extra && <SignalFlag letter={l.char} className={styles.flag} />}
						</button>
					))}
				</div>
				<div className={styles.digits}>
					{alphabet.digits.map((word, i) => (
						<button
							key={i}
							type="button"
							onClick={() => handleTap(String(i), word)}
							className={`${styles.digit} ${usedChars.has(String(i)) ? styles.cellActive : ""}`}
							aria-label={`${i}, ${word}`}
						>
							<span className={styles.digitChar}>{i}</span>
							<span className={styles.digitWord}>{word}</span>
						</button>
					))}
				</div>
			</div>

			{/* Info */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>About the chart</h3>
				<ul className={styles.infoList}>
					<li>
						<strong>NATO</strong> is the ICAO radiotelephony alphabet. The official spellings are
						&ldquo;Alfa&rdquo; and &ldquo;Juliett&rdquo;; the common variants are accepted when reading.
					</li>
					<li>
						<strong>DIN 5009</strong> is the 2022 German standard built from city names.{" "}
						<strong>German (1996)</strong> is the older given-name alphabet still in everyday use.
					</li>
					<li>
						Each cell also shows the letter&apos;s Morse code, its flag-semaphore arm positions as seen by
						the receiver, and its maritime signal flag.
					</li>
					<li>
						<strong>Auto</strong> switches to reading when every word in the input is a recognised call.
						A &ldquo;/&rdquo; between calls marks a word break.
					</li>
				</ul>
			</div>
		</div>
	);
}
