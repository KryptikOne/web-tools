"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SvgInputZone from "./SvgInputZone";
import SvgPreviewPanes from "./SvgPreviewPanes";
import SvgGlobalSettings from "./SvgGlobalSettings";
import SvgPluginList from "./SvgPluginList";
import { useSvgoOptimizer } from "./useSvgoOptimizer";
import { buildSvgoConfig } from "./svgoConfig";
import {
	loadSvgoState,
	saveSvgoState,
	getDefaultSvgoState,
	type SvgoState,
} from "./svgoStorage";
import styles from "./SvgOptimizer.module.scss";

export default function SvgOptimizer() {
	const [inputSvg, setInputSvg] = useState("");
	const [state, setState] = useState<SvgoState>(() => loadSvgoState());
	const [copiedField, setCopiedField] = useState<string | null>(null);

	useEffect(() => {
		saveSvgoState(state);
	}, [state]);

	const config = useMemo(() => buildSvgoConfig(state), [state]);

	const { optimizedSvg, gzippedSize, isOptimizing, error } = useSvgoOptimizer({
		svg: inputSvg,
		config,
	});

	const handlePluginToggle = useCallback((id: string, enabled: boolean) => {
		setState((prev) => ({
			...prev,
			plugins: { ...prev.plugins, [id]: enabled },
		}));
	}, []);

	const handleSettingsChange = useCallback(
		(changes: Partial<{ multipass: boolean; pretty: boolean; indent: number; floatPrecision: number }>) => {
			setState((prev) => ({ ...prev, ...changes }));
		},
		[]
	);

	const handleReset = useCallback(() => {
		setState(getDefaultSvgoState());
	}, []);

	const handleClear = useCallback(() => {
		setInputSvg("");
	}, []);

	const handleCopy = useCallback(async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch {
			// ignore
		}
	}, []);

	const handleCopyCode = useCallback(() => {
		if (optimizedSvg) handleCopy(optimizedSvg, "code");
	}, [optimizedSvg, handleCopy]);

	const handleCopyDataUrl = useCallback(() => {
		if (!optimizedSvg) return;
		const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(optimizedSvg)))}`;
		handleCopy(dataUrl, "dataurl");
	}, [optimizedSvg, handleCopy]);

	const handleDownload = useCallback(() => {
		if (!optimizedSvg) return;
		const blob = new Blob([optimizedSvg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "optimized.svg";
		a.click();
		URL.revokeObjectURL(url);
	}, [optimizedSvg]);

	return (
		<div className={styles.container}>
			<SvgInputZone value={inputSvg} onChange={setInputSvg} onClear={handleClear} />

			<SvgPreviewPanes
				original={inputSvg}
				optimized={optimizedSvg}
				gzippedSize={gzippedSize}
				error={error}
				isOptimizing={isOptimizing}
			/>

			<div className={styles.actionsRow}>
				<button
					type="button"
					className={`${styles.actionButton} ${copiedField === "code" ? styles.copied : ""}`}
					onClick={handleCopyCode}
					disabled={!optimizedSvg}
				>
					{copiedField === "code" ? "Copied!" : "Copy code"}
				</button>
				<button
					type="button"
					className={`${styles.actionButton} ${copiedField === "dataurl" ? styles.copied : ""}`}
					onClick={handleCopyDataUrl}
					disabled={!optimizedSvg}
				>
					{copiedField === "dataurl" ? "Copied!" : "Copy data URL"}
				</button>
				<button
					type="button"
					className={styles.actionButton}
					onClick={handleDownload}
					disabled={!optimizedSvg}
				>
					Download
				</button>
			</div>

			<div className={styles.optionsPanel}>
				<SvgGlobalSettings
					multipass={state.multipass}
					pretty={state.pretty}
					indent={state.indent}
					floatPrecision={state.floatPrecision}
					onChange={handleSettingsChange}
				/>
				<SvgPluginList plugins={state.plugins} onToggle={handlePluginToggle} />
				<button type="button" className={styles.resetButton} onClick={handleReset}>
					Reset to defaults
				</button>
			</div>
		</div>
	);
}
