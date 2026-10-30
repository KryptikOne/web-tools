"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import styles from "./InvisibleCharacterRemover.module.scss";

interface Stats {
  removed: number;
  categories: Record<string, number>;
}

export default function InvisibleCharacterRemover() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [stats, setStats] = useState<Stats>({ removed: 0, categories: {} });
  const [copied, setCopied] = useState(false);
  const [showInvisible, setShowInvisible] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Comprehensive list of invisible and problematic Unicode characters
  const invisibleChars: Record<string, string> = {
    // Zero-width characters
    "\u200B": "Zero Width Space",
    "\u200C": "Zero Width Non-Joiner",
    "\u200D": "Zero Width Joiner",
    "\uFEFF": "Zero Width No-Break Space (BOM)",

    // Format characters
    "\u200E": "Left-to-Right Mark",
    "\u200F": "Right-to-Left Mark",
    "\u202A": "Left-to-Right Embedding",
    "\u202B": "Right-to-Left Embedding",
    "\u202C": "Pop Directional Formatting",
    "\u202D": "Left-to-Right Override",
    "\u202E": "Right-to-Left Override",
    "\u2066": "Left-to-Right Isolate",
    "\u2067": "Right-to-Left Isolate",
    "\u2068": "First Strong Isolate",
    "\u2069": "Pop Directional Isolate",

    // Other invisible characters
    "\u00AD": "Soft Hyphen",
    "\u034F": "Combining Grapheme Joiner",
    "\u061C": "Arabic Letter Mark",
    "\u115F": "Hangul Choseong Filler",
    "\u1160": "Hangul Jungseong Filler",
    "\u17B4": "Khmer Vowel Inherent Aq",
    "\u17B5": "Khmer Vowel Inherent Aa",
    "\u180E": "Mongolian Vowel Separator",
    "\u2060": "Word Joiner",
    "\u2061": "Function Application",
    "\u2062": "Invisible Times",
    "\u2063": "Invisible Separator",
    "\u2064": "Invisible Plus",
    "\u206A": "Inhibit Symmetric Swapping",
    "\u206B": "Activate Symmetric Swapping",
    "\u206C": "Inhibit Arabic Form Shaping",
    "\u206D": "Activate Arabic Form Shaping",
    "\u206E": "National Digit Shapes",
    "\u206F": "Nominal Digit Shapes",
    "\u3164": "Hangul Filler",
    "\uFFA0": "Halfwidth Hangul Filler",
  };

  // Generate highlighted version showing invisible characters
  const highlightedText = useMemo(() => {
    if (!inputText || !showInvisible) return null;

    const replacements: Array<{
      index: number;
      char: string;
      name: string;
      length: number;
    }> = [];

    // Collect all invisible characters and their positions
    Object.entries(invisibleChars).forEach(([char, name]) => {
      let index = 0;
      while ((index = inputText.indexOf(char, index)) !== -1) {
        replacements.push({
          index: index,
          char: char,
          name: name,
          length: 1,
        });
        index++;
      }
    });

    // Also find control characters
    for (let i = 0; i < inputText.length; i++) {
      const code = inputText.charCodeAt(i);
      // Control characters except newline, carriage return, and tab
      if (
        (code >= 0x00 && code <= 0x08) ||
        (code >= 0x0b && code <= 0x0c) ||
        (code >= 0x0e && code <= 0x1f)
      ) {
        replacements.push({
          index: i,
          char: inputText[i],
          name: `Control (U+${code.toString(16).padStart(4, "0").toUpperCase()})`,
          length: 1,
        });
      }
    }

    if (replacements.length === 0) return null;

    // Sort by index
    replacements.sort((a, b) => a.index - b.index);

    // Build highlighted HTML
    let result = "";
    let lastIndex = 0;

    replacements.forEach((rep) => {
      // Add text before this invisible character (HTML escaped)
      const textBefore = inputText.substring(lastIndex, rep.index);
      result += textBefore
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

      // Add the marker for the invisible character
      const shortName = rep.name.split(" ")[0];
      result += `<span class="${styles.invisibleMarker}" title="${rep.name.replace(/"/g, "&quot;")}">[${shortName}]</span>`;

      lastIndex = rep.index + rep.length;
    });

    // Add remaining text after last invisible character
    const textAfter = inputText.substring(lastIndex);
    result += textAfter
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    return result;
  }, [inputText, showInvisible, invisibleChars]);

  const cleanText = useCallback(
    (text: string) => {
      if (!text) {
        setOutputText("");
        setStats({ removed: 0, categories: {} });
        return;
      }

      let cleaned = text;
      let removedCount = 0;
      const categoryCounts: Record<string, number> = {};

      // Remove each invisible character type
      Object.entries(invisibleChars).forEach(([char, name]) => {
        const matches = (cleaned.match(new RegExp(char, "g")) || []).length;
        if (matches > 0) {
          removedCount += matches;
          categoryCounts[name] = matches;
          cleaned = cleaned.replaceAll(char, "");
        }
      });

      // Also remove other control characters (U+0000 to U+001F except newlines and tabs)
      const controlChars = cleaned.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g);
      if (controlChars) {
        const controlCount = controlChars.length;
        removedCount += controlCount;
        categoryCounts["Control Characters"] = controlCount;
        cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
      }

      setOutputText(cleaned);
      setStats({ removed: removedCount, categories: categoryCounts });
    },
    [invisibleChars]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    cleanText(text);
  };


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
    setInputText("");
    setOutputText("");
    setStats({ removed: 0, categories: {} });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
        cleanText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned-text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <div className={`mb-6 ${styles.grid}`}>
        {/* Input Panel */}
        <div className={styles.glassCard}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Input</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowInvisible(!showInvisible)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${styles.btnSecondary} ${showInvisible ? styles.active : ""}`}
                title="Toggle visibility of invisible characters"
              >
                {showInvisible ? <EyeIcon className={styles.copyIcon} /> : <EyeSlashIcon className={styles.copyIcon} />}
                {showInvisible ? "Showing" : "Show"}
              </button>
              <label className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${styles.btnSecondary}`}>
                <ArrowUpTrayIcon className={styles.copyIcon} />
                Upload
                <input
                  type="file"
                  accept=".txt,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.xml,.md"
                  className={styles.fileInput}
                  onChange={handleFileUpload}
                />
              </label>
              <button onClick={handleClear} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${styles.btnSecondary}`}>
                <TrashIcon className={styles.copyIcon} />
                Clear
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            placeholder="Paste your text or code here..."
            className={styles.textarea}
            spellCheck={false}
          />

          <div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
            <span>Characters: {inputText.length}</span>
            {showInvisible && stats.removed > 0 && (
              <span className={styles.warningText}>
                🔴 {stats.removed} invisible character{stats.removed !== 1 ? "s" : ""} detected
              </span>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className={styles.glassCard}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>Cleaned Output</h3>
            <div className="flex gap-2 flex-wrap">
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
              <button
                onClick={handleDownload}
                disabled={!outputText}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${styles.btnSecondary}`}
              >
                <ArrowDownTrayIcon className={styles.copyIcon} />
                Download
              </button>
            </div>
          </div>

          <textarea
            value={outputText}
            readOnly
            placeholder="Cleaned text will appear here..."
            className={`${styles.textarea} ${styles.readOnly}`}
            spellCheck={false}
          />

          <div className={`flex justify-between items-center mt-3 text-xs ${styles.cardFooter}`}>
            <span>Characters: {outputText.length}</span>
          </div>
        </div>
      </div>


      {/* Preview Panel - Shows highlighted invisible characters */}
      {showInvisible && stats.removed > 0 && highlightedText && (
        <div className={`${styles.glassCard} ${styles.previewCard}`}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>📍 Invisible Characters Preview</h3>
            <span className={styles.warningText}>
              {stats.removed} invisible character{stats.removed !== 1 ? "s" : ""} highlighted below
            </span>
          </div>
          <p className={`mb-4 text-sm ${styles.hint}`}>
            Red tags show the location and type of invisible characters in your input text. Hover over them for details.
          </p>
          <div
            className={`p-4 text-sm ${styles.preview}`}
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        </div>
      )}

      {/* Stats Card */}
      {stats.removed > 0 && (
        <div className={`p-6 mb-6 ${styles.statsCard}`}>
          <div className="flex justify-between items-start gap-6">
            <div>
              <h3 className={`text-base font-semibold m-0 mb-3 ${styles.statsTitle}`}>
                Removed {stats.removed} invisible character{stats.removed !== 1 ? "s" : ""}
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(stats.categories).map(([name, count]) => (
                  <div key={name} className={`text-sm ${styles.statItem}`}>
                    <span className={`font-semibold ${styles.statCount}`}>{count}×</span> {name}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-4xl">🧹</div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className={styles.glassCard}>
        <h3 className={`text-lg font-semibold m-0 mb-4 ${styles.infoTitle}`}>What gets removed?</h3>

        <div className={`p-4 mb-6 ${styles.infoBox}`}>
          <p>
            <strong>💡 Visual Mode:</strong> Click the &quot;Showing Invisible&quot; button to see invisible characters
            highlighted in red tags like <span className={styles.exampleTag}>[Zero]</span> in the preview panel below. Hover over them to see their full names!
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ${styles.infoGrid}`}>
          <div>
            <h4 className={`text-base font-semibold m-0 mb-3 ${styles.infoSubtitle}`}>Zero-Width Characters</h4>
            <ul className={styles.infoList}>
              <li>Zero Width Space</li>
              <li>Zero Width Non-Joiner</li>
              <li>Zero Width Joiner</li>
              <li>BOM (Byte Order Mark)</li>
            </ul>
          </div>
          <div>
            <h4 className={`text-base font-semibold m-0 mb-3 ${styles.infoSubtitle}`}>Directional Marks</h4>
            <ul className={styles.infoList}>
              <li>Left-to-Right Mark</li>
              <li>Right-to-Left Mark</li>
              <li>Directional Overrides</li>
              <li>Directional Isolates</li>
            </ul>
          </div>
          <div>
            <h4 className={`text-base font-semibold m-0 mb-3 ${styles.infoSubtitle}`}>Other Characters</h4>
            <ul className={styles.infoList}>
              <li>Soft Hyphen</li>
              <li>Control Characters</li>
              <li>Word Joiner</li>
              <li>Invisible Operators</li>
            </ul>
          </div>
        </div>

        <div className={`p-4 ${styles.noteBox}`}>
          <p>
            <strong>Note:</strong> This tool preserves normal whitespace like spaces, tabs, and newlines.
            It only removes invisible Unicode characters that can cause issues in code or text processing.
          </p>
        </div>
      </div>
    </div>
  );
}
