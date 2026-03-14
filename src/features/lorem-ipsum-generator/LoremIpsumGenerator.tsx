"use client";

import { useState, useCallback, useMemo } from "react";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	ArrowPathIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./LoremIpsumGenerator.module.scss";

type OutputType = "paragraphs" | "sentences" | "words";

const LATIN_WORDS = [
	"lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
	"sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
	"magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
	"exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
	"consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
	"velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
	"occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
	"deserunt", "mollit", "anim", "id", "est", "laborum", "ac", "accumsan",
	"aliquet", "ante", "aptent", "arcu", "at", "auctor", "augue", "bibendum",
	"blandit", "class", "condimentum", "congue", "cras", "curabitur", "cursus",
	"dapibus", "diam", "dictum", "dignissim", "donec", "efficitur", "egestas",
	"eleifend", "elementum", "etiam", "eu", "euismod", "facilisi", "facilisis",
	"fames", "faucibus", "felis", "fermentum", "feugiat", "finibus", "fringilla",
	"fusce", "gravida", "habitant", "habitasse", "hac", "hendrerit", "himenaeos",
	"iaculis", "imperdiet", "integer", "interdum", "justo", "lacinia", "lacus",
	"laoreet", "lectus", "leo", "libero", "ligula", "litora", "lobortis",
	"luctus", "maecenas", "malesuada", "massa", "mattis", "mauris", "maximus",
	"metus", "mi", "morbi", "nam", "nec", "neque", "nibh", "nisl", "nullam",
	"nunc", "odio", "orci", "ornare", "pellentesque", "pharetra", "placerat",
	"platea", "porta", "porttitor", "posuere", "potenti", "praesent", "pretium",
	"primis", "proin", "pulvinar", "purus", "quam", "quisque", "rhoncus",
	"ridiculus", "risus", "rutrum", "sagittis", "sapien", "scelerisque",
	"semper", "senectus", "sociosqu", "sodales", "sollicitudin", "suscipit",
	"suspendisse", "taciti", "tellus", "tincidunt", "torquent", "tortor",
	"tristique", "turpis", "ultrices", "ultricies", "urna", "varius",
	"vehicula", "vel", "vestibulum", "vitae", "vivamus", "viverra", "volutpat",
	"vulputate",
];

