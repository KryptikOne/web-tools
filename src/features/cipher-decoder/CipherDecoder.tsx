"use client";

import { useMemo, useState } from "react";
import {
	ClipboardDocumentIcon,
	ClipboardIcon,
	CheckIcon,
	TrashIcon,
	AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import {
	autoDecode,
	caesar, rot13, rot47, atbash, vigenere, affine, railFence,
	morseEncode, morseDecode, a1z26Encode, a1z26Decode, baconEncode, baconDecode,
	decodeHex, decodeBinary, decodeBase32Text, decodeBase64Text,
	AFFINE_A_VALUES,
	type CipherId,
	type CipherCandidate,
} from "@/lib/cipherUtils";
import { encodeToBase64 } from "@/lib/base64Utils";
import { encodeBase32Rfc4648 } from "@/lib/base32Utils";
import styles from "./CipherDecoder.module.scss";

type Mode = "auto" | "manual";
type Direction = "decode" | "encode";

interface CipherMeta {
	id: CipherId;
	name: string;
	group: "Classical" | "Codes" | "Encodings";
	params?: ("shift" | "key" | "affine" | "rails")[];
}

const CIPHERS: CipherMeta[] = [
	{ id: "caesar", name: "Caesar", group: "Classical", params: ["shift"] },
	{ id: "rot13", name: "ROT13", group: "Classical" },
	{ id: "rot47", name: "ROT47", group: "Classical" },
	{ id: "atbash", name: "Atbash", group: "Classical" },
	{ id: "vigenere", name: "Vigenère", group: "Classical", params: ["key"] },
	{ id: "affine", name: "Affine", group: "Classical", params: ["affine"] },
	{ id: "railfence", name: "Rail fence", group: "Classical", params: ["rails"] },
	{ id: "morse", name: "Morse code", group: "Codes" },
	{ id: "a1z26", name: "A1Z26", group: "Codes" },
	{ id: "bacon", name: "Bacon's cipher", group: "Codes" },
	{ id: "base64", name: "Base64", group: "Encodings" },
	{ id: "base32", name: "Base32", group: "Encodings" },
	{ id: "hex", name: "Hex", group: "Encodings" },
	{ id: "binary", name: "Binary", group: "Encodings" },
];

const SAMPLES: { label: string; text: string }[] = [
	{ label: "Caesar", text: "AOL XBPJR IYVDU MVE QBTWZ VCLY AOL SHGF KVN" },
	{ label: "ROT13", text: "Gur frperg zrrgvat vf ng qnja" },
	{ label: "Vigenère", text: vigenere("THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND THEN THE DOG SLEEPS WHILE THE FOX RUNS AWAY INTO THE FOREST", "LEMON") },
	{ label: "Morse", text: ".... . .-.. .-.. --- / .-- --- .-. .-.. -.." },
	{ label: "Hex", text: "48 65 6c 6c 6f 2c 20 57 6f 72 6c 64 21" },
	{ label: "Base64", text: "VGhlIHF1aWNrIGJyb3duIGZveA==" },
];

const encoder = new TextEncoder();

function runCipher(
	id: CipherId,
	direction: Direction,
	text: string,
	p: { shift: number; key: string; a: number; b: number; rails: number }
): string {
	const dec = direction === "decode";
	switch (id) {
		case "caesar": return caesar(text, dec ? -p.shift : p.shift);
		case "rot13": return rot13(text);
		case "rot47": return rot47(text);
		case "atbash": return atbash(text);
		case "vigenere": return vigenere(text, p.key, dec);
		case "affine": return affine(text, p.a, p.b, dec);
		case "railfence": return railFence(text, p.rails, dec);
		case "morse": return dec ? morseDecode(text) : morseEncode(text);
		case "a1z26": return dec ? a1z26Decode(text) : a1z26Encode(text);
		case "bacon": return dec ? baconDecode(text) : baconEncode(text);
		case "base64": return dec ? decodeBase64Text(text) : encodeToBase64(text, false, false);
		case "base32": return dec ? decodeBase32Text(text) : encodeBase32Rfc4648(encoder.encode(text), true);
		case "hex": return dec ? decodeHex(text) : Array.from(encoder.encode(text), (b) => b.toString(16).padStart(2, "0")).join(" ");
		case "binary": return dec ? decodeBinary(text) : Array.from(encoder.encode(text), (b) => b.toString(2).padStart(8, "0")).join(" ");
	}
}

export default function CipherDecoder() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<Mode>("auto");
	const [cipher, setCipher] = useState<CipherId>("caesar");
	const [direction, setDirection] = useState<Direction>("decode");
	const [shift, setShift] = useState(3);
	const [key, setKey] = useState("KEY");
	const [affineA, setAffineA] = useState(5);
	const [affineB, setAffineB] = useState(8);
	const [rails, setRails] = useState(3);
	const [showReference, setShowReference] = useState(false);
	const { copy, isCopied } = useClipboard();

	const candidates = useMemo(() => (mode === "auto" ? autoDecode(input) : []), [mode, input]);

	const manual = useMemo(() => {
		if (mode !== "manual" || !input.trim()) return { output: "", error: null as string | null };
		try {
			return { output: runCipher(cipher, direction, input, { shift, key, a: affineA, b: affineB, rails }), error: null };
		} catch (err) {
			return { output: "", error: err instanceof Error ? err.message : "Could not process input" };
		}
	}, [mode, input, cipher, direction, shift, key, affineA, affineB, rails]);

	const meta = CIPHERS.find((c) => c.id === cipher)!;

	const tweak = (c: CipherCandidate) => {
		setCipher(c.cipher);
		setDirection("decode");
		if (c.params?.shift !== undefined) setShift(Number(c.params.shift));
		if (c.params?.key !== undefined) setKey(String(c.params.key));
		if (c.params?.a !== undefined) setAffineA(Number(c.params.a));
		if (c.params?.b !== undefined) setAffineB(Number(c.params.b));
		if (c.params?.rails !== undefined) setRails(Number(c.params.rails));
		setMode("manual");
	};

	const pasteFromClipboard = async () => {
		try {
			setInput(await navigator.clipboard.readText());
		} catch {
			/* clipboard read not permitted */
		}
	};

	return (
		<div className={styles.container}>
			{/* Input */}
			<div className={styles.glassCard}>
				<div className="flex justify-between items-center mb-3 flex-wrap gap-3">
					<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Input</h3>
					<div className="flex gap-2">
						<button type="button" className={styles.btnSecondary} onClick={pasteFromClipboard}>
							<ClipboardIcon className="w-4 h-4" />
							Paste
						</button>
						<button type="button" className={styles.btnSecondary} onClick={() => setInput("")} disabled={!input}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				</div>
				<label htmlFor="cipher-input" className="sr-only">Ciphertext</label>
				<textarea
					id="cipher-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Paste ciphertext, Morse, hex, Base64..."
					className={styles.textarea}
					spellCheck={false}
				/>
				<div className="flex flex-wrap items-center gap-2 mt-3">
					<span className={`text-xs ${styles.hint}`}>Try a sample:</span>
					{SAMPLES.map((s) => (
						<button key={s.label} type="button" className={styles.chip} onClick={() => { setInput(s.text); setMode("auto"); }}>
							{s.label}
						</button>
					))}
				</div>
			</div>

			<div className="mt-4">
				<SegmentedControl<Mode>
					label="Mode"
					value={mode}
					onChange={setMode}
					options={[
						{ value: "auto", label: "Auto-decode" },
						{ value: "manual", label: "Manual" },
					]}
				/>
			</div>

			{/* Auto */}
			{mode === "auto" && (
				<div className={`mt-4 ${styles.glassCard}`}>
					{!input.trim() && <p className={`m-0 text-sm ${styles.hint}`}>Enter ciphertext above to see ranked decoding candidates.</p>}
					{input.trim() && candidates.length === 0 && (
						<p className={`m-0 text-sm ${styles.hint}`}>Nothing here looked like a known cipher or encoding. Try Manual mode.</p>
					)}
					{candidates.length > 0 && (
						<ol className={styles.candidates}>
							{candidates.map((c, i) => {
								const pct = Math.round(c.score * 100);
								const field = `cand-${i}`;
								return (
									<li key={field} className={styles.candidate}>
										<div className={styles.candidateHeader}>
											<span className={styles.candidateLabel}>{c.label}</span>
											<span className={styles.candidateScore}>{pct}%</span>
											<button type="button" className={styles.iconBtn} onClick={() => copy(c.output, field)} aria-label={`Copy ${c.label} result`}>
												{isCopied(field) ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
											</button>
										</div>
										<div className={styles.bar}>
											<div className={styles.barFill} style={{ width: `${pct}%` }} />
										</div>
										<pre className={styles.candidateOutput}>{c.output}</pre>
										{CIPHERS.find((m) => m.id === c.cipher)?.params && (
											<button type="button" className={styles.tweak} onClick={() => tweak(c)}>
												<AdjustmentsHorizontalIcon className="w-4 h-4" />
												Tweak in Manual
											</button>
										)}
									</li>
								);
							})}
						</ol>
					)}
					<p className={`mt-4 mb-0 text-xs ${styles.hint}`}>
						Candidates are ranked by English-likeness (letter frequency plus common words). Vigenère key recovery uses
						the Index of Coincidence and works best on ciphertext longer than about 50 letters.
					</p>
				</div>
			)}

			{/* Manual */}
			{mode === "manual" && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<div className={styles.manualGrid}>
						<label className={styles.field}>
							<span className={styles.fieldLabel}>Cipher</span>
							<select value={cipher} onChange={(e) => setCipher(e.target.value as CipherId)} className={styles.select}>
								{(["Classical", "Codes", "Encodings"] as const).map((g) => (
									<optgroup key={g} label={g}>
										{CIPHERS.filter((c) => c.group === g).map((c) => (
											<option key={c.id} value={c.id}>{c.name}</option>
										))}
									</optgroup>
								))}
							</select>
						</label>
						<div className={styles.field}>
							<span className={styles.fieldLabel}>Direction</span>
							<SegmentedControl<Direction>
								label="Direction"
								size="sm"
								value={direction}
								onChange={setDirection}
								options={[
									{ value: "decode", label: "Decode" },
									{ value: "encode", label: "Encode" },
								]}
							/>
						</div>
						{meta.params?.includes("shift") && (
							<label className={styles.field}>
								<span className={styles.fieldLabel}>Shift (1–25)</span>
								<input type="number" min={1} max={25} value={shift} onChange={(e) => setShift(Math.min(25, Math.max(1, Number(e.target.value) || 1)))} className={styles.input} />
							</label>
						)}
						{meta.params?.includes("key") && (
							<label className={styles.field}>
								<span className={styles.fieldLabel}>Keyword</span>
								<input type="text" value={key} onChange={(e) => setKey(e.target.value)} className={styles.input} placeholder="LEMON" />
							</label>
						)}
						{meta.params?.includes("affine") && (
							<>
								<label className={styles.field}>
									<span className={styles.fieldLabel}>a (coprime with 26)</span>
									<select value={affineA} onChange={(e) => setAffineA(Number(e.target.value))} className={styles.select}>
										{AFFINE_A_VALUES.map((a) => <option key={a} value={a}>{a}</option>)}
									</select>
								</label>
								<label className={styles.field}>
									<span className={styles.fieldLabel}>b (0–25)</span>
									<input type="number" min={0} max={25} value={affineB} onChange={(e) => setAffineB(Math.min(25, Math.max(0, Number(e.target.value) || 0)))} className={styles.input} />
								</label>
							</>
						)}
						{meta.params?.includes("rails") && (
							<label className={styles.field}>
								<span className={styles.fieldLabel}>Rails (2–20)</span>
								<input type="number" min={2} max={20} value={rails} onChange={(e) => setRails(Math.min(20, Math.max(2, Number(e.target.value) || 2)))} className={styles.input} />
							</label>
						)}
					</div>

					<div className="flex justify-between items-center mt-5 mb-2 flex-wrap gap-3">
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Output</h3>
						<button
							type="button"
							className={`${styles.btnPrimary} ${isCopied("manual") ? styles.copied : ""}`}
							onClick={() => copy(manual.output, "manual")}
							disabled={!manual.output}
						>
							{isCopied("manual") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
							{isCopied("manual") ? "Copied!" : "Copy"}
						</button>
					</div>
					{manual.error ? (
						<p className={styles.error}>{manual.error}</p>
					) : (
						<pre className={styles.output}>{manual.output || (input.trim() ? "" : "Output will appear here")}</pre>
					)}
				</div>
			)}

			{/* Reference */}
			<div className={`mt-4 ${styles.glassCard}`}>
				<button type="button" className={styles.referenceToggle} onClick={() => setShowReference((v) => !v)} aria-expanded={showReference}>
					<span className={`text-lg font-semibold ${styles.cardTitle}`}>Cipher reference</span>
					<span className={styles.hint}>{showReference ? "Hide" : "Show"}</span>
				</button>
				{showReference && (
					<div className={styles.reference}>
						<h4>Classical (alphabet) ciphers</h4>
						<ul>
							<li><strong>Caesar</strong>: fixed shift along the alphabet (key 1–25).</li>
							<li><strong>ROT13</strong>: Caesar with shift 13, so it is its own inverse.</li>
							<li><strong>ROT47</strong>: shift 47 across printable ASCII (33–126).</li>
							<li><strong>Atbash</strong>: A↔Z, B↔Y, and so on. No key.</li>
							<li><strong>Vigenère</strong>: repeating-keyword polyalphabetic shift.</li>
							<li><strong>Affine</strong>: y = (a·x + b) mod 26, with a coprime to 26.</li>
							<li><strong>Rail fence</strong>: zig-zag transposition over N rails.</li>
						</ul>
						<h4>Codes</h4>
						<ul>
							<li><strong>Morse code</strong>: dots and dashes, with / between words.</li>
							<li><strong>A1Z26</strong>: A=1, B=2, … Z=26, hyphens between letters.</li>
							<li><strong>Bacon&apos;s cipher</strong>: five-letter A/B groups per letter.</li>
						</ul>
						<h4>Encodings</h4>
						<ul>
							<li><strong>Base64 / Base32 / Hex / Binary</strong>: byte-level encodings, not ciphers. They hide nothing.</li>
						</ul>
						<h4>Not included</h4>
						<p>
							Playfair, Hill, Enigma, custom substitution alphabets and columnar transposition need substantial
							setup (grids, matrices, rotor wirings, key tables) and are better served by dedicated tools.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
