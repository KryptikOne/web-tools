"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "./HtmlTagRemover.module.scss";

interface Stats {
  tagsRemoved: number;
  charReductionPercent: number;
}

export default function HtmlTagRemover() {
  const [inputHtml, setInputHtml] = useState("");
  const [preserveLineBreaks, setPreserveLineBreaks] = useState(true);
  const [preserveLinks, setPreserveLinks] = useState(false);
  const [useAllowlist, setUseAllowlist] = useState(false);
  const [allowlistInput, setAllowlistInput] = useState("");
  const [copied, setCopied] = useState(false);

  const allowedTags = useMemo(() => {
    if (!useAllowlist || !allowlistInput.trim()) return new Set<string>();
    return new Set(
      allowlistInput
        .split(",")
        .map((t) => t.trim().toLowerCase().replace(/[<>/]/g, ""))
        .filter(Boolean)
    );
  }, [useAllowlist, allowlistInput]);

  const stripHtml = useCallback(
    (html: string): { text: string; tagsRemoved: number } => {
      if (!html.trim()) return { text: "", tagsRemoved: 0 };

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      let tagsRemoved = 0;

      function walk(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || "";
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
          return "";
        }

        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        // If allowlist mode is on, only remove tags in the allowlist
        if (useAllowlist && allowedTags.size > 0 && !allowedTags.has(tagName)) {
          // Keep this tag as-is (serialize its outer HTML without processing)
          // But still process children for any allowed tags nested inside
          const childContent = Array.from(el.childNodes).map(walk).join("");
          // Rebuild the tag with its attributes
          const attrs = Array.from(el.attributes)
            .map((a) => ` ${a.name}="${a.value}"`)
            .join("");
          const selfClosing = ["br", "hr", "img", "input", "meta", "link"].includes(tagName);
          if (selfClosing) {
            return `<${tagName}${attrs} />`;
          }
          return `<${tagName}${attrs}>${childContent}</${tagName}>`;
        }

        tagsRemoved++;

        // Handle line-break-producing elements
        if (preserveLineBreaks) {
          if (tagName === "br") {
            return "\n";
          }
          if (["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "blockquote", "section", "article", "header", "footer", "nav", "main", "aside"].includes(tagName)) {
            const childContent = Array.from(el.childNodes).map(walk).join("");
            return "\n" + childContent + "\n";
          }
        }

        // Handle links
        if (preserveLinks && tagName === "a") {
          const href = el.getAttribute("href");
          const childContent = Array.from(el.childNodes).map(walk).join("");
          if (href) {
            return `${childContent} (${href})`;
          }
          return childContent;
        }

        // For list items, add a dash prefix
        if (preserveLineBreaks && tagName === "li") {
          const childContent = Array.from(el.childNodes).map(walk).join("");
          return "\n- " + childContent;
        }

        // Default: recurse into children
        return Array.from(el.childNodes).map(walk).join("");
      }

      let result = Array.from(doc.body.childNodes).map(walk).join("");

      // Clean up excessive newlines
      result = result.replace(/\n{3,}/g, "\n\n").trim();

      return { text: result, tagsRemoved };
    },
    [preserveLineBreaks, preserveLinks, useAllowlist, allowedTags]
  );

  const { outputText, stats } = useMemo(() => {
    if (!inputHtml.trim()) {
      return {
        outputText: "",
        stats: { tagsRemoved: 0, charReductionPercent: 0 },
      };
    }
    const { text, tagsRemoved } = stripHtml(inputHtml);
    const originalLen = inputHtml.length;
    const newLen = text.length;
    const charReductionPercent =
      originalLen > 0
        ? Math.round(((originalLen - newLen) / originalLen) * 100)
        : 0;
    return {
      outputText: text,
      stats: { tagsRemoved, charReductionPercent },
    };
  }, [inputHtml, stripHtml]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClear = () => {
    setInputHtml("");
  };

  return (
    <div className={styles.container}>
      {/* Options Bar */}
      <div className={`flex flex-wrap items-center gap-6 p-4 mb-6 ${styles.optionsBar}`}>
        <label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
          <input
            type="checkbox"
            checked={preserveLineBreaks}
            onChange={(e) => setPreserveLineBreaks(e.target.checked)}
            className={styles.checkbox}
          />
          Preserve line breaks
        </label>
        <label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
          <input
            type="checkbox"
            checked={preserveLinks}
            onChange={(e) => setPreserveLinks(e.target.checked)}
            className={styles.checkbox}
          />
          Preserve links
        </label>
        <label className={`flex items-center gap-2 text-sm cursor-pointer ${styles.checkboxLabel}`}>
          <input
            type="checkbox"
            checked={useAllowlist}
            onChange={(e) => setUseAllowlist(e.target.checked)}
            className={styles.checkbox}
          />
          Remove specific tags only
        </label>
        {useAllowlist && (
          <input
            type="text"
            value={allowlistInput}
            onChange={(e) => setAllowlistInput(e.target.value)}
            placeholder="e.g. script, style, iframe"
            className={`px-3 py-1.5 text-sm ${styles.allowlistInput}`}
          />
        )}
      </div>

      {/* Main Grid */}
      <div className={`mb-6 ${styles.grid}`}>
        {/* Input Panel */}
        <div className={styles.glassCard}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h3 className={`text-lg font-semibold m-0 ${styles.sectionTitle}`}>HTML Input</h3>
            <button
              onClick={handleClear}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${styles.btnSecondary}`}
            >
              <TrashIcon className={styles.copyIcon} />
              Clear
            </button>
          </div>

          <textarea
            value={inputHtml}
            onChange={(e) => setInputHtml(e.target.value)}
            placeholder="Paste your HTML here..."
            className={styles.textarea}
            spellCheck={false}
          />

          <div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
            <span>Characters: {inputHtml.length}</span>
          </div>
        </div>

        {/* Output Panel */}
        <div className={styles.glassCard}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h3 className={`text-lg font-semibold m-0 ${styles.sectionTitle}`}>Stripped Text</h3>
            <button
              onClick={handleCopy}
              disabled={!outputText}
              className={`px-4 py-2 text-sm ${styles.btnPrimary}`}
            >
              {copied ? (
                <>
                  <CheckIcon className={styles.copyIcon} />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className={styles.copyIcon} />
                  Copy
                </>
              )}
            </button>
          </div>

          <textarea
            value={outputText}
            readOnly
            placeholder="Stripped text will appear here..."
            className={`${styles.textarea} ${styles.readOnly}`}
            spellCheck={false}
          />

          <div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
            <span>Characters: {outputText.length}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {inputHtml.trim() && (
        <div className={`flex flex-wrap gap-6 p-5 mb-6 ${styles.statsBar}`}>
          <div className={`flex flex-col items-center ${styles.statBlock}`}>
            <span className={`text-2xl font-bold ${styles.statValue}`}>{stats.tagsRemoved}</span>
            <span className={`text-xs ${styles.statLabel}`}>Tags Removed</span>
          </div>
          <div className={`flex flex-col items-center ${styles.statBlock}`}>
            <span className={`text-2xl font-bold ${styles.statValue}`}>{stats.charReductionPercent}%</span>
            <span className={`text-xs ${styles.statLabel}`}>Size Reduction</span>
          </div>
          <div className={`flex flex-col items-center ${styles.statBlock}`}>
            <span className={`text-2xl font-bold ${styles.statValue}`}>{inputHtml.length}</span>
            <span className={`text-xs ${styles.statLabel}`}>Original Chars</span>
          </div>
          <div className={`flex flex-col items-center ${styles.statBlock}`}>
            <span className={`text-2xl font-bold ${styles.statValue}`}>{outputText.length}</span>
            <span className={`text-xs ${styles.statLabel}`}>Output Chars</span>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className={styles.glassCard}>
        <h3 className={`text-lg font-semibold m-0 mb-4 ${styles.sectionTitle}`}>How it works</h3>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${styles.infoGrid}`}>
          <div>
            <h4 className={`text-sm font-semibold mb-2 ${styles.infoSubtitle}`}>Safe Parsing</h4>
            <p className={`text-sm ${styles.infoText}`}>
              Uses the browser&apos;s built-in DOMParser for safe, accurate HTML parsing instead of fragile regex patterns.
            </p>
          </div>
          <div>
            <h4 className={`text-sm font-semibold mb-2 ${styles.infoSubtitle}`}>Preserve Structure</h4>
            <p className={`text-sm ${styles.infoText}`}>
              Optionally converts block elements and &lt;br&gt; tags to newlines, and keeps link URLs alongside their text.
            </p>
          </div>
          <div>
            <h4 className={`text-sm font-semibold mb-2 ${styles.infoSubtitle}`}>Selective Removal</h4>
            <p className={`text-sm ${styles.infoText}`}>
              Use the allowlist to target specific tags like script, style, or iframe while keeping everything else intact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
