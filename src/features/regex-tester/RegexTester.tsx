"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./RegexTester.module.scss";

// --- Types ---

interface RegexMatch {
  fullMatch: string;
  groups: (string | undefined)[];
  namedGroups: Record<string, string> | undefined;
  index: number;
  length: number;
}

interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  description: string;
}

// --- Presets ---

const REGEX_PRESETS: RegexPreset[] = [
  {
    name: "Email",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    description: "Match email addresses",
  },
  {
    name: "URL",
    pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+",
    flags: "gi",
    description: "Match HTTP/HTTPS URLs",
  },
  {
    name: "Phone (US)",
    pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}",
    flags: "g",
    description: "Match US phone numbers",
  },
  {
    name: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
    flags: "g",
    description: "Match IPv4 addresses",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])",
    flags: "g",
    description: "Match ISO date format",
  },
  {
    name: "Hex Color",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    flags: "gi",
    description: "Match hex color codes",
  },
  {
    name: "HTML Tag",
    pattern: "<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s[^>]*)?\\/?>",
    flags: "g",
    description: "Match HTML tags",
  },
  {
    name: "Digits Only",
    pattern: "\\d+",
    flags: "g",
    description: "Match sequences of digits",
  },
  {
    name: "Words",
    pattern: "\\b[a-zA-Z]+\\b",
    flags: "g",
    description: "Match individual words",
  },
  {
    name: "Whitespace",
    pattern: "\\s+",
    flags: "g",
    description: "Match whitespace sequences",
  },
];

// --- Flag definitions ---

interface FlagDef {
  flag: string;
  label: string;
  title: string;
}

const FLAG_DEFS: FlagDef[] = [
  { flag: "g", label: "g", title: "Global - find all matches" },
  { flag: "i", label: "i", title: "Case Insensitive" },
  { flag: "m", label: "m", title: "Multiline - ^ and $ match line boundaries" },
  { flag: "s", label: "s", title: "DotAll - . matches newlines" },
  { flag: "u", label: "u", title: "Unicode - enable Unicode features" },
];

