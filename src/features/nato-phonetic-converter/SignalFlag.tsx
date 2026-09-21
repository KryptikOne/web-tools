import { useId } from "react";

/** International Code of Signals flag colours */
const B = "#1f3ea5";
const R = "#d3252b";
const Y = "#f5c518";
const K = "#161616";
const W = "#ffffff";

const RECT = "0,0 40,0 40,30 0,30";
const SWALLOW = "0,0 40,0 33,15 40,30 0,30";

function saltire(color: string) {
	return (
		<>
			<line x1="0" y1="0" x2="40" y2="30" stroke={color} strokeWidth="5" />
			<line x1="40" y1="0" x2="0" y2="30" stroke={color} strokeWidth="5" />
		</>
	);
}

function cross(color: string) {
	return (
		<>
			<rect x="17" y="0" width="6" height="30" fill={color} />
			<rect x="0" y="12" width="40" height="6" fill={color} />
		</>
	);
}

function hStripes(colors: string[]) {
	const h = 30 / colors.length;
	return colors.map((c, i) => <rect key={i} x="0" y={i * h} width="40" height={h} fill={c} />);
}

function vStripes(colors: string[]) {
	const w = 40 / colors.length;
	return colors.map((c, i) => <rect key={i} x={i * w} y="0" width={w} height="30" fill={c} />);
}

function checker(a: string, b: string) {
	const cells = [];
	for (let r = 0; r < 4; r++) {
		for (let c = 0; c < 4; c++) {
			cells.push(
				<rect key={`${r}-${c}`} x={c * 10} y={r * 7.5} width="10" height="7.5" fill={(r + c) % 2 === 0 ? a : b} />
			);
		}
	}
	return cells;
}

function flagBody(letter: string, clipId: string) {
	switch (letter) {
		case "A":
			return (
				<>
					<polygon points={SWALLOW} fill={W} />
					<polygon points="20,0 40,0 33,15 40,30 20,30" fill={B} />
				</>
			);
		case "B":
			return <polygon points={SWALLOW} fill={R} />;
		case "C":
			return hStripes([B, W, R, W, B]);
		case "D":
			return (
				<>
					<rect width="40" height="30" fill={Y} />
					<rect y="7.5" width="40" height="15" fill={B} />
				</>
			);
		case "E":
			return hStripes([B, R]);
		case "F":
			return (
				<>
					<rect width="40" height="30" fill={W} />
					<polygon points="20,0 40,15 20,30 0,15" fill={R} />
				</>
			);
		case "G":
			return vStripes([Y, B, Y, B, Y, B]);
		case "H":
			return vStripes([W, R]);
		case "I":
			return (
				<>
					<rect width="40" height="30" fill={Y} />
					<circle cx="20" cy="15" r="7" fill={K} />
				</>
			);
		case "J":
			return hStripes([B, W, B]);
		case "K":
			return vStripes([Y, B]);
		case "L":
			return (
				<>
					<rect width="40" height="30" fill={Y} />
					<rect x="20" y="0" width="20" height="15" fill={K} />
					<rect x="0" y="15" width="20" height="15" fill={K} />
				</>
			);
		case "M":
			return (
				<>
					<rect width="40" height="30" fill={B} />
					{saltire(W)}
				</>
			);
		case "N":
			return checker(B, W);
		case "O":
			return (
				<>
					<polygon points="0,0 40,0 0,30" fill={R} />
					<polygon points="40,0 40,30 0,30" fill={Y} />
				</>
			);
		case "P":
			return (
				<>
					<rect width="40" height="30" fill={B} />
					<rect x="13.33" y="10" width="13.33" height="10" fill={W} />
				</>
			);
		case "Q":
			return <rect width="40" height="30" fill={Y} />;
		case "R":
			return (
				<>
					<rect width="40" height="30" fill={R} />
					{cross(Y)}
				</>
			);
		case "S":
			return (
				<>
					<rect width="40" height="30" fill={W} />
					<rect x="13.33" y="10" width="13.33" height="10" fill={B} />
				</>
			);
		case "T":
			return vStripes([R, W, B]);
		case "U":
			return (
				<>
					<rect width="40" height="30" fill={R} />
					<rect x="20" y="0" width="20" height="15" fill={W} />
					<rect x="0" y="15" width="20" height="15" fill={W} />
				</>
			);
		case "V":
			return (
				<>
					<rect width="40" height="30" fill={W} />
					{saltire(R)}
				</>
			);
		case "W":
			return (
				<>
					<rect width="40" height="30" fill={B} />
					<rect x="6.67" y="5" width="26.67" height="20" fill={W} />
					<rect x="13.33" y="10" width="13.33" height="10" fill={R} />
				</>
			);
		case "X":
			return (
				<>
					<rect width="40" height="30" fill={W} />
					{cross(B)}
				</>
			);
		case "Y":
			return (
				<>
					<clipPath id={clipId}>
						<rect width="40" height="30" />
					</clipPath>
					<rect width="40" height="30" fill={Y} />
					<g clipPath={`url(#${clipId})`} stroke={R} strokeWidth="6">
						{[-36, -24, -12, 0, 12, 24, 36].map((o) => (
							<line key={o} x1={o} y1="0" x2={o + 40} y2="30" />
						))}
					</g>
				</>
			);
		case "Z":
			return (
				<>
					<polygon points="0,0 40,0 20,15" fill={Y} />
					<polygon points="40,0 40,30 20,15" fill={B} />
					<polygon points="40,30 0,30 20,15" fill={R} />
					<polygon points="0,30 0,0 20,15" fill={K} />
				</>
			);
		default:
			return null;
	}
}

interface SignalFlagProps {
	letter: string;
	className?: string;
}

/** Maritime signal flag for a Latin letter A–Z. Renders nothing for other characters. */
export default function SignalFlag({ letter, className }: SignalFlagProps) {
	const clipId = useId();
	const upper = letter.toUpperCase();
	const body = flagBody(upper, clipId);
	if (!body) return null;
	const outline = upper === "A" || upper === "B" ? SWALLOW : RECT;
	return (
		<svg viewBox="0 0 40 30" className={className} aria-hidden="true" focusable="false">
			{body}
			<polygon points={outline} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
		</svg>
	);
}
