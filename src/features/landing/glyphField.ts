import type { Tool } from "@/types/tools";
import { WORDMARK_STACKED, WORDMARK_SUFFIX, WORDMARK_WIDE, artWidth } from "./wordmark";

/**
 * Imperative canvas engine behind the landing hero.
 *
 * A grid of monospace cells renders drifting contour lines of "data" glyphs. The field also draws
 * the wordmark (assembling from noise at boot), hides tool names that a cursor lens decodes, and
 * reacts to the terminal: keystroke/command ripples and command output "spoken" into the glyphs.
 *
 * Colour rule: lime is the machine, violet is the visitor (ripples, lens fringe, spoken glyphs).
 */

export interface GlyphFieldOptions {
	hero: HTMLElement;
	canvas: HTMLCanvasElement;
	/** Element that reserves the wordmark's space; the field draws the art over it. */
	wordmark: HTMLElement;
	/** Elements hidden words must not sit under (terminal panel, nav). */
	avoid: HTMLElement[];
	/** The terminal panel; the idle lens wanders in the largest open area beside or below it. */
	panel: HTMLElement;
	tools: readonly Tool[];
	reducedMotion: boolean;
	onOpen: (tool: Tool) => void;
}

export interface GlyphFieldHandle {
	/** Ripple from a viewport point. `strength` ~0.3 for keystrokes, 1 for commands. */
	pulse: (clientX: number, clientY: number, strength: number) => void;
	/** Temporarily swap the field's alphabet for the characters of `text`. */
	speak: (text: string) => void;
	/** Reveal these tools as words in the field, placing them if needed. */
	surface: (tools: readonly Tool[]) => void;
	destroy: () => void;
}

interface Word {
	tool: Tool;
	text: string;
	c: number;
	r: number;
	len: number;
	reveal: number;
	target: number;
	born: number;
	visible: boolean;
	decodeAt: number;
	seen: number;
}

interface WordmarkCell {
	chr: string;
	ra: number; // reveal time (ms, performance.now clock)
	cx: number;
	ry: number;
	text?: boolean;
}

interface Ripple {
	x: number;
	y: number;
	s: number;
	speed: number;
	t0: number;
}

const DEFAULT_ALPHABET = Array.from(
	"0123456789abcdef0123456789abcdef+/=ABCDEFGHJKLMNPQRSTUVWXYZ⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇·:"
);
const ALPHAS = [0.09, 0.14, 0.21, 0.3, 0.42, 0.56, 0.74, 0.95];
const SPEAK_MS = 8000;
const IDLE_MS = 4500;
const TOUCH_IDLE_MS = 8000;
const MAX_WORD_LEN = 24;
const INTERACTIVE = "a, button, input, [data-field-ignore]";

const NOOP_HANDLE: GlyphFieldHandle = { pulse: () => {}, speak: () => {}, surface: () => {}, destroy: () => {} };

const pick = <T,>(a: readonly T[]): T => a[(Math.random() * a.length) | 0];
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const hash2 = (a: number, b: number) => {
	const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
	return s - Math.floor(s);
};

/** Contour-line intensity (0..~0.8) for a pixel position at time t (seconds). */
function fieldValue(px: number, py: number, t: number): number {
	const x = px * 0.0105;
	const y = py * 0.0105;
	const warp = Math.sin(x * 0.7 + t * 0.11);
	let v =
		Math.sin(x * 1.1 + t * 0.31) +
		Math.sin(y * 1.7 - t * 0.23 + warp) +
		Math.sin((x + y) * 0.75 + t * 0.17) +
		Math.sin(Math.sqrt((x - 9) * (x - 9) + (y - 3) * (y - 3)) * 1.2 - t * 0.45);
	v *= 0.25;
	const b = (v + 1) * 2.6;
	const f = b - Math.floor(b);
	const e = f < 0.5 ? f : 1 - f;
	return (e < 0.085 ? (1 - e / 0.085) * 0.55 : 0) + (v > 0.3 ? (v - 0.3) * 0.4 : 0);
}

