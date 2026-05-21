"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import styles from "./NumeronymGenerator.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

// Splits text into tokens, keeping non-letter runs (spaces, punctuation, digits)
// intact so they can be re-emitted unchanged.
function tokenize(input: string): string[] {
	return input.match(/[\p{L}\p{M}]+|[^\p{L}\p{M}]+/gu) ?? [];
}

function numeronymWord(word: string): string {
	if (word.length <= 2) return word;
	return word[0] + (word.length - 2) + word[word.length - 1];
}

export function numeronymize(input: string): string {
	if (!input) return "";
	return tokenize(input)
		.map((tok) => (/[\p{L}\p{M}]/u.test(tok[0] ?? "") ? numeronymWord(tok) : tok))
		.join("");
}

const EXAMPLES: { word: string; result: string }[] = [
	{ word: "internationalization", result: numeronymize("internationalization") },
	{ word: "kubernetes", result: numeronymize("kubernetes") },
	{ word: "accessibility", result: numeronymize("accessibility") },
	{ word: "localization", result: numeronymize("localization") },
	{ word: "globalization", result: numeronymize("globalization") },
	{ word: "observability", result: numeronymize("observability") },
];

export default function NumeronymGenerator() {
	const [input, setInput] = useState("internationalization is hard");
	const { copy, isCopied } = useClipboard();

	const output = useMemo(() => numeronymize(input), [input]);

	return (
		<div className={styles.container}>
			{/* Input */}
			<div className={styles.glassCard}>
				<label htmlFor="num-input" className={`block text-lg font-semibold mb-3 ${styles.cardTitle}`}>
					Input
				</label>
				<textarea
					id="num-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Enter a word or sentence..."
					className={styles.textarea}
					spellCheck={false}
				/>
				<p className={`text-xs mt-2 m-0 ${styles.cardSubtitle}`}>
					Words with 2 or fewer letters are left as-is. Punctuation and spacing are
					preserved.
				</p>
			</div>

			{/* Output */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<div className="flex justify-between items-center mb-3 flex-wrap gap-4">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Numeronym</h3>
					<button
						type="button"
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
				<textarea
					value={output}
					readOnly
					placeholder="Output will appear here..."
					className={`${styles.textarea} ${styles.readOnly}`}
					spellCheck={false}
					aria-label="Numeronym output"
				/>
			</div>

			{/* Examples */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>Examples</h3>
				<div className={styles.examplesGrid}>
					{EXAMPLES.map((ex) => (
						<div key={ex.word} className={styles.exampleRow}>
							<span>{ex.word}</span>
							<span className={styles.arrow}>→</span>
							<span className={styles.exampleResult}>{ex.result}</span>
						</div>
					))}
				</div>
			</div>

			{/* Info */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>About</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>What is a numeronym?</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							A numeronym is a word abbreviation where the middle letters are replaced by
							their count. The classic form is <code>first + (length − 2) + last</code>:
							<code>internationalization</code> becomes <code>i18n</code>.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>How it handles sentences</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							Each letter run is treated as a word and converted independently. Spaces,
							punctuation, and digits are preserved verbatim so prose still reads
							naturally.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
