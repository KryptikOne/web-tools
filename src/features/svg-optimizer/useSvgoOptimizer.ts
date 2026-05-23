import { useEffect, useRef, useState } from "react";
import { gzipSync, strToU8 } from "fflate";
import type { SvgoConfig } from "./svgoConfig";

interface OptimizeResponse {
	type: "result";
	id: number;
	svg: string;
	error?: string;
}

interface UseSvgoOptimizerArgs {
	svg: string;
	config: SvgoConfig;
}

interface UseSvgoOptimizerResult {
	optimizedSvg: string;
	gzippedSize: number;
	isOptimizing: boolean;
	error: string | null;
}

const DEBOUNCE_MS = 200;

export function useSvgoOptimizer({ svg, config }: UseSvgoOptimizerArgs): UseSvgoOptimizerResult {
	const [optimizedSvg, setOptimizedSvg] = useState("");
	const [gzippedSize, setGzippedSize] = useState(0);
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const workerRef = useRef<Worker | null>(null);
	const requestIdRef = useRef(0);
	const lastDispatchedIdRef = useRef(0);

	useEffect(() => {
		if (workerRef.current) return;
		try {
			workerRef.current = new Worker(
				new URL("./svgo.worker.ts", import.meta.url),
				{ type: "module" }
			);
			workerRef.current.addEventListener("message", (event: MessageEvent<OptimizeResponse>) => {
				const { id, svg: resultSvg, error: resultError } = event.data;
				if (id !== lastDispatchedIdRef.current) return;
				setIsOptimizing(false);
				if (resultError) {
					setError(resultError);
					setOptimizedSvg("");
					setGzippedSize(0);
					return;
				}
				setError(null);
				setOptimizedSvg(resultSvg);
				try {
					const gz = gzipSync(strToU8(resultSvg));
					setGzippedSize(gz.length);
				} catch {
					setGzippedSize(0);
				}
			});
		} catch (err) {
			setError(
				err instanceof Error
					? `Failed to load optimizer worker: ${err.message}`
					: "Failed to load optimizer worker."
			);
		}

		return () => {
			workerRef.current?.terminate();
			workerRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (!svg) {
			setOptimizedSvg("");
			setGzippedSize(0);
			setError(null);
			setIsOptimizing(false);
			return;
		}
		const worker = workerRef.current;
		if (!worker) return;

		const handle = setTimeout(() => {
			requestIdRef.current += 1;
			lastDispatchedIdRef.current = requestIdRef.current;
			setIsOptimizing(true);
			worker.postMessage({
				type: "optimize",
				id: requestIdRef.current,
				svg,
				config,
			});
		}, DEBOUNCE_MS);

		return () => clearTimeout(handle);
	}, [svg, config]);

	return { optimizedSvg, gzippedSize, isOptimizing, error };
}
