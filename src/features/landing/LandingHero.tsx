"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAppDispatch } from "@/store/hooks";
import { hydrateTheme } from "@/store/slices/themeSlice";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { createGlyphField, type GlyphFieldHandle } from "./glyphField";
import HeroTerminal, { type HeroTerminalHandle } from "./HeroTerminal";
import { LANDING_TOOLS } from "./terminalCommands";
import styles from "./Landing.module.scss";

/**
 * Hero: the generative glyph field (canvas) behind a working terminal.
 * Owns the field engine's lifecycle and wires it to the terminal both ways.
 */
export default function LandingHero() {
	const dispatch = useAppDispatch();
	const reducedMotion = usePrefersReducedMotion();
	const heroRef = useRef<HTMLElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const wordmarkRef = useRef<HTMLDivElement>(null);
	const navRef = useRef<HTMLElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const fieldRef = useRef<GlyphFieldHandle | null>(null);
	const terminalRef = useRef<HeroTerminalHandle>(null);

	// The app shell's TopBar normally hydrates the saved theme; it doesn't render here.
	useEffect(() => {
		dispatch(hydrateTheme());
	}, [dispatch]);

	useEffect(() => {
		const hero = heroRef.current, canvas = canvasRef.current, wordmark = wordmarkRef.current;
		const nav = navRef.current, panel = panelRef.current;
		if (reducedMotion === null || !hero || !canvas || !wordmark || !nav || !panel) return;

		const field = createGlyphField({
			hero,
			canvas,
			wordmark,
			panel,
			avoid: [panel, nav],
			tools: LANDING_TOOLS,
			reducedMotion,
			onOpen: (tool) => terminalRef.current?.announceOpen(tool),
		});
		fieldRef.current = field;
		return () => {
			field.destroy();
			fieldRef.current = null;
		};
	}, [reducedMotion]);

	return (
		<section ref={heroRef} className={`relative isolate flex flex-col overflow-hidden ${styles.hero}`}>
			<canvas ref={canvasRef} className={styles.field} aria-hidden="true" />
			<nav ref={navRef} aria-label="Site" className={`flex items-center justify-end gap-6 ${styles.nav}`} data-field-ignore>
				<span className={styles.kbdHint}>
					press <kbd className={styles.kbd}>/</kbd> to search
				</span>
				<Link href="/tools" className={styles.navLink}>
					All tools
				</Link>
			</nav>
			<div ref={wordmarkRef} className={styles.wordmark} role="img" aria-label="BittBott.dev" />
			<HeroTerminal ref={terminalRef} panelRef={panelRef} field={fieldRef} reducedMotion={!!reducedMotion} toolCount={LANDING_TOOLS.length} />
		</section>
	);
}
