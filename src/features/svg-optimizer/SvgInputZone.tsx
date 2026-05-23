"use client";

import { useRef, useState } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { DEMO_SVGS } from "./demoSvgs";
import styles from "./SvgInputZone.module.scss";

interface SvgInputZoneProps {
	value: string;
	onChange: (svg: string) => void;
	onClear: () => void;
}

export default function SvgInputZone({ value, onChange, onClear }: SvgInputZoneProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragOver, setDragOver] = useState(false);

	const handleFileUpload = (file: File) => {
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result;
			if (typeof text === "string") onChange(text);
		};
		reader.readAsText(file);
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFileUpload(file);
		e.target.value = "";
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
		const file = e.dataTransfer.files[0];
		if (file && file.name.endsWith(".svg")) handleFileUpload(file);
	};

	const handleDemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const id = e.target.value;
		if (!id) return;
		const demo = DEMO_SVGS.find((d) => d.id === id);
		if (demo) onChange(demo.svg);
		e.target.value = "";
	};

	return (
		<div className={styles.zone}>
			<div className={styles.header}>
				<h2>SVG Input</h2>
				<div className={styles.headerActions}>
					<button
						type="button"
						className={styles.uploadButton}
						onClick={() => fileInputRef.current?.click()}
					>
						<ArrowUpTrayIcon className="w-4 h-4" />
						Upload SVG
					</button>
					<select
						className={styles.demoSelect}
						onChange={handleDemoSelect}
						defaultValue=""
						aria-label="Load demo SVG"
					>
						<option value="" disabled>
							Load demo…
						</option>
						{DEMO_SVGS.map((demo) => (
							<option key={demo.id} value={demo.id}>
								{demo.name}
							</option>
						))}
					</select>
					{value && (
						<button type="button" className={styles.uploadButton} onClick={onClear}>
							Clear
						</button>
					)}
				</div>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept=".svg"
				className="hidden"
				aria-label="Upload SVG file"
				onChange={handleFileInput}
			/>

			{!value && (
				<div
					className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
					tabIndex={0}
					role="button"
					onClick={() => fileInputRef.current?.click()}
					onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
				>
					<ArrowUpTrayIcon className={`w-8 h-8 mx-auto mb-2 ${styles.uploadIcon}`} />
					<p className="text-sm">Drag and drop an SVG file, click to upload, or paste below</p>
				</div>
			)}

			<textarea
				className={styles.textarea}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Paste your SVG code here…"
				spellCheck={false}
				aria-label="SVG source input"
			/>
		</div>
	);
}
