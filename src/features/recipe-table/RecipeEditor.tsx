"use client";

import { useRef, useState } from "react";
import { INSERT_TEMPLATES, CHEAT_SHEET, type ParseError } from "@/lib/recipeUtils";
import styles from "./RecipeTablePage.module.scss";

interface RecipeEditorProps {
	text: string;
	onChange: (text: string) => void;
	errors: ParseError[];
	readOnly?: boolean;
}

const TOOLBAR: { key: keyof typeof INSERT_TEMPLATES; label: string; title: string }[] = [
	{ key: "step", label: "Step", title: "Insert a step with an ingredient" },
	{ key: "ingredient", label: "Ingredient", title: "Insert an ingredient line under the current step" },
	{ key: "useResult", label: "Use result", title: "Insert an @ reference to a named result or byproduct" },
	{ key: "note", label: "Note", title: "Insert a note (banner or step footnote)" },
];

export default function RecipeEditor({ text, onChange, errors, readOnly = false }: RecipeEditorProps) {
	const ref = useRef<HTMLTextAreaElement>(null);
	const [showCheatSheet, setShowCheatSheet] = useState(false);

	/** Insert at the start of the next line after the caret so templates always land on their own lines. */
	const insert = (template: string) => {
		const ta = ref.current;
		const caret = ta?.selectionEnd ?? text.length;
		let at = text.indexOf("\n", caret);
		at = at === -1 ? text.length : at + 1;
		const needsNewline = at === text.length && text.length > 0 && !text.endsWith("\n");
		const next = text.slice(0, at) + (needsNewline ? "\n" : "") + template + text.slice(at);
		onChange(next);
		requestAnimationFrame(() => {
			if (!ta) return;
			ta.focus();
			const pos = at + (needsNewline ? 1 : 0) + template.trimStart().length - 1;
			ta.setSelectionRange(pos, pos);
		});
	};

	const jumpToLine = (line: number) => {
		const ta = ref.current;
		if (!ta) return;
		const lines = text.split("\n");
		const start = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
		const end = start + (lines[line - 1]?.length ?? 0);
		ta.focus();
		ta.setSelectionRange(start, end);
		const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
		ta.scrollTop = Math.max(0, (line - 3) * lineHeight);
	};

	return (
		<div className={styles.editor}>
			<div className={styles.editorToolbar}>
				{TOOLBAR.map((b) => (
					<button key={b.key} type="button" className={styles.chip} onClick={() => insert(INSERT_TEMPLATES[b.key])} title={b.title} disabled={readOnly}>
						{b.label}
					</button>
				))}
				<button type="button" className={`${styles.chip} ${styles.chipGhost}`} onClick={() => setShowCheatSheet((v) => !v)} aria-expanded={showCheatSheet}>
					{showCheatSheet ? "Hide syntax" : "Syntax"}
				</button>
			</div>

			{showCheatSheet && (
				<dl className={styles.cheatSheet}>
					{CHEAT_SHEET.map((c) => (
						<div key={c.rule}>
							<dt>{c.rule}</dt>
							<dd>
								<pre>{c.example}</pre>
							</dd>
						</div>
					))}
				</dl>
			)}

			<label htmlFor="recipe-text" className="sr-only">
				Recipe text
			</label>
			<textarea
				id="recipe-text"
				ref={ref}
				value={text}
				onChange={(e) => onChange(e.target.value)}
				className={styles.textarea}
				spellCheck={false}
				readOnly={readOnly}
				placeholder={"# Title\nserves: 2\n\nfry 2 min\n- olive oil: 2 tbsp"}
			/>

			{errors.length > 0 && (
				<ul className={styles.errorList} aria-label="Recipe problems">
					{errors.map((e, i) => (
						<li key={i}>
							<button type="button" className={styles.errorLink} onClick={() => jumpToLine(e.line)}>
								Line {e.line}
							</button>{" "}
							{e.message}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