// --- Component ---

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [replaceInput, setReplaceInput] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Toggle a flag character on/off
  const toggleFlag = useCallback(
    (flag: string) => {
      setFlags((prev) =>
        prev.includes(flag) ? prev.replace(flag, "") : prev + flag
      );
    },
    []
  );

  // Apply a preset
  const applyPreset = useCallback((preset: RegexPreset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
  }, []);

  // Reset all fields
  const handleReset = useCallback(() => {
    setPattern("");
    setFlags("g");
    setTestString("");
    setReplaceInput("");
  }, []);

  // Build regex and compute matches
  const { regex, error, matches } = useMemo(() => {
    if (!pattern) {
      return { regex: null, error: null, matches: [] as RegexMatch[] };
    }

    try {
      const re = new RegExp(pattern, flags);
      const results: RegexMatch[] = [];

      if (!testString) {
        return { regex: re, error: null, matches: [] as RegexMatch[] };
      }

      // Use matchAll for global, exec for non-global
      if (flags.includes("g")) {
        const iterator = testString.matchAll(re);
        for (const match of iterator) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            namedGroups: match.groups as Record<string, string> | undefined,
            index: match.index ?? 0,
            length: match[0].length,
          });
        }
      } else {
        const match = re.exec(testString);
        if (match) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            namedGroups: match.groups as Record<string, string> | undefined,
            index: match.index ?? 0,
            length: match[0].length,
          });
        }
      }

      return { regex: re, error: null, matches: results };
    } catch (err) {
      return {
        regex: null,
        error: err instanceof Error ? err.message : "Invalid regex",
        matches: [] as RegexMatch[],
      };
    }
  }, [pattern, flags, testString]);

  // Replaced output
  const replacedOutput = useMemo(() => {
    if (!regex || !testString) return "";
    try {
      return testString.replace(regex, replaceInput);
    } catch {
      return "";
    }
  }, [regex, testString, replaceInput]);

  // Build highlighted test string segments
  const highlightedSegments = useMemo(() => {
    if (!matches.length || !testString) return null;

    const segments: { text: string; isMatch: boolean; matchIndex: number }[] = [];
    let lastIndex = 0;

    // Sort matches by index to be safe
    const sorted = [...matches].sort((a, b) => a.index - b.index);

    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];

      // Add text before this match
      if (m.index > lastIndex) {
        segments.push({
          text: testString.slice(lastIndex, m.index),
          isMatch: false,
          matchIndex: -1,
        });
      }

      // Add the match itself
      segments.push({
        text: m.fullMatch,
        isMatch: true,
        matchIndex: i,
      });

      lastIndex = m.index + m.length;
    }

    // Add remaining text after last match
    if (lastIndex < testString.length) {
      segments.push({
        text: testString.slice(lastIndex),
        isMatch: false,
        matchIndex: -1,
      });
    }

    return segments;
  }, [matches, testString]);

  // Clipboard helper
  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Regex Input Section */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Regular Expression</h2>
        <div className={`flex items-center gap-2 ${styles.regexInputRow}`}>
          <span className={styles.delimiter}>/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            className={`flex-1 ${styles.regexInput}`}
            spellCheck={false}
          />
          <span className={styles.delimiter}>/</span>
          <span className={`font-mono text-sm ${styles.flagsDisplay}`}>{flags || "\u00A0"}</span>
          <button onClick={handleReset} className={styles.resetBtn} title="Reset all fields">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className={`flex items-center gap-2 mt-3 ${styles.errorMessage}`}>
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Flags toggles */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={`text-sm ${styles.flagsLabel}`}>Flags:</span>
          {FLAG_DEFS.map((def) => (
            <button
              key={def.flag}
              onClick={() => toggleFlag(def.flag)}
              className={`${styles.flagToggle} ${flags.includes(def.flag) ? styles.flagActive : ""}`}
              title={def.title}
            >
              {def.label}
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Common Presets</h2>
        <div className="flex flex-wrap gap-2">
          {REGEX_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={styles.presetBtn}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Test String + Highlighted Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Test String</h2>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter text to test against the regex..."
            className={styles.textarea}
            rows={8}
            spellCheck={false}
          />
        </div>

        <div className={styles.card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              Match Highlighting
            </h2>
            {matches.length > 0 && (
              <span className={styles.matchCount}>
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>
          <div className={styles.highlightArea}>
            {highlightedSegments ? (
              <pre className={styles.highlightPre}>
                {highlightedSegments.map((seg, i) =>
                  seg.isMatch ? (
                    <mark key={i} className={styles.highlight} title={`Match #${seg.matchIndex + 1}`}>
                      {seg.text}
                    </mark>
                  ) : (
                    <Fragment key={i}>{seg.text}</Fragment>
                  )
                )}
              </pre>
            ) : (
              <pre className={styles.highlightPre}>
                <span className={styles.placeholderText}>
                  {testString || "Matches will be highlighted here..."}
                </span>
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Match Results */}
      {matches.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            Match Results ({matches.length})
          </h2>
          <div className={`flex flex-col gap-3 ${styles.matchList}`}>
            {matches.map((m, i) => (
              <div key={i} className={styles.matchItem}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className={styles.matchLabel}>Match #{i + 1}</span>
                  <button
                    onClick={() => handleCopy(m.fullMatch, `match-${i}`)}
                    className={styles.copyBtn}
                    title="Copy match"
                  >
                    {copiedField === `match-${i}` ? (
                      <CheckIcon className="w-3.5 h-3.5" />
                    ) : (
                      <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <span className={styles.detailLabel}>Value</span>
                  <code className={styles.detailValue}>{m.fullMatch}</code>
                  <span className={styles.detailLabel}>Index</span>
                  <code className={styles.detailValue}>{m.index}</code>
                  <span className={styles.detailLabel}>Length</span>
                  <code className={styles.detailValue}>{m.length}</code>
                  {m.groups.length > 0 && (
                    <>
                      <span className={styles.detailLabel}>Groups</span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.groups.map((g, gi) => (
                          <code key={gi} className={styles.groupBadge}>
                            ${gi + 1}: {g ?? "undefined"}
                          </code>
                        ))}
                      </div>
                    </>
                  )}
                  {m.namedGroups && Object.keys(m.namedGroups).length > 0 && (
                    <>
                      <span className={styles.detailLabel}>Named</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(m.namedGroups).map(([name, val]) => (
                          <code key={name} className={styles.groupBadge}>
                            {name}: {val}
                          </code>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Replace Section */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Find & Replace</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={styles.fieldLabel}>Replacement String</label>
            <input
              type="text"
              value={replaceInput}
              onChange={(e) => setReplaceInput(e.target.value)}
              placeholder="Enter replacement (supports $1, $2, etc.)"
              className={styles.inputField}
              spellCheck={false}
            />
            <span className={`text-xs ${styles.helpText}`}>
              Use $1, $2 for capture groups. $& for full match.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={styles.fieldLabel}>Replaced Output</label>
              {replacedOutput && (
                <button
                  onClick={() => handleCopy(replacedOutput, "replaced")}
                  className={styles.copyBtn}
                  title="Copy replaced output"
                >
                  {copiedField === "replaced" ? (
                    <CheckIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
            <div className={styles.outputArea}>
              <pre className={styles.outputPre}>
                {replacedOutput || (
                  <span className={styles.placeholderText}>
                    Replaced output will appear here...
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
