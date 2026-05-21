"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useClipboard } from "@/hooks/useClipboard";
import styles from "./NatoPhoneticConverter.module.scss";

const NATO_LETTERS: Record<string, string> = {
	A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo",
	F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliett",
	K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar",
	P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango",
	U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee",
	Z: "Zulu",
};

const NATO_DIGITS: Record<string, string> = {
	"0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four",
	"5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Niner",
};

const NATO_PUNCTUATION: Record<string, string> = {
	".": "Period",
	",": "Comma",
	"?": "Question Mark",
	"!": "Exclamation",
	":": "Colon",
	";": "Semicolon",
	"-": "Dash",
	"_": "Underscore",
	"/": "Slash",
	"\\": "Backslash",
	"@": "At",
	"#": "Hash",
	"&": "Ampersand",
	"+": "Plus",
	"=": "Equals",
	"'": "Apostrophe",
	"\"": "Quote",
	"(": "Open Paren",
	")": "Close Paren",
};

export default function NatoPhoneticConverter() {
	const [input, setInput] = useState("");
	const [includeDigits, setIncludeDigits] = useState(true);
	const [includePunctuation, setIncludePunctuation] = useState(false);
	const [includeSpaces, setIncludeSpaces] = useState(true);
	const { copy, isCopied } = useClipboard();

	const output = useMemo(() => {
		if (!input) return "";
		const words: string[] = [];
		for (const ch of input) {
			const upper = ch.toUpperCase();
			if (NATO_LETTERS[upper]) {
				words.push(NATO_LETTERS[upper]);
			} else if (includeDigits && NATO_DIGITS[ch]) {
				words.push(NATO_DIGITS[ch]);
			} else if (includePunctuation && NATO_PUNCTUATION[ch]) {
				words.push(NATO_PUNCTUATION[ch]);
			} else if (ch === " ") {
				if (includeSpaces) words.push("(space)");
			}
		}
		return words.join(" ");
	}, [input, includeDigits, includePunctuation, includeSpaces]);

	const wordCount = output ? output.split(" ").length : 0;

	return (
		<div className={styles.container}>
			{/* Options */}
			<div className={`flex flex-wrap gap-6 mb-6 p-4 ${styles.optionsBar}`}>
				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
					<input
						type="checkbox"
						checked={includeDigits}
						onChange={(e) => setIncludeDigits(e.target.checked)}
						className={styles.checkbox}
					/>
					Include digits (0–9)
				</label>
				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
					<input
						type="checkbox"
						checked={includePunctuation}
						onChange={(e) => setIncludePunctuation(e.target.checked)}
						className={styles.checkbox}
					/>
					Spell punctuation
				</label>
				<label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
					<input
						type="checkbox"
						checked={includeSpaces}
						onChange={(e) => setIncludeSpaces(e.target.checked)}
						className={styles.checkbox}
					/>
					Mark spaces
				</label>
			</div>

			{/* Input */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						Text to spell
					</h3>
					<button
						onClick={() => setInput("")}
						className={styles.btnSecondary}
						disabled={!input}
					>
						<TrashIcon className="w-4 h-4" />
						Clear
					</button>
				</div>

				<label htmlFor="nato-input" className="sr-only">Text to convert</label>
				<textarea
					id="nato-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type a word, a code, a license plate..."
					className={styles.textarea}
					spellCheck={false}
				/>
				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{input.length} characters</span>
				</div>
			</div>

			{/* Output */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-4 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
						NATO phonetic
					</h3>
					<button
						onClick={() => copy(output, "output")}
						className={`${styles.btnPrimary} ${isCopied("output") ? styles.copied : ""}`}
						disabled={!output}
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
				</div>

				{output ? (
					<div className={styles.outputBox}>
						{output.split(" ").map((word, idx) => (
							<span key={idx} className={styles.phoneticWord}>{word}</span>
						))}
					</div>
				) : (
					<div className={`${styles.outputBox} ${styles.emptyOutput}`}>
						Output will appear here...
					</div>
				)}

				<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
					<span>{wordCount} word{wordCount === 1 ? "" : "s"}</span>
				</div>
			</div>

			{/* Reference */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					NATO alphabet reference
				</h3>
				<div className={styles.alphabetGrid}>
					{Object.entries(NATO_LETTERS).map(([letter, word]) => (
						<div key={letter} className={styles.alphabetCell}>
							<span className={styles.letter}>{letter}</span>
							<span className={styles.word}>{word}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
