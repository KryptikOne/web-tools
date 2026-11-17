/**
 * Kerf bending: saw kerfs across the inside face of a board so it bends to a radius or around an
 * ellipse. Each kerf closes by the blade width when the board turns through a fixed angle, so the
 * kerf spacing follows the radius of curvature. Lengths in inches, angles in degrees.
 */

const DEG = 180 / Math.PI;

export interface KerfBendInput {
	thickness: number;
	/** Blade (kerf) width */
	kerfWidth: number;
	/** Wood left under each kerf */
	remaining: number;
	/** Inside radius of the bend, on the kerfed face */
	insideRadius: number;
	/** Bend as an angle or as the outside arc length */
	by: "angle" | "arc";
	angle: number;
	arcLength: number;
	/** Round the kerf count up (kerfs stay a touch open) or down (kerfs must close fully and the bend is a little short) */
	round: "up" | "down";
}

export interface KerfBend {
	kerfDepth: number;
	/** Turn per kerf when it closes fully */
	anglePerKerfClosed: number;
	/** Turn per kerf actually used so the count is whole */
	anglePerKerf: number;
	kerfs: number;
	angle: number;
	outsideRadius: number;
	/** Kerf spacing on the outside (uncut) face */
	spacing: number;
	insideArc: number;
	outsideArc: number;
	/** Length of board the bend takes on the outside face, kerfs start half a spacing in */
	bendLength: number;
	/** Kerf centres from the start of the bend, along the outside face */
	positions: number[];
	/** How much each kerf stays open on the inside face after bending */
	gapLeft: number;
	warnings: string[];
}

export function kerfBend(input: KerfBendInput): KerfBend | null {
	const { thickness: T, kerfWidth: k, remaining: t, insideRadius: R } = input;
	if (!(T > 0) || !(k > 0) || !(t > 0) || t >= T || !(R >= 0)) return null;
	const depth = T - t;
	const Ro = R + T;
	let angle: number;
	if (input.by === "angle") angle = input.angle;
	else angle = (input.arcLength / Ro) * DEG;
	if (!(angle > 0) || angle > 360) return null;
	const closed = (k / depth) * DEG;
	const raw = angle / closed;
	let n = input.round === "up" ? Math.ceil(raw - 1e-9) : Math.floor(raw + 1e-9);
	if (n < 1) n = 1;
	if (n > 5000) return null;
	// rounding up shares the angle over more kerfs so each stays a little open; rounding down keeps
	// every kerf fully closed, so the bend reached is a little short of the one asked for
	const per = input.round === "up" ? angle / n : closed;
	const reached = per * n;
	const spacing = (per / DEG) * Ro;
	const bendLength = spacing * n;
	const positions = Array.from({ length: n }, (_, i) => spacing * (i + 0.5));
	const gapLeft = Math.max(0, k - (per / DEG) * depth);
	const warnings: string[] = [];
	if (input.round === "down" && raw - n > 1e-9) warnings.push(`${n} kerfs closing fully give ${reached.toFixed(1)}°; add one kerf and leave them slightly open to reach ${angle.toFixed(1)}°`);
	angle = reached;
	if (t < T / 6) warnings.push("Less than a sixth of the thickness is left under the kerfs; the skin may crack");
	if (spacing < k * 1.5) warnings.push("Kerfs are closer than one and a half blade widths; little wood is left between them");
	return {
		kerfDepth: depth,
		anglePerKerfClosed: closed,
		anglePerKerf: per,
		kerfs: n,
		angle,
		outsideRadius: Ro,
		spacing,
		insideArc: (angle / DEG) * R,
		outsideArc: (angle / DEG) * Ro,
		bendLength,
		positions,
		gapLeft,
		warnings,
	};
}

// ── Ellipse ──────────────────────────────────────────────────────────────────

export interface KerfEllipseInput {
	thickness: number;
	kerfWidth: number;
	remaining: number;
	/** Half ellipse: width across the ends and rise at the middle, measured on the kerfed (inside) face */
	width: number;
	rise: number;
}

export interface EllipseKerf {
	index: number;
	/** Along the outside face from one end */
	position: number;
	/** Local inside radius of curvature where the kerf sits */
	radius: number;
	/** Spacing to the next kerf */
	spacingAfter: number;
}

export interface KerfEllipse {
	kerfDepth: number;
	anglePerKerf: number;
	kerfs: number;
	/** Length of board on the outside face around the half ellipse */
	outsideLength: number;
	insideLength: number;
	/** Tightest radius (at the middle of the rise) and widest (at the ends), inside face */
	minRadius: number;
	maxRadius: number;
	minSpacing: number;
	maxSpacing: number;
	kerfList: EllipseKerf[];
	/** Outline of the inside and outside faces for drawing, x across, y up */
	inside: { x: number; y: number }[];
	outside: { x: number; y: number }[];
	warnings: string[];
}