const CLASSIC_OPENING = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr: string[]): string {
	return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSentence(): string {
	const length = randomInt(5, 15);
	const words: string[] = [];
	for (let i = 0; i < length; i++) {
		words.push(pickRandom(LATIN_WORDS));
	}
	return capitalize(words.join(" ")) + ".";
}

function generateParagraph(): string {
	const sentenceCount = randomInt(3, 7);
	const sentences: string[] = [];
	for (let i = 0; i < sentenceCount; i++) {
		sentences.push(generateSentence());
	}
	return sentences.join(" ");
}

export default function LoremIpsumGenerator() {
	const [outputType, setOutputType] = useState<OutputType>("paragraphs");
	const [count, setCount] = useState(3);
	const [startWithLorem, setStartWithLorem] = useState(true);
	const [generatedText, setGeneratedText] = useState("");
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const generate = useCallback(() => {
		let result = "";

		if (outputType === "paragraphs") {
			const paragraphs: string[] = [];
			for (let i = 0; i < count; i++) {
				paragraphs.push(generateParagraph());
			}
			if (startWithLorem && paragraphs.length > 0) {
				// Replace the first sentence of the first paragraph
				const firstParagraph = paragraphs[0];
				const restOfParagraph = firstParagraph.split(". ").slice(1).join(". ");
				paragraphs[0] = restOfParagraph
					? CLASSIC_OPENING + " " + restOfParagraph
					: CLASSIC_OPENING;
			}
			result = paragraphs.join("\n\n");
		} else if (outputType === "sentences") {
			const sentences: string[] = [];
			for (let i = 0; i < count; i++) {
				sentences.push(generateSentence());
			}
			if (startWithLorem && sentences.length > 0) {
				sentences[0] = CLASSIC_OPENING;
			}
			result = sentences.join(" ");
		} else {
			// words
			const words: string[] = [];
			for (let i = 0; i < count; i++) {
				words.push(pickRandom(LATIN_WORDS));
			}
			if (startWithLorem && words.length >= 2) {
				words[0] = "lorem";
				words[1] = words.length > 1 ? "ipsum" : words[1];
			} else if (startWithLorem && words.length === 1) {
				words[0] = "lorem";
			}
			result = words.join(" ");
		}

		setGeneratedText(result);
	}, [outputType, count, startWithLorem]);

	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleClear = () => {
		setGeneratedText("");
	};

	const stats = useMemo(() => {
		if (!generatedText) return { words: 0, characters: 0 };
		const wordCount = generatedText.split(/\s+/).filter((w) => w.length > 0).length;
		const charCount = generatedText.length;
		return { words: wordCount, characters: charCount };
	}, [generatedText]);

	const outputTypeOptions: { value: OutputType; label: string }[] = [
		{ value: "paragraphs", label: "Paragraphs" },
		{ value: "sentences", label: "Sentences" },
		{ value: "words", label: "Words" },
	];

	return (
		<div className={styles.container}>
			{/* Controls */}
			<div className={styles.glassCard}>
				<h2 className={`mb-4 ${styles.sectionTitle}`}>Options</h2>

				<div className="flex flex-wrap items-end gap-6">
					{/* Output Type */}
					<div className="flex flex-col gap-2">
						<label className={`text-sm font-medium ${styles.label}`}>Type</label>
						<div className="flex gap-2">
							{outputTypeOptions.map((opt) => (
								<button
									key={opt.value}
									onClick={() => setOutputType(opt.value)}
									className={`${styles.presetBtn} ${outputType === opt.value ? styles.active : ""}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					{/* Count */}
					<div className="flex flex-col gap-2">
						<label className={`text-sm font-medium ${styles.label}`}>
							Count
						</label>
						<input
							type="number"
							min={1}
							max={100}
							value={count}
							onChange={(e) => {
								const val = parseInt(e.target.value, 10);
								if (!isNaN(val) && val >= 1 && val <= 100) {
									setCount(val);
								}
							}}
							className={styles.numberInput}
						/>
					</div>

					{/* Start with Lorem toggle */}
					<div className="flex items-center gap-2 pb-1">
						<label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${styles.checkboxLabel}`}>
							<input
								type="checkbox"
								checked={startWithLorem}
								onChange={(e) => setStartWithLorem(e.target.checked)}
								className={`w-4 h-4 cursor-pointer ${styles.checkbox}`}
							/>
							Start with &quot;Lorem ipsum...&quot;
						</label>
					</div>

					{/* Generate Button */}
					<button onClick={generate} className={`${styles.generateBtn}`}>
						<ArrowPathIcon className="w-4 h-4" />
						Generate
					</button>
				</div>
			</div>

			{/* Output */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<div className={`flex justify-between items-center mb-4 flex-wrap gap-4`}>
					<h2 className={`m-0 ${styles.sectionTitle}`}>Generated Text</h2>
					<div className="flex gap-2">
						<button
							onClick={handleClear}
							className={styles.btnSecondary}
							disabled={!generatedText}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
						<button
							onClick={() => handleCopy(generatedText, "output")}
							className={`${styles.btnCopy} ${copiedField === "output" ? styles.copied : ""}`}
							disabled={!generatedText}
						>
							{copiedField === "output" ? (
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

				<div className={styles.outputArea}>
					{generatedText ? (
						<p className={styles.outputText}>{generatedText}</p>
					) : (
						<p className={styles.placeholder}>
							Click &quot;Generate&quot; to create lorem ipsum text.
						</p>
					)}
				</div>

				{generatedText && (
					<div className={`flex gap-4 mt-3 text-xs ${styles.statsBar}`}>
						<span>{stats.words} words</span>
						<span>{stats.characters} characters</span>
					</div>
				)}
			</div>
		</div>
	);
}
