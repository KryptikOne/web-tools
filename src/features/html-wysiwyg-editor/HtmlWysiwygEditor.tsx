"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	ClipboardDocumentIcon,
	CheckIcon,
	TrashIcon,
	BoldIcon,
	ItalicIcon,
	CodeBracketIcon,
	ListBulletIcon,
	NumberedListIcon,
	ChatBubbleLeftRightIcon,
	MinusIcon,
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import styles from "./HtmlWysiwygEditor.module.scss";
import { useClipboard } from "@/hooks/useClipboard";

const DEFAULT_HTML =
	"<h1>Hello, world</h1><p>Try editing this content, then switch over to the <strong>HTML source</strong> pane.</p><ul><li>Lists</li><li>Headings</li><li>Blockquotes</li></ul>";

interface ToolbarButtonProps {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	label: string;
	children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, label, children }: ToolbarButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`${styles.tbBtn} ${active ? styles.tbBtnActive : ""}`}
			title={label}
			aria-label={label}
			aria-pressed={active}
		>
			{children}
		</button>
	);
}

interface ToolbarProps {
	editor: Editor;
}

function Toolbar({ editor }: ToolbarProps) {
	return (
		<div className={styles.toolbar} role="toolbar" aria-label="Editor formatting">
			<div className={styles.tbGroup}>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive("bold")}
					label="Bold"
				>
					<BoldIcon className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive("italic")}
					label="Italic"
				>
					<ItalicIcon className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleStrike().run()}
					active={editor.isActive("strike")}
					label="Strikethrough"
				>
					<span className={styles.tbStrike}>S</span>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleCode().run()}
					active={editor.isActive("code")}
					label="Inline code"
				>
					<CodeBracketIcon className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<div className={styles.tbDivider} aria-hidden="true" />

			<div className={styles.tbGroup}>
				<ToolbarButton
					onClick={() => editor.chain().focus().setParagraph().run()}
					active={editor.isActive("paragraph")}
					label="Paragraph"
				>
					<span className={styles.tbText}>P</span>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					active={editor.isActive("heading", { level: 1 })}
					label="Heading 1"
				>
					<span className={styles.tbText}>H1</span>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					active={editor.isActive("heading", { level: 2 })}
					label="Heading 2"
				>
					<span className={styles.tbText}>H2</span>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					active={editor.isActive("heading", { level: 3 })}
					label="Heading 3"
				>
					<span className={styles.tbText}>H3</span>
				</ToolbarButton>
			</div>

			<div className={styles.tbDivider} aria-hidden="true" />

			<div className={styles.tbGroup}>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive("bulletList")}
					label="Bullet list"
				>
					<ListBulletIcon className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive("orderedList")}
					label="Ordered list"
				>
					<NumberedListIcon className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					active={editor.isActive("blockquote")}
					label="Blockquote"
				>
					<ChatBubbleLeftRightIcon className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
					active={editor.isActive("codeBlock")}
					label="Code block"
				>
					<span className={styles.tbText}>{"</>"}</span>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
					label="Horizontal rule"
				>
					<MinusIcon className="w-4 h-4" />
				</ToolbarButton>
			</div>

			<div className={styles.tbDivider} aria-hidden="true" />

			<div className={styles.tbGroup}>
				<ToolbarButton
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().chain().focus().undo().run()}
					label="Undo"
				>
					<ArrowUturnLeftIcon className="w-4 h-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().chain().focus().redo().run()}
					label="Redo"
				>
					<ArrowUturnRightIcon className="w-4 h-4" />
				</ToolbarButton>
			</div>
		</div>
	);
}

export default function HtmlWysiwygEditor() {
	const [html, setHtml] = useState(DEFAULT_HTML);
	const { copy, isCopied } = useClipboard();
	// Track which side initiated the last change so we don't fight ourselves.
	const sourceRef = useRef<"editor" | "html" | null>(null);

	const editor = useEditor({
		extensions: [StarterKit],
		content: DEFAULT_HTML,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: styles.proseRoot,
				role: "textbox",
				"aria-label": "Rich text editor",
				"aria-multiline": "true",
			},
		},
		onUpdate: ({ editor }) => {
			sourceRef.current = "editor";
			setHtml(editor.getHTML());
		},
	});

	// Push HTML edits back into the editor when the source pane is the origin.
	useEffect(() => {
		if (!editor) return;
		if (sourceRef.current !== "html") return;
		if (editor.getHTML() === html) return;
		editor.commands.setContent(html, { emitUpdate: false });
	}, [editor, html]);

	const handleHtmlChange = useCallback((value: string) => {
		sourceRef.current = "html";
		setHtml(value);
	}, []);

	const handleClear = useCallback(() => {
		if (!editor) return;
		sourceRef.current = "editor";
		editor.commands.clearContent(true);
		setHtml("");
	}, [editor]);

	return (
		<div className={styles.container}>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-3 flex-wrap gap-2">
						<h3 className={`text-base font-semibold m-0 ${styles.cardTitle}`}>
							Visual editor
						</h3>
						<button
							type="button"
							onClick={handleClear}
							className={styles.btnSecondary}
							disabled={!editor || editor.isEmpty}
						>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>

					{editor && <Toolbar editor={editor} />}

					<div className={styles.editorWrap}>
						<EditorContent editor={editor} />
					</div>
				</div>

				<div className={styles.glassCard}>
					<div className="flex items-center justify-between mb-3 flex-wrap gap-2">
						<div>
							<h3 className={`text-base font-semibold m-0 ${styles.cardTitle}`}>
								HTML source
							</h3>
							<p className={`text-xs mt-1 m-0 ${styles.cardSubtitle}`}>
								Edits here update the visual editor live.
							</p>
						</div>
						<button
							type="button"
							onClick={() => copy(html, "html-source")}
							className={`${styles.btnPrimary} ${
								isCopied("html-source") ? styles.copied : ""
							}`}
							disabled={!html}
						>
							{isCopied("html-source") ? (
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

					<label htmlFor="wysiwyg-html-source" className="sr-only">
						HTML source
					</label>
					<textarea
						id="wysiwyg-html-source"
						value={html}
						onChange={(e) => handleHtmlChange(e.target.value)}
						placeholder="<p>Edit HTML here...</p>"
						className={styles.textarea}
						spellCheck={false}
					/>

					<div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
						<span>{html.length} characters</span>
					</div>
				</div>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					About this editor
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					Built on Tiptap (ProseMirror) with the StarterKit extension. Both panes are
					kept in sync: edits in the visual editor regenerate the HTML, and edits in
					the source pane re-render the editor. Tiptap parses incoming HTML through
					ProseMirror&apos;s schema, which strips anything that isn&apos;t part of the configured
					document model — including <code>&lt;script&gt;</code> tags and inline event
					handlers — so the preview is safe to render even when the source is hand-edited.
				</p>
			</div>
		</div>
	);
}