/** Kerfs around a half ellipse so each closes by the blade width; closer together where the curve is tighter. */
export function kerfEllipse(input: KerfEllipseInput): KerfEllipse | null {
	const { thickness: T, kerfWidth: k, remaining: t, width: W, rise: b } = input;
	if (!(T > 0) || !(k > 0) || !(t > 0) || t >= T || !(W > 0) || !(b > 0)) return null;
	const a = W / 2;
	const depth = T - t;
	const per = k / depth; // radians per kerf
	const total = Math.PI; // a half ellipse turns through 180°
	const n = Math.round(total / per);
	if (n < 1 || n > 5000) return null;
	const perUsed = total / n;
	// walk the half ellipse from the left end (phi = π) to the right end (phi = 0), y up
	const steps = Math.max(2000, n * 40);
	const pts: { x: number; y: number; psi: number; sIn: number; sOut: number; rho: number }[] = [];
	let sIn = 0;
	let sOut = 0;
	let prev: { x: number; y: number } | null = null;
	let prevPsi = 0;
	for (let i = 0; i <= steps; i++) {
		const phi = Math.PI - (Math.PI * i) / steps;
		const x = a * Math.cos(phi);
		const y = b * Math.sin(phi);
		// tangent direction and curvature of the ellipse at phi
		const dx = -a * Math.sin(phi);
		const dy = b * Math.cos(phi);
		const psi = Math.atan2(dy, dx);
		const rho = Math.pow(a * a * Math.sin(phi) ** 2 + b * b * Math.cos(phi) ** 2, 1.5) / (a * b);
		if (prev) {
			const ds = Math.hypot(x - prev.x, y - prev.y);
			let dpsi = psi - prevPsi;
			while (dpsi > Math.PI) dpsi -= 2 * Math.PI;
			while (dpsi < -Math.PI) dpsi += 2 * Math.PI;
			sIn += ds;
			sOut += ds + T * Math.abs(dpsi);
		}
		pts.push({ x, y, psi, sIn, sOut, rho });
		prev = { x, y };
		prevPsi = psi;
	}
	// place kerf i where the turn since the start reaches (i − 0.5) × perUsed
	const kerfList: EllipseKerf[] = [];
	let turned = 0;
	let next = 0;
	for (let i = 1; i < pts.length && next < n; i++) {
		let dpsi = pts[i].psi - pts[i - 1].psi;
		while (dpsi > Math.PI) dpsi -= 2 * Math.PI;
		while (dpsi < -Math.PI) dpsi += 2 * Math.PI;
		turned += Math.abs(dpsi);
		while (next < n && turned >= (next + 0.5) * perUsed - 1e-12) {
			kerfList.push({ index: next + 1, position: pts[i].sOut, radius: pts[i].rho, spacingAfter: 0 });
			next++;
		}
	}
	for (let i = 0; i < kerfList.length - 1; i++) kerfList[i].spacingAfter = kerfList[i + 1].position - kerfList[i].position;
	const spacings = kerfList.slice(0, -1).map((kf) => kf.spacingAfter);
	const outsideLength = pts[pts.length - 1].sOut;
	const insideLength = pts[pts.length - 1].sIn;
	const minRadius = Math.min(...pts.map((p) => p.rho));
	const maxRadius = Math.max(...pts.map((p) => p.rho));
	const warnings: string[] = [];
	if (minRadius < depth) warnings.push("The curve is tighter at the middle than the kerf depth; the kerfs cannot close without crushing");
	if (t < T / 6) warnings.push("Less than a sixth of the thickness is left under the kerfs; the skin may crack");
	const every = Math.max(1, Math.floor(pts.length / 120));
	const inside = pts.filter((_, i) => i % every === 0 || i === pts.length - 1).map((p) => ({ x: p.x, y: p.y }));
	// the board is travelled clockwise over the top, so the outside face is on the left of the tangent
	const outside = pts.filter((_, i) => i % every === 0 || i === pts.length - 1).map((p) => ({ x: p.x - T * Math.sin(p.psi), y: p.y + T * Math.cos(p.psi) }));
	return {
		kerfDepth: depth,
		anglePerKerf: perUsed * DEG,
		kerfs: kerfList.length,
		outsideLength,
		insideLength,
		minRadius,
		maxRadius,
		minSpacing: spacings.length ? Math.min(...spacings) : 0,
		maxSpacing: spacings.length ? Math.max(...spacings) : 0,
		kerfList,
		inside,
		outside,
		warnings,
	};
}
