"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppDispatch } from "@/store/hooks";
import { hydrateTheme } from "@/store/slices/themeSlice";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { createGlyphField } from "@/features/landing/glyphField";
import { PS1 } from "@/features/landing/HeroTerminal";
import { LANDING_TOOLS } from "@/features/landing/terminalCommands";
import landing from "@/features/landing/Landing.module.scss";
import styles from "./NotFound.module.scss";

/** "404" as 5x7 block digits; the glyph field scales it up and fills it with the requested path. */
const BLOCK_404 = [
	"#   # ##### #   #",
	"#   # #   # #   #",
	"#   # #   # #   #",
	"##### #   # #####",
	"    # #   #     #",
	"    # #   #     #",
	"    # #####     #",
];
const MAX_PATH = 60;
const PING_MS = 3600;

const center = (el: Element) => {
	const r = el.getBoundingClientRect();
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/**
 * Site-wide 404, standalone like the landing page. The visitor's request replays as a failed
 * `cd`, and the glyph field spells 404 out of the path they asked for.
 */
export default function NotFoundPage() {
	const dispatch = useAppDispatch();
	const reducedMotion = usePrefersReducedMotion();
	const [path, setPath] = useState<string | null>(null);
	const [typed, setTyped] = useState("");
	const [done, setDone] = useState(false);
	const heroRef = useRef<HTMLElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const numeralRef = useRef<HTMLDivElement>(null);
	const navRef = useRef<HTMLElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const caretRef = useRef<HTMLSpanElement>(null);

	// The app shell's TopBar normally hydrates the saved theme; it doesn't render here.
	useEffect(() => {
		dispatch(hydrateTheme());
	}, [dispatch]);

	// The requested path is only known in the browser (this page is prerendered once for every URL).
	useEffect(() => {
		const p = window.location.pathname || "/";
		setPath(p.length > MAX_PATH ? `${p.slice(0, MAX_PATH)}…` : p);
	}, []);

	useEffect(() => {
		const hero = heroRef.current, canvas = canvasRef.current, numeral = numeralRef.current;
		const nav = navRef.current, panel = panelRef.current;
		if (reducedMotion === null || path === null || !hero || !canvas || !numeral || !nav || !panel) return;

		const field = createGlyphField({
			hero,
			canvas,
			wordmark: numeral,
			panel,
			avoid: [panel, nav],
			tools: [],
			reducedMotion,
			onOpen: () => {},
			blockArt: { rows: BLOCK_404, fill: path },
		});
		const command = `cd ${path}`;
		let cancelled = false;
		let ping = 0;
		const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
		const caret = () => (caretRef.current ? center(caretRef.current) : null);

		(async () => {
			if (reducedMotion) {
				setTyped(command);
				setDone(true);
				return;
			}
			setTyped("");
			setDone(false);
			await sleep(350);
			const perChar = Math.min(34, 900 / command.length);
			for (let i = 1; i <= command.length; i++) {
				if (cancelled) return;
				setTyped(command.slice(0, i));
				const p = caret();
				if (p) field.pulse(p.x, p.y, 0.3);
				await sleep(perChar);
			}
			await sleep(200);
			if (cancelled) return;
			const p = caret() ?? center(panel);
			field.reveal(p.x, p.y);
			await sleep(320);
			if (cancelled) return;
			setDone(true);
			// Keep pinging from the idle cursor, like a sweep that never finds the route.
			ping = window.setInterval(() => {
				const at = caret();
				if (at && !document.hidden) field.pulse(at.x, at.y, 0.75);
			}, PING_MS);
		})();

		return () => {
			cancelled = true;
			window.clearInterval(ping);
			field.destroy();
		};
	}, [reducedMotion, path]);

	return (
		<div className={`${landing.landing} ${styles.notFound}`}>
			<main ref={heroRef} className={`relative isolate flex flex-col overflow-hidden ${landing.hero} ${styles.stage}`}>
				<canvas ref={canvasRef} className={landing.field} aria-hidden="true" />
				<nav ref={navRef} aria-label="Site" className={`flex items-center ${landing.nav}`} data-field-ignore>
					<Link href="/" className={styles.brand}>
						bittbott.dev
					</Link>
				</nav>
				<div ref={numeralRef} className={styles.numeral} role="img" aria-label="404" />

				<div ref={panelRef} className={`relative z-[2] flex w-full max-w-[620px] flex-col gap-3.5 ${landing.terminal} ${styles.panel}`} data-field-ignore>
					<h1 className={landing.title}>Nothing lives at this address.</h1>
					<p className={landing.sub}>Every tool is still where you left it.</p>

					<div className={`${landing.screen} ${styles.screen}`}>
						<div className={landing.line}>
							<span className={landing.ps1} aria-hidden="true">
								{PS1}
							</span>{" "}
							<span className={landing.you}>{typed}</span>
							{!done && <span ref={caretRef} className={styles.cursor} aria-hidden="true" />}
						</div>
						{done && (
							<>
								<div className={`${landing.line} ${landing.ok}`}>cd: no such file or directory: {path}</div>
								<div className={landing.line} aria-hidden="true">
									<span className={landing.ps1}>{PS1}</span> <span ref={caretRef} className={styles.cursor} />
								</div>
							</>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
						<Link href="/tools" className={landing.cta}>
							All tools
						</Link>
						<Link href="/" className={styles.home}>
							Home
						</Link>
					</div>
				</div>

				<p className={styles.status} data-field-ignore>
					HTTP 404 · route not found · <span className={styles.count}>{LANDING_TOOLS.length}</span> tools online
				</p>
			</main>
		</div>
	);
}
