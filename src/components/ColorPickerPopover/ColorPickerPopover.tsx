"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { ColorPickerPanel } from "@/components/ColorPickerPanel";
import { useIsMobile } from "@/hooks/useIsMobile";
import styles from "./ColorPickerPopover.module.scss";

type HorizontalPosition = "left" | "right";
type VerticalPosition = "top" | "bottom";

export interface ColorPickerPopoverProps {
	/** Current color as hex string */
	color: string;
	/** Callback when color changes */
	onChange: (color: string) => void;
	/** Disable the picker */
	disabled?: boolean;
	/** Size of the trigger swatch. "xl" (3rem) matches a stacked label + text input beside it. */
	swatchSize?: "sm" | "md" | "lg" | "xl";
	/** Show hex value in popover (default: true) */
	showHex?: boolean;
	/** Make hex value editable as input (default: true) */
	hexEditable?: boolean;
	/** Optional className for the trigger swatch */
	className?: string;
}

// Popover dimensions (should match CSS)
const POPOVER_WIDTH = 220;
const POPOVER_HEIGHT = 320; // approximate max height
const POPOVER_GAP = 8;

/**
 * A color picker that appears as a small swatch, opening a popover
 * with the full ColorPickerPanel when clicked.
 * On mobile, falls back to native color input.
 * Automatically adjusts position to stay within viewport.
 */
export function ColorPickerPopover({
	color,
	onChange,
	disabled = false,
	swatchSize = "md",
	showHex = true,
	hexEditable = true,
	className,
}: ColorPickerPopoverProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState<{ h: HorizontalPosition; v: VerticalPosition }>({
		h: "left",
		v: "bottom",
	});
	const containerRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();

	// Calculate optimal position when popover opens
	useLayoutEffect(() => {
		if (!isOpen || !containerRef.current) return;

		const trigger = containerRef.current.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Determine horizontal position
		const spaceRight = viewportWidth - trigger.left;
		const spaceLeft = trigger.right;
		const h: HorizontalPosition = spaceRight >= POPOVER_WIDTH + POPOVER_GAP ? "left" : spaceLeft >= POPOVER_WIDTH + POPOVER_GAP ? "right" : "left";

		// Determine vertical position
		const spaceBelow = viewportHeight - trigger.bottom;
		const spaceAbove = trigger.top;
		const v: VerticalPosition = spaceBelow >= POPOVER_HEIGHT + POPOVER_GAP ? "bottom" : spaceAbove >= POPOVER_HEIGHT + POPOVER_GAP ? "top" : "bottom";

		setPosition({ h, v });
	}, [isOpen]);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	const handleSwatchClick = useCallback(() => {
		if (disabled) return;
		setIsOpen((prev) => !prev);
	}, [disabled]);

	// Loading state during SSR
	if (isMobile === null) {
		return <div className={`rounded-lg p-0 ${styles.swatch} ${styles[swatchSize]} ${className ?? ""}`} style={{ backgroundColor: color }} />;
	}

	// Mobile: use native color input styled as a swatch
	if (isMobile) {
		return (
			<div className={`relative inline-block ${className ?? ""}`}>
				<input
					type="color"
					value={color}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					className={`absolute inset-0 opacity-0 cursor-pointer w-full h-full ${styles[swatchSize]}`}
				/>
				<div className={`rounded-lg pointer-events-none ${styles.swatchOverlay} ${styles[swatchSize]}`} style={{ backgroundColor: color }} />
			</div>
		);
	}

	// Desktop: swatch with popover
	return (
		<div ref={containerRef} className={`relative inline-block ${className ?? ""}`}>
			<button
				type="button"
				className={`rounded-lg p-0 ${styles.swatch} ${styles[swatchSize]} ${disabled ? styles.disabled : ""}`}
				style={{ backgroundColor: color }}
				onClick={handleSwatchClick}
				disabled={disabled}
				aria-label="Pick color"
				aria-expanded={isOpen}
			/>

			{isOpen && (
				<div
					ref={popoverRef}
					className={`absolute w-55 p-4 rounded-xl ${styles.popover} ${styles[position.h]} ${styles[position.v]}`}
				>
					<ColorPickerPanel color={color} onChange={onChange} showHex={showHex} hexEditable={hexEditable} />
				</div>
			)}
		</div>
	);
}

export default ColorPickerPopover;
