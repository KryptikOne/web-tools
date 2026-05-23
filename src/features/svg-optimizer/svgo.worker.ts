/// <reference lib="webworker" />

// Import the browser-safe SVGO build directly so neither webpack nor
// Turbopack tries to bundle svgo-node.js (which uses fs/path/url).
import { optimize } from "svgo/lib/svgo.js";
import type { SvgoConfig } from "./svgoConfig";

interface OptimizeRequest {
	type: "optimize";
	id: number;
	svg: string;
	config: SvgoConfig;
}

interface OptimizeResponse {
	type: "result";
	id: number;
	svg: string;
	error?: string;
}

self.addEventListener("message", (event: MessageEvent<OptimizeRequest>) => {
	const { id, svg, config } = event.data;
	try {
		const result = optimize(svg, config as Parameters<typeof optimize>[1]);
		const message: OptimizeResponse = { type: "result", id, svg: result.data };
		(self as unknown as Worker).postMessage(message);
	} catch (err) {
		const message: OptimizeResponse = {
			type: "result",
			id,
			svg: "",
			error: err instanceof Error ? err.message : "Unknown error during SVG optimization",
		};
		(self as unknown as Worker).postMessage(message);
	}
});

export type { OptimizeRequest, OptimizeResponse };