export function createGlyphField(opts: GlyphFieldOptions): GlyphFieldHandle {
	const { hero, canvas, wordmark: wmEl, avoid, panel, tools, reducedMotion: REDUCED, onOpen } = opts;
	const ctx = canvas.getContext("2d");
	if (!ctx) return NOOP_HANDLE;

	const buckets: (string | number)[][] = Array.from({ length: 8 }, () => []);
	const vbuckets: (string | number)[][] = Array.from({ length: 8 }, () => []);
	const wordDraw: (string | number)[] = [];

	let W = 0, H = 0, cw = 12, ch = 22, fs = 20, cols = 0, rows = 0, lensR = 140;
	let chars: string[] = [];
	let tint = new Uint8Array(0), dust = new Uint8Array(0), base = new Uint8Array(0);
	let wordAt = new Int16Array(0);
	let wm = new Map<number, WordmarkCell>();
	let wmWidth = 0;
	let words: Word[] = [];
	let maxWords = 12;
	let ripples: Ripple[] = [];
	let alphabet = DEFAULT_ALPHABET;
	let alphaUntil = 0;
	let mut = 0.015;
	let ghost = { x0: 0, x1: 0, y0: 0, y1: 0 };
	const lens = { x: -9999, y: -9999, s: 0, target: 0, last: -1e9, touch: -1e9 };
	const colors = { lime: "#c6f05a", ink: "#eef2e6", violet: "#b58cf0" };
	let fontFamily = "monospace";
	let running = false, onScreen = true, pending = false, destroyed = false;
	let raf = 0, last = 0, frameId = 0;
	let hover: Word | null = null;
	let down: { w: Word | null; visible: boolean } | null = null;
	const T0 = performance.now();
	let bootAt = T0;
	let lastWidth = -1;

	function readStyle() {
		const cs = getComputedStyle(hero);
		for (const k of ["lime", "ink", "violet"] as const) {
			const val = cs.getPropertyValue(`--lf-${k}`).trim();
			if (!val || !ctx) continue;
			// Canvas silently ignores colours it can't parse (e.g. oklch on older engines).
			ctx.fillStyle = "#010203";
			ctx.fillStyle = val;
			if (ctx.fillStyle !== "#010203") colors[k] = val;
		}
		fontFamily = getComputedStyle(canvas).fontFamily || "monospace";
	}

	function cellsOf(el: HTMLElement, m: number): [number, number, number, number] {
		const r = el.getBoundingClientRect();
		const hr = hero.getBoundingClientRect();
		return [
			Math.floor((r.left - hr.left) / cw) - m,
			Math.floor((r.top - hr.top) / ch) - m,
			Math.ceil((r.right - hr.left) / cw) + m,
			Math.ceil((r.bottom - hr.top) / ch) + m,
		];
	}

	function mark(arr: Uint8Array, x0: number, y0: number, x1: number, y1: number) {
		for (let r = Math.max(0, y0); r <= Math.min(rows - 1, y1); r++)
			for (let c = Math.max(0, x0); c <= Math.min(cols - 1, x1); c++) arr[r * cols + c] = 1;
	}

	function occupancy() {
		const o = base.slice();
		for (const w of words) mark(o, w.c - 2, w.r - 1, w.c + w.len + 1, w.r + 1);
		return o;
	}

	function rebuildWordAt() {
		wordAt = new Int16Array(cols * rows).fill(-1);
		words.forEach((w, k) => {
			for (let j = 0; j < w.len; j++) wordAt[w.r * cols + w.c + j] = k;
		});
	}

	function placeWord(tool: Tool): Word | null {
		const len = tool.name.length;
		if (len > cols - 4 || rows < 6) return null;
		const occ = occupancy();
		for (let tries = 0; tries < 180; tries++) {
			const r = 1 + ((Math.random() * (rows - 4)) | 0);
			const c = 1 + ((Math.random() * (cols - len - 2)) | 0);
			let ok = true;
			for (let k = 0; k < len && ok; k++) if (occ[r * cols + c + k]) ok = false;
			if (ok) {
				const w: Word = { tool, text: tool.name, c, r, len, reveal: 0, target: 0, born: performance.now(), visible: false, decodeAt: 0, seen: 0 };
				words.push(w);
				return w;
			}
		}
		return null;
	}

	function layout() {
		const g = parseFloat(getComputedStyle(hero).paddingLeft) || 16;
		const avail = hero.clientWidth - 2 * g;
		const suffix = WORDMARK_SUFFIX.length;
		let art = WORDMARK_WIDE;
		let c = Math.floor(avail / (artWidth(WORDMARK_WIDE) + suffix + 0.5));
		if (c < 8) {
			art = WORDMARK_STACKED;
			c = Math.floor(avail / (artWidth(WORDMARK_STACKED) + suffix + 0.5));
		}
		cw = Math.max(5, Math.min(15, c));
		ch = Math.round(cw * 1.86);
		fs = Math.round(cw * 1.7);
		wmEl.style.height = `${art.length * ch}px`;

		const hr = hero.getBoundingClientRect();
		W = hr.width;
		H = hr.height;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		canvas.style.width = `${W}px`;
		canvas.style.height = `${H}px`;
		ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
		cols = Math.ceil(W / cw);
		rows = Math.ceil(H / ch);
		lensR = Math.max(90, Math.min(170, W * 0.1));

		const n = cols * rows;
		chars = new Array(n);
		dust = new Uint8Array(n);
		tint = new Uint8Array(n);
		for (let i = 0; i < n; i++) {
			chars[i] = pick(alphabet);
			dust[i] = Math.random() < 0.16 ? 1 : 0;
		}

		// Wordmark, snapped to the cell grid where the reserving element sits.
		wm = new Map();
		const wr = wmEl.getBoundingClientRect();
		const c0 = Math.round((wr.left - hr.left) / cw);
		const r0 = Math.round((wr.top - hr.top) / ch);
		const aw = artWidth(art);
		wmWidth = aw;
		art.forEach((line, ry) =>
			Array.from(line).forEach((chr, cx) => {
				const cc = c0 + cx, rr = r0 + ry;
				if (chr === " " || cc < 0 || cc >= cols || rr < 0 || rr >= rows) return;
				const ra = REDUCED ? 0 : bootAt + 350 + cx * 16 + hash2(ry, cx) * 520;
				wm.set(rr * cols + cc, { chr, ra, cx, ry });
			})
		);
		// ".dev" sits on the baseline of the last letter row and decodes in after the wordmark.
		const sr = r0 + art.length - 2;
		Array.from(WORDMARK_SUFFIX).forEach((chr, k) => {
			const cc = c0 + aw + k;
			if (cc >= cols || sr < 0 || sr >= rows) return;
			const ra = REDUCED ? 0 : bootAt + 350 + (aw + k) * 16 + 900 + k * 90;
			wm.set(sr * cols + cc, { chr, ra, cx: aw + k, ry: art.length - 2, text: true });
		});

		base = new Uint8Array(n);
		mark(base, c0 - 1, r0 - 1, c0 + aw + suffix + 1, r0 + art.length);
		for (const el of avoid) mark(base, ...cellsOf(el, 1));
		mark(base, 0, rows - 3, cols - 1, rows - 1);

		// The idle "ghost" lens wanders in the largest open area.
		const pr = panel.getBoundingClientRect();
		const wmBottom = wr.bottom - hr.top + 16;
		if (hr.right - pr.right > 280) ghost = { x0: pr.right - hr.left + 60, x1: W - 60, y0: wmBottom + 20, y1: H - 90 };
		else ghost = { x0: 40, x1: W - 40, y0: pr.bottom - hr.top + 40, y1: H - 50 };
		if (ghost.y1 - ghost.y0 < 30) ghost.y1 = ghost.y0 + 30;

		words = [];
		maxWords = Math.max(4, Math.min(18, Math.round(n / 230)));
		const pool = tools.filter((t) => t.name.length <= MAX_WORD_LEN).sort(() => Math.random() - 0.5);
		for (const t of pool) {
			if (words.length >= maxWords) break;
			placeWord(t);
		}
		rebuildWordAt();
	}

	function boxLine(chr: string, x: number, y: number) {
		const c = ctx!;
		const cx = x + cw / 2, cy = y + ch / 2, L = x, R = x + cw, T = y, B = y + ch;
		c.beginPath();
		switch (chr) {
			case "═": c.moveTo(L, cy); c.lineTo(R, cy); break;
			case "║": c.moveTo(cx, T); c.lineTo(cx, B); break;
			case "╔": c.moveTo(R, cy); c.lineTo(cx, cy); c.lineTo(cx, B); break;
			case "╗": c.moveTo(L, cy); c.lineTo(cx, cy); c.lineTo(cx, B); break;
			case "╚": c.moveTo(cx, T); c.lineTo(cx, cy); c.lineTo(R, cy); break;
			case "╝": c.moveTo(cx, T); c.lineTo(cx, cy); c.lineTo(L, cy); break;
		}
		c.stroke();
	}

	function drawBuckets(set: (string | number)[][], color: string, gain: number) {
		const c = ctx!;
		c.fillStyle = color;
		for (let b = 0; b < 8; b++) {
			const a = set[b];
			if (!a.length) continue;
			c.globalAlpha = Math.min(1, ALPHAS[b] * gain);
			for (let k = 0; k < a.length; k += 3) c.fillText(a[k] as string, a[k + 1] as number, a[k + 2] as number);
		}
	}

	function draw(now: number) {
		if (!cols || destroyed) return;
		const c = ctx!;
		frameId++;
		const t = REDUCED ? 24 : (now - T0) / 1000;

		if (!REDUCED && now - lens.last > IDLE_MS && now - lens.touch > TOUCH_IDLE_MS) {
			const gx = ghost.x0 + (ghost.x1 - ghost.x0) * (0.5 + 0.5 * Math.sin(t * 0.19));
			const gy = ghost.y0 + (ghost.y1 - ghost.y0) * (0.5 + 0.5 * Math.sin(t * 0.31 + 1.2));
			if (lens.x < -1000) {
				lens.x = gx;
				lens.y = gy;
			}
			lens.x += (gx - lens.x) * 0.03;
			lens.y += (gy - lens.y) * 0.03;
			lens.target = 0.7;
		}
		lens.s += (lens.target - lens.s) * (REDUCED ? 1 : 0.08);
		if (alphaUntil && now > alphaUntil) {
			alphabet = DEFAULT_ALPHABET;
			alphaUntil = 0;
			mut = 0.14;
		}
		const m = REDUCED ? 0 : mut;
		mut += (0.015 - mut) * 0.04;
		const speaking = alphaUntil ? 1 : 0;

		const rp: { x: number; y: number; rad: number; band: number; a: number }[] = [];
		ripples = ripples.filter((r) => {
			const age = (now - r.t0) / 1000;
			if (age > 1.8) return false;
			rp.push({ x: r.x, y: r.y, rad: age * r.speed, band: 44, a: r.s * (1 - age / 1.8) });
			return true;
		});
		for (const w of words) w.reveal += (w.target - w.reveal) * (REDUCED ? 1 : 0.05);

		for (const b of buckets) b.length = 0;
		for (const b of vbuckets) b.length = 0;
		wordDraw.length = 0;
		const R = lensR, R2 = R * R, ls = lens.s;

		for (let r = 0; r < rows; r++) {
			const py = r * ch + ch / 2;
			for (let col = 0; col < cols; col++) {
				const i = r * cols + col;
				if (wm.has(i)) continue;
				const px = col * cw + cw / 2;
				let v = fieldValue(px, py, t);
				if (dust[i] && v < 0.08) v = 0.08;

				let lf = 0, violet = 0;
				if (ls > 0.01) {
					const dx = px - lens.x, dy = py - lens.y, d2 = dx * dx + dy * dy;
					if (d2 < R2) {
						const dn = Math.sqrt(d2) / R;
						lf = smooth(1 - dn) * ls;
						v += lf * 0.9;
						const fr = Math.max(0, 1 - Math.abs(dn - 0.86) / 0.13) * ls;
						if (fr > 0.3) {
							violet = 1;
							v += fr * 0.3;
						}
					}
				}
				let re = 0;
				for (const p of rp) {
					const dx = px - p.x, dy = py - p.y;
					const k = Math.abs(Math.sqrt(dx * dx + dy * dy) - p.rad);
					if (k < p.band) {
						const e = (1 - k / p.band) * p.a;
						v += e * 0.8;
						re += e;
						if (e > 0.3 && Math.random() < 0.25) {
							chars[i] = pick(alphabet);
							tint[i] = speaking;
						}
					}
				}
				if (Math.random() < m) {
					chars[i] = pick(alphabet);
					tint[i] = speaking;
				}
				if (re > 0.18 || tint[i]) violet = 1;

				const wk = wordAt[i];
				if (wk >= 0) {
					const w = words[wk];
					const lr = Math.max(lf * 1.5, w.reveal);
					if (lr > 0.28) {
						if (!w.visible) {
							w.visible = true;
							w.decodeAt = now;
						}
						w.seen = frameId;
						const k = col - w.c;
						const letter = w.text[k];
						if (letter !== " ") {
							const decoded = REDUCED || now - w.decodeAt > k * 32 + 60;
							wordDraw.push(decoded ? letter : pick(alphabet), px, py, Math.min(1, 0.35 + lr));
						}
						continue;
					}
				}
				if (v < 0.07) continue;
				(violet ? vbuckets : buckets)[v >= 1 ? 7 : (v * 8) | 0].push(chars[i], px, py);
			}
		}
		for (const w of words) if (w.seen !== frameId) w.visible = false;

		c.clearRect(0, 0, W, H);
		c.textAlign = "center";
		c.textBaseline = "middle";
		const regular = `${fs}px ${fontFamily}`;
		const bold = `700 ${fs}px ${fontFamily}`;
		c.font = regular;
		drawBuckets(buckets, colors.lime, 1);
		drawBuckets(vbuckets, colors.violet, 1.15);

		c.font = bold;
		c.fillStyle = colors.ink;
		for (let k = 0; k < wordDraw.length; k += 4) {
			c.globalAlpha = wordDraw[k + 3] as number;
			c.fillText(wordDraw[k] as string, wordDraw[k + 1] as number, wordDraw[k + 2] as number);
		}
		if (hover && hover.visible) {
			c.globalAlpha = 1;
			c.fillStyle = colors.lime;
			c.fillRect(hover.c * cw, hover.r * ch + ch - 3, hover.len * cw, 1.5);
		}

		// Wordmark: assembles from noise at boot; the lens turns it back into data.
		c.font = regular;
		c.fillStyle = colors.lime;
		c.strokeStyle = colors.lime;
		c.lineWidth = Math.max(1, cw / 9);
		const sweepPos = REDUCED ? -999 : ((t * 16) % (wmWidth + 70)) - 25;
		for (const [i, cell] of wm) {
			const col = i % cols, r = (i / cols) | 0;
			const x = col * cw, y = r * ch, px = x + cw / 2, py = y + ch / 2;
			if (now < cell.ra) {
				if (now > cell.ra - 650) {
					c.globalAlpha = 0.9;
					c.fillText(pick(alphabet), px, py);
				}
				continue;
			}
			let lf = 0;
			if (ls > 0.01) {
				const dx = px - lens.x, dy = py - lens.y, d2 = dx * dx + dy * dy;
				if (d2 < R2) lf = smooth(1 - Math.sqrt(d2) / R) * ls;
			}
			if (cell.text) {
				c.globalAlpha = Math.max(0.92, 1 - (now - cell.ra) / 450);
				c.font = bold;
				c.fillText(cell.chr, px, py);
				c.font = regular;
			} else if (cell.chr === "█") {
				if (lf > 0.42) {
					if (Math.random() < 0.08) chars[i] = pick(alphabet);
					c.globalAlpha = 0.95;
					c.fillText(chars[i], px, py);
				} else {
					const sw = Math.max(0, 1 - Math.abs(cell.cx + cell.ry * 2 - sweepPos) / 5);
					const flash = Math.max(0, 1 - (now - cell.ra) / 450);
					c.globalAlpha = Math.min(1, 0.8 + 0.2 * Math.max(sw, flash)) * (1 - lf * 0.5);
					c.fillRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
				}
			} else {
				c.globalAlpha = 0.5 * (1 - lf * 0.6);
				boxLine(cell.chr, x, y);
			}
		}
		c.globalAlpha = 1;
	}

	function loop(now: number) {
		raf = 0;
		if (!running) return;
		if (now - last >= 20) {
			last = now;
			draw(now);
		}
		raf = requestAnimationFrame(loop);
	}

	function request() {
		if (running || pending || destroyed) return;
		pending = true;
		requestAnimationFrame((n) => {
			pending = false;
			draw(n);
		});
	}

	function sync() {
		const want = onScreen && !document.hidden && !REDUCED && !destroyed;
		if (want && !running) {
			running = true;
			raf = requestAnimationFrame(loop);
		} else if (!want && running) {
			running = false;
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		}
		request();
	}

	const local = (x: number, y: number) => {
		const r = hero.getBoundingClientRect();
		return { x: x - r.left, y: y - r.top };
	};

	function wordAtPoint(p: { x: number; y: number }): Word | null {
		const col = Math.floor(p.x / cw), r = Math.floor(p.y / ch);
		if (col < 0 || r < 0 || col >= cols || r >= rows) return null;
		const k = wordAt[r * cols + col];
		return k >= 0 ? words[k] : null;
	}

	function addRipple(x: number, y: number, s: number) {
		if (REDUCED) return;
		ripples.push({ x, y, s, speed: s > 0.6 ? 680 : 460, t0: performance.now() });
		mut = Math.max(mut, s * 0.06);
		if (ripples.length > 12) ripples.shift();
	}

	const isInteractive = (target: EventTarget | null) => target instanceof Element && !!target.closest(INTERACTIVE);

	const onPointerMove = (e: PointerEvent) => {
		const p = local(e.clientX, e.clientY);
		lens.x = p.x;
		lens.y = p.y;
		lens.target = 1;
		lens.last = performance.now();
		if (e.pointerType !== "mouse") lens.touch = lens.last;
		const w = isInteractive(e.target) ? null : wordAtPoint(p);
		hover = w && w.visible ? w : null;
		hero.style.cursor = hover ? "pointer" : "";
		request();
	};
	const onPointerLeave = () => {
		lens.target = 0;
		hover = null;
		hero.style.cursor = "";
		request();
	};
	const onPointerDown = (e: PointerEvent) => {
		if (isInteractive(e.target)) return;
		const p = local(e.clientX, e.clientY);
		const w = wordAtPoint(p);
		// On touch the first tap reveals a word; only a tap on an already-visible word opens it.
		down = { w, visible: !!(w && w.visible) };
		if (e.pointerType !== "mouse") {
			lens.x = p.x;
			lens.y = p.y;
			lens.target = 1;
			lens.touch = lens.last = performance.now();
		}
		if (!w) addRipple(p.x, p.y, 0.75);
		request();
	};
	const onPointerUp = (e: PointerEvent) => {
		if (!down) return;
		const w = wordAtPoint(local(e.clientX, e.clientY));
		if (w && w === down.w && down.visible) onOpen(w.tool);
		down = null;
	};

	readStyle();
	const resizeObserver = new ResizeObserver(() => {
		if (Math.abs(hero.clientWidth - lastWidth) < 1 && Math.abs(hero.getBoundingClientRect().height - H) < 2) return;
		lastWidth = hero.clientWidth;
		layout();
		request();
	});
	const intersectionObserver = new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
		sync();
	});
	const themeObserver = new MutationObserver(() => {
		readStyle();
		request();
	});

	hero.addEventListener("pointermove", onPointerMove);
	hero.addEventListener("pointerleave", onPointerLeave);
	hero.addEventListener("pointerdown", onPointerDown);
	hero.addEventListener("pointerup", onPointerUp);
	document.addEventListener("visibilitychange", sync);
	themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

	// Wait (briefly) for the mono webfont so the first frames don't measure a fallback face.
	const fontWait = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
	fontWait.then(() => {
		if (destroyed) return;
		readStyle();
		bootAt = performance.now();
		lastWidth = hero.clientWidth;
		layout();
		resizeObserver.observe(hero);
		intersectionObserver.observe(hero);
		sync();
	});

	return {
		pulse(clientX, clientY, strength) {
			const p = local(clientX, clientY);
			addRipple(p.x, p.y, strength);
		},
		speak(text) {
			const set = Array.from(new Set(Array.from(text.replace(/\s/g, ""))));
			if (set.length < 2 || REDUCED) return;
			alphabet = set;
			alphaUntil = performance.now() + SPEAK_MS;
			mut = 0.22;
		},
		surface(list) {
			if (!cols) return;
			const want = new Set(list);
			words.forEach((w) => (w.target = want.has(w.tool) ? 1 : 0));
			for (const t of list) {
				if (words.some((w) => w.tool === t)) continue;
				if (words.length >= maxWords) {
					let idx = -1;
					words.forEach((w, k) => {
						if (w.target === 0 && (idx < 0 || w.born < words[idx].born)) idx = k;
					});
					if (idx < 0) break;
					words.splice(idx, 1);
				}
				const w = placeWord(t);
				if (w) w.target = 1;
			}
			rebuildWordAt();
			request();
		},
		destroy() {
			destroyed = true;
			running = false;
			if (raf) cancelAnimationFrame(raf);
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			themeObserver.disconnect();
			hero.removeEventListener("pointermove", onPointerMove);
			hero.removeEventListener("pointerleave", onPointerLeave);
			hero.removeEventListener("pointerdown", onPointerDown);
			hero.removeEventListener("pointerup", onPointerUp);
			document.removeEventListener("visibilitychange", sync);
			hero.style.cursor = "";
		},
	};
}
