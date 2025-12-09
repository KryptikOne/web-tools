'use client';

import { useState, useCallback } from 'react';
import { ClipboardDocumentIcon, CheckIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import styles from './PxRemCalculator.module.scss';

const COMMON_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];

export default function PxRemCalculator() {
  const [pxValue, setPxValue] = useState<string>('16');
  const [remValue, setRemValue] = useState<string>('1');
  const [baseSize, setBaseSize] = useState<number>(16);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pxToRem = useCallback((px: number, base: number): number => {
    return px / base;
  }, []);

  const remToPx = useCallback((rem: number, base: number): number => {
    return rem * base;
  }, []);

  const handlePxChange = (value: string) => {
    setPxValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const rem = pxToRem(numValue, baseSize);
      setRemValue(formatNumber(rem));
    } else if (value === '' || value === '-') {
      setRemValue('');
    }
  };

  const handleRemChange = (value: string) => {
    setRemValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const px = remToPx(numValue, baseSize);
      setPxValue(formatNumber(px));
    } else if (value === '' || value === '-') {
      setPxValue('');
    }
  };

  const handleBaseSizeChange = (newBase: number) => {
    setBaseSize(newBase);
    const numPx = parseFloat(pxValue);
    if (!isNaN(numPx)) {
      const rem = pxToRem(numPx, newBase);
      setRemValue(formatNumber(rem));
    }
  };

  const formatNumber = (num: number): string => {
    // Round to 4 decimal places and remove trailing zeros
    const rounded = Math.round(num * 10000) / 10000;
    return rounded.toString();
  };

  const copyToClipboard = async (value: string, unit: string, field: string) => {
    try {
      await navigator.clipboard.writeText(`${value}${unit}`);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleQuickConvert = (px: number) => {
    setPxValue(px.toString());
    const rem = pxToRem(px, baseSize);
    setRemValue(formatNumber(rem));
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainSection}>
        <div className={styles.glassCard}>
          <h2 className={styles.sectionTitle}>Convert</h2>

          <div className={styles.converterGrid}>
            {/* PX Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Pixels (px)</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  value={pxValue}
                  onChange={(e) => handlePxChange(e.target.value)}
                  className={styles.input}
                  placeholder="Enter pixels"
                />
                <span className={styles.unitLabel}>px</span>
                <button
                  className={styles.copyBtn}
                  onClick={() => copyToClipboard(pxValue, 'px', 'px')}
                  title="Copy px value"
                >
                  {copiedField === 'px' ? (
                    <CheckIcon className={styles.copyIcon} />
                  ) : (
                    <ClipboardDocumentIcon className={styles.copyIcon} />
                  )}
                </button>
              </div>
            </div>

            {/* Arrow Icon */}
            <div className={styles.arrowContainer}>
              <ArrowsRightLeftIcon className={styles.arrowIcon} />
            </div>

            {/* REM Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Root EM (rem)</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  value={remValue}
                  onChange={(e) => handleRemChange(e.target.value)}
                  className={styles.input}
                  placeholder="Enter rem"
                  step="0.0625"
                />
                <span className={styles.unitLabel}>rem</span>
                <button
                  className={styles.copyBtn}
                  onClick={() => copyToClipboard(remValue, 'rem', 'rem')}
                  title="Copy rem value"
                >
                  {copiedField === 'rem' ? (
                    <CheckIcon className={styles.copyIcon} />
                  ) : (
                    <ClipboardDocumentIcon className={styles.copyIcon} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Base Size Setting */}
          <div className={styles.baseSizeSection}>
            <label className={styles.baseSizeLabel}>
              Base Font Size: <span className={styles.baseSizeValue}>{baseSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={baseSize}
              onChange={(e) => handleBaseSizeChange(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderMarks}>
              <span>10px</span>
              <span>16px</span>
              <span>24px</span>
            </div>
          </div>
        </div>

        {/* Quick Convert */}
        <div className={styles.glassCard}>
          <h2 className={styles.sectionTitle}>Quick Convert</h2>
          <div className={styles.quickGrid}>
            {COMMON_SIZES.map((size) => (
              <button
                key={size}
                className={`${styles.quickBtn} ${pxValue === size.toString() ? styles.active : ''}`}
                onClick={() => handleQuickConvert(size)}
              >
                <span className={styles.quickPx}>{size}px</span>
                <span className={styles.quickRem}>{formatNumber(pxToRem(size, baseSize))}rem</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reference Table */}
      <div className={styles.glassCard}>
        <h2 className={styles.sectionTitle}>Reference Table</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pixels</th>
                <th>REM</th>
                <th>EM</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {COMMON_SIZES.map((px) => (
                <tr
                  key={px}
                  className={pxValue === px.toString() ? styles.activeRow : ''}
                  onClick={() => handleQuickConvert(px)}
                >
                  <td>{px}px</td>
                  <td>{formatNumber(pxToRem(px, baseSize))}rem</td>
                  <td>{formatNumber(pxToRem(px, baseSize))}em</td>
                  <td>{formatNumber(px * 0.75)}pt</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Section */}
      <div className={styles.glassCard}>
        <h2 className={styles.sectionTitle}>About PX and REM</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <h3 className={styles.infoSubtitle}>What is PX?</h3>
            <p className={styles.infoText}>
              Pixels (px) are absolute units that represent a fixed size on screen.
              They don&apos;t scale with user preferences, making them less accessible
              but more predictable for fixed layouts.
            </p>
          </div>
          <div className={styles.infoItem}>
            <h3 className={styles.infoSubtitle}>What is REM?</h3>
            <p className={styles.infoText}>
              REM (root em) units are relative to the root element&apos;s font size
              (typically 16px by default). They scale with user preferences,
              making your design more accessible and responsive.
            </p>
          </div>
          <div className={styles.infoItem}>
            <h3 className={styles.infoSubtitle}>Formula</h3>
            <p className={styles.infoText}>
              <code className={styles.formula}>rem = px / base-font-size</code>
              <br />
              <code className={styles.formula}>px = rem × base-font-size</code>
            </p>
          </div>
          <div className={styles.infoItem}>
            <h3 className={styles.infoSubtitle}>When to Use</h3>
            <p className={styles.infoText}>
              Use REM for font sizes, spacing, and most layout properties.
              Use PX for borders, shadows, and elements that shouldn&apos;t scale
              with user font preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
