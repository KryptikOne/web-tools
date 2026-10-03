"use client";

import { useRef, useState } from "react";
import { ArrowDownTrayIcon, ArrowUpTrayIcon, LinkIcon, PrinterIcon, ClipboardDocumentIcon, CheckIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import { downloadTextFile } from "@/lib/downloadUtils";
import { encodeShare, toHtml, toMarkdown, SHARE_PARAM, type Recipe, type RecipeView, type UnitMode } from "@/lib/recipeUtils";
import styles from "./RecipeTablePage.module.scss";

interface RecipeToolbarProps {
	recipe: Recipe;
	text: string;
	view: RecipeView;
	onViewChange: (view: RecipeView) => void;
	onImport: (texts: string[]) => void;
	notebookText: () => string;
}

function slug(title: string): string {
	return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "recipe";
}

export default function RecipeToolbar({ recipe, text, view, onViewChange, onImport, notebookText }: RecipeToolbarProps) {
	const { copy, isCopied } = useClipboard();
	const fileRef = useRef<HTMLInputElement>(null);
	const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");

	const baseServes = recipe.serves ?? 1;
	const serves = view.serves ?? baseServes;
	const setServes = (n: number) => onViewChange({ ...view, serves: Math.max(1, n) === baseServes ? null : Math.max(1, n) });

	const copyHtml = async () => {
		const html = toHtml(recipe, view);
		try {
			if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
				await navigator.clipboard.write([
					new ClipboardItem({
						"text/html": new Blob([html], { type: "text/html" }),
						"text/plain": new Blob([toMarkdown(recipe, view)], { type: "text/plain" }),
					}),
				]);
				await copy(" ", "html"); // flash the copied state without overwriting the rich clipboard
				return;
			}
		} catch {
			/* fall through to plain text */
		}
		await copy(html, "html");
	};

	const share = async () => {
		try {
			const token = await encodeShare(text);
			const url = `${window.location.origin}${window.location.pathname}#${SHARE_PARAM}=${token}`;
			await navigator.clipboard.writeText(url);
			setShareState("copied");
		} catch {
			setShareState("failed");
		}
		window.setTimeout(() => setShareState("idle"), 2500);
	};

	const importFiles = async (files: FileList | null) => {
		if (!files?.length) return;
		const texts: string[] = [];
		for (const file of Array.from(files)) {
			const content = await file.text();
			texts.push(...content.split(/^\s*---\s*$/m));
		}
		onImport(texts);
	};

	return (
		<div className={styles.toolbar}>
			<div className={styles.toolbarGroup} role="group" aria-label="Servings">
				<span className={styles.toolbarLabel}>Serves</span>
				<button type="button" className={styles.stepBtn} onClick={() => setServes(serves - 1)} aria-label="Fewer servings" disabled={serves <= 1}>
					<MinusIcon className="w-4 h-4" />
				</button>
				<label htmlFor="recipe-serves" className="sr-only">
					Servings
				</label>
				<input
					id="recipe-serves"
					type="number"
					min={1}
					value={serves}
					onChange={(e) => setServes(Number(e.target.value) || 1)}
					className={styles.servesInput}
				/>
				<button type="button" className={styles.stepBtn} onClick={() => setServes(serves + 1)} aria-label="More servings">
					<PlusIcon className="w-4 h-4" />
				</button>
				{view.serves !== null && (
					<button type="button" className={styles.linkBtn} onClick={() => onViewChange({ ...view, serves: null })}>
						reset
					</button>
				)}
			</div>

			<SegmentedControl<UnitMode>
				label="Units"
				size="sm"
				fill={false}
				value={view.unitMode}
				onChange={(unitMode) => onViewChange({ ...view, unitMode })}
				options={[
					{ value: "written", label: "Written" },
					{ value: "metric", label: "Metric" },
					{ value: "imperial", label: "Imperial" },
				]}
			/>

			<div className={styles.toolbarGroup}>
				<button type="button" className={styles.toolBtn} onClick={copyHtml} title="Copy as HTML for editors and email">
					{isCopied("html") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
					HTML
				</button>
				<button type="button" className={styles.toolBtn} onClick={() => copy(toMarkdown(recipe, view), "md")} title="Copy as Markdown">
					{isCopied("md") ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
					Markdown
				</button>
				<button type="button" className={styles.toolBtn} onClick={() => window.print()} title="Print or save as PDF">
					<PrinterIcon className="w-4 h-4" />
					Print
				</button>
				<button type="button" className={styles.toolBtn} onClick={share} title="Copy a link that carries this recipe">
					{shareState === "copied" ? <CheckIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
					{shareState === "copied" ? "Link copied" : shareState === "failed" ? "Couldn't copy" : "Share"}
				</button>
				<button type="button" className={styles.toolBtn} onClick={() => downloadTextFile(`${slug(recipe.title)}.txt`, text)} title="Download this recipe as text">
					<ArrowDownTrayIcon className="w-4 h-4" />
					Export
				</button>
				<button type="button" className={styles.toolBtn} onClick={() => downloadTextFile("recipes.txt", notebookText())} title="Download every recipe in one file">
					<ArrowDownTrayIcon className="w-4 h-4" />
					Notebook
				</button>
				<button type="button" className={styles.toolBtn} onClick={() => fileRef.current?.click()} title="Import recipe text files">
					<ArrowUpTrayIcon className="w-4 h-4" />
					Import
				</button>
				<input
					ref={fileRef}
					type="file"
					accept=".txt,.md,text/plain"
					multiple
					className="sr-only"
					aria-label="Import recipe files"
					onChange={(e) => {
						void importFiles(e.target.files);
						e.target.value = "";
					}}
				/>
			</div>
		</div>
	);
}
