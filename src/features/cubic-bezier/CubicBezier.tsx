"use client";

import { useState, useRef, useEffect } from "react";
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import styles from "./CubicBezier.module.scss";

interface BezierPoint {
	x: number;
	y: number;
}

interface Preset {
	name: string;
	value: [number, number, number, number];
}

const PRESETS: Preset[] = [
	{ name: "linear", value: [0, 0, 1, 1] },
	{ name: "ease", value: [0.25, 0.1, 0.25, 1] },
	{ name: "ease-in", value: [0.42, 0, 1, 1] },
	{ name: "ease-out", value: [0, 0, 0.58, 1] },
	{ name: "ease-in-out", value: [0.42, 0, 0.58, 1] },
	{ name: "ease-in-sine", value: [0.12, 0, 0.39, 0] },
	{ name: "ease-out-sine", value: [0.61, 1, 0.88, 1] },
	{ name: "ease-in-out-sine", value: [0.37, 0, 0.63, 1] },
	{ name: "ease-in-quad", value: [0.11, 0, 0.5, 0] },
	{ name: "ease-out-quad", value: [0.5, 1, 0.89, 1] },
	{ name: "ease-in-out-quad", value: [0.45, 0, 0.55, 1] },
	{ name: "ease-in-cubic", value: [0.32, 0, 0.67, 0] },
	{ name: "ease-out-cubic", value: [0.33, 1, 0.68, 1] },
	{ name: "ease-in-out-cubic", value: [0.65, 0, 0.35, 1] },
	{ name: "ease-in-quart", value: [0.5, 0, 0.75, 0] },
	{ name: "ease-out-quart", value: [0.25, 1, 0.5, 1] },
	{ name: "ease-in-out-quart", value: [0.76, 0, 0.24, 1] },
	{ name: "ease-in-expo", value: [0.7, 0, 0.84, 0] },
	{ name: "ease-out-expo", value: [0.16, 1, 0.3, 1] },
	{ name: "ease-in-out-expo", value: [0.87, 0, 0.13, 1] },
	{ name: "ease-in-back", value: [0.36, 0, 0.66, -0.56] },
	{ name: "ease-out-back", value: [0.34, 1.56, 0.64, 1] },
	{ name: "ease-in-out-back", value: [0.68, -0.6, 0.32, 1.6] },
];

export default function CubicBezier() {
	const [p1, setP1] = useState<BezierPoint>({ x: 0.25, y: 0.1 });
	const [p2, setP2] = useState<BezierPoint>({ x: 0.25, y: 1 });
	const [duration, setDuration] = useState(1);
	const [isAnimating, setIsAnimating] = useState(false);
	const [ballPosition, setBallPosition] = useState<"left" | "right">("left");
	const [copied, setCopied] = useState(false);
	const [draggingPoint, setDraggingPoint] = useState<1 | 2 | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>(undefined);

	const cssValue = `cubic-bezier(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)}, ${p2.y.toFixed(2)})`;

	// Extended Y range for more vertical drag space
	const yMin = -0.5;
	const yMax = 1.5;
	const yRange = yMax - yMin;

	// Draw the bezier curve on canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const padding = 40;
		const graphWidth = width - padding * 2;
		const graphHeight = height - padding * 2;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Draw grid
		ctx.strokeStyle = "#333";
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 5]);

		// Vertical grid lines (4 divisions for x: 0, 0.25, 0.5, 0.75, 1)
		for (let i = 0; i <= 4; i++) {
			const x = padding + (graphWidth / 4) * i;
			ctx.beginPath();
			ctx.moveTo(x, padding);
			ctx.lineTo(x, height - padding);
			ctx.stroke();
		}

		// Horizontal grid lines (8 divisions for extended y range: -0.5 to 1.5)
		for (let i = 0; i <= 8; i++) {
			const y = padding + (graphHeight / 8) * i;
			ctx.beginPath();
			ctx.moveTo(padding, y);
			ctx.lineTo(width - padding, y);
			ctx.stroke();
		}

		ctx.setLineDash([]);

		// Convert normalized coordinates to canvas coordinates
		const toCanvasX = (x: number) => padding + x * graphWidth;
		const toCanvasY = (y: number) => height - padding - ((y - yMin) / yRange) * graphHeight;

		// Draw axes at y=0 and x=0
		ctx.strokeStyle = "#555";
		ctx.lineWidth = 2;
		// Y axis (left side)
		ctx.beginPath();
		ctx.moveTo(padding, padding);
		ctx.lineTo(padding, height - padding);
		ctx.stroke();
		// X axis at y=0
		ctx.beginPath();
		ctx.moveTo(padding, toCanvasY(0));
		ctx.lineTo(width - padding, toCanvasY(0));
		ctx.stroke();

		// Draw control lines
		ctx.strokeStyle = "#666";
		ctx.lineWidth = 1;
		ctx.setLineDash([3, 3]);

		// Line from start to P1
		ctx.beginPath();
		ctx.moveTo(toCanvasX(0), toCanvasY(0));
		ctx.lineTo(toCanvasX(p1.x), toCanvasY(p1.y));
		ctx.stroke();

		// Line from P2 to end
		ctx.beginPath();
		ctx.moveTo(toCanvasX(p2.x), toCanvasY(p2.y));
		ctx.lineTo(toCanvasX(1), toCanvasY(1));
		ctx.stroke();

		ctx.setLineDash([]);

		// Draw bezier curve
		ctx.strokeStyle = "#00d4ff";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(toCanvasX(0), toCanvasY(0));
		ctx.bezierCurveTo(toCanvasX(p1.x), toCanvasY(p1.y), toCanvasX(p2.x), toCanvasY(p2.y), toCanvasX(1), toCanvasY(1));
		ctx.stroke();

		// Draw control points
		const drawPoint = (x: number, y: number, color: string) => {
			ctx.fillStyle = color;
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(toCanvasX(x), toCanvasY(y), 8, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
		};

		// Start and end points
		drawPoint(0, 0, "#666");
		drawPoint(1, 1, "#666");

		// Control points
		drawPoint(p1.x, p1.y, "#ff6b6b");
		drawPoint(p2.x, p2.y, "#4ecdc4");

		// Draw labels
		ctx.fillStyle = "#999";
		ctx.font = "12px monospace";
		ctx.fillText("0", padding - 15, toCanvasY(0) + 4);
		ctx.fillText("1", padding - 15, toCanvasY(1) + 4);
		ctx.fillText("0", padding - 4, height - padding + 15);
		ctx.fillText("1", width - padding - 4, height - padding + 15);
		ctx.fillText(`P1 (${p1.x.toFixed(2)}, ${p1.y.toFixed(2)})`, toCanvasX(p1.x) + 12, toCanvasY(p1.y) - 8);
		ctx.fillText(`P2 (${p2.x.toFixed(2)}, ${p2.y.toFixed(2)})`, toCanvasX(p2.x) + 12, toCanvasY(p2.y) - 8);
	}, [p1, p2, yMin, yRange]);

	// Handle mouse events for dragging
	const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		// Scale mouse coordinates to match canvas internal dimensions
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		const mouseX = (e.clientX - rect.left) * scaleX;
		const mouseY = (e.clientY - rect.top) * scaleY;

		const padding = 40;
		const graphWidth = canvas.width - padding * 2;
		const graphHeight = canvas.height - padding * 2;

		const toCanvasX = (x: number) => padding + x * graphWidth;
		const toCanvasY = (y: number) => canvas.height - padding - ((y - yMin) / yRange) * graphHeight;

		// Check if clicking on P1
		const p1Distance = Math.sqrt(Math.pow(mouseX - toCanvasX(p1.x), 2) + Math.pow(mouseY - toCanvasY(p1.y), 2));
		if (p1Distance < 20) {
			setDraggingPoint(1);
			return;
		}

		// Check if clicking on P2
		const p2Distance = Math.sqrt(Math.pow(mouseX - toCanvasX(p2.x), 2) + Math.pow(mouseY - toCanvasY(p2.y), 2));
		if (p2Distance < 20) {
			setDraggingPoint(2);
			return;
		}
	};

	const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (draggingPoint === null) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		// Scale mouse coordinates to match canvas internal dimensions
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		const mouseX = (e.clientX - rect.left) * scaleX;
		const mouseY = (e.clientY - rect.top) * scaleY;

		const padding = 40;
		const graphWidth = canvas.width - padding * 2;
		const graphHeight = canvas.height - padding * 2;

		// Convert canvas coordinates to normalized coordinates (using extended Y range)
		let x = (mouseX - padding) / graphWidth;
		let y = yMin + (1 - (mouseY - padding) / graphHeight) * yRange;

		// Clamp x to [0, 1]
		x = Math.max(0, Math.min(1, x));
		// Clamp y to extended range
		y = Math.max(yMin, Math.min(yMax, y));

		if (draggingPoint === 1) {
			setP1({ x, y });
		} else if (draggingPoint === 2) {
			setP2({ x, y });
		}
	};

	const handleCanvasMouseUp = () => {
		setDraggingPoint(null);
	};

	// Animation control
	const toggleAnimation = () => {
		if (!isAnimating) {
			setIsAnimating(true);
		}
	};

	useEffect(() => {
		if (isAnimating) {
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed >= duration) {
					setIsAnimating(false);
					// Toggle position after animation completes
					setBallPosition((prev) => (prev === "left" ? "right" : "left"));
					return;
				}
				animationRef.current = requestAnimationFrame(animate);
			};
			animate();
		} else {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		}
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isAnimating, duration]);

	// Copy to clipboard
	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(cssValue);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Load preset
	const loadPreset = (preset: Preset) => {
		setP1({ x: preset.value[0], y: preset.value[1] });
		setP2({ x: preset.value[2], y: preset.value[3] });
	};

	// Random curve
	const randomCurve = () => {
		setP1({
			x: Math.random(),
			y: yMin + Math.random() * yRange,
		});
		setP2({
			x: Math.random(),
			y: yMin + Math.random() * yRange,
		});
	};

	return (
		<div className={styles.container}>
			<div className={styles.grid}>
				{/* Canvas Section */}
				<div className={styles.glassCard}>
					<h3 className={styles.sectionTitle}>Curve Editor</h3>
					<div className={styles.canvasContainer}>
						<canvas ref={canvasRef} width={500} height={700} className={styles.canvas} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} />
					</div>
					<p className={styles.hint}>Drag the control points to adjust the curve</p>
				</div>

				{/* Controls Section */}
				<div>
					{/* Control Points */}
					<div className={`${styles.glassCard} mb-6`}>
						<h3 className={styles.sectionTitle}>Control Points</h3>

						<div className={styles.controlGroup}>
							<label className={styles.controlLabel}>
								<span className={styles.pointBadge} style={{ backgroundColor: "#ff6b6b" }}>
									P1
								</span>{" "}
								Time
							</label>
							<div className={styles.inputRow}>
								<div className={styles.inputGroup}>
									<label>X</label>
									<input type="number" step="0.01" min="0" max="1" value={p1.x.toFixed(2)} onChange={(e) => setP1({ ...p1, x: parseFloat(e.target.value) || 0 })} className={styles.input} />
								</div>
								<div className={styles.inputGroup}>
									<label>Y</label>
									<input type="number" step="0.01" min="-2" max="2" value={p1.y.toFixed(2)} onChange={(e) => setP1({ ...p1, y: parseFloat(e.target.value) || 0 })} className={styles.input} />
								</div>
							</div>
						</div>

						<div className={styles.controlGroup}>
							<label className={styles.controlLabel}>
								<span className={styles.pointBadge} style={{ backgroundColor: "#4ecdc4" }}>
									P2
								</span>{" "}
								Progression
							</label>
							<div className={styles.inputRow}>
								<div className={styles.inputGroup}>
									<label>X</label>
									<input type="number" step="0.01" min="0" max="1" value={p2.x.toFixed(2)} onChange={(e) => setP2({ ...p2, x: parseFloat(e.target.value) || 0 })} className={styles.input} />
								</div>
								<div className={styles.inputGroup}>
									<label>Y</label>
									<input type="number" step="0.01" min="-2" max="2" value={p2.y.toFixed(2)} onChange={(e) => setP2({ ...p2, y: parseFloat(e.target.value) || 0 })} className={styles.input} />
								</div>
							</div>
						</div>

						<Button onClick={randomCurve} className={styles.btnSecondary} style={{ width: "100%" }}>
							<ArrowPathIcon className="w-4 h-4" />
							Random Curve
						</Button>
					</div>

					{/* Animation Preview */}
					<div className={`${styles.glassCard} mb-6`}>
						<h3 className={styles.sectionTitle}>Animation Preview</h3>
						<div className={styles.animationTrack}>
							<div
								className={`${styles.animationBall} ${ballPosition === "right" ? styles.atRight : ""} ${isAnimating ? (ballPosition === "left" ? styles.animatingRight : styles.animatingLeft) : ""}`}
								style={{
									animationDuration: `${duration}s`,
									animationTimingFunction: cssValue,
								}}
							/>
						</div>
						<div className={styles.animationControls}>
							<div className={styles.inputGroup}>
								<label>Duration (s)</label>
								<input type="number" step="0.1" min="0.1" max="10" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value) || 1)} className={styles.input} />
							</div>
							<Button onClick={toggleAnimation} className={styles.btnSecondary}>
								{isAnimating ? "Stop" : "Play"}
							</Button>
						</div>
					</div>

					{/* CSS Output */}
					<div className={styles.glassCard}>
						<h3 className={styles.sectionTitle}>CSS Output</h3>
						<div className={styles.outputBox}>
							<code>{cssValue}</code>
							<button onClick={copyToClipboard} className={`${styles.copyBtn} ${copied ? styles.copied : ""}`} title="Copy to clipboard">
								{copied ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Presets */}
			<div className={styles.glassCard} style={{ marginTop: "1.5rem" }}>
				<h3 className={styles.sectionTitle}>Presets</h3>
				<div className={styles.presetsGrid}>
					{PRESETS.map((preset) => (
						<Button key={preset.name} onClick={() => loadPreset(preset)} className={styles.presetBtn} title={`cubic-bezier(${preset.value.join(", ")})`}>
							<span className={styles.presetName}>{preset.name}</span>
							<span className={styles.presetValue}>({preset.value.map((v) => v.toFixed(2)).join(", ")})</span>
						</Button>
					))}
				</div>
			</div>

			{/* Usage Guide */}
			<div className={`${styles.glassCard} mt-6`} style={{ marginTop: "1.5rem" }}>
				<h3 className={styles.sectionTitle}>Usage in CSS</h3>
				<div className={styles.codeBlock}>
					<code>
						{`.element {
  transition: all ${duration}s ${cssValue};
}

/* Or in animations */
@keyframes slide {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}

.element {
  animation: slide ${duration}s ${cssValue};
}`}
					</code>
				</div>
			</div>
		</div>
	);
}
