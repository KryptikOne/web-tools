import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the user's reduced-motion preference.
 * Returns `null` during SSR/first render (unknown), then a boolean that follows OS changes.
 */
export function usePrefersReducedMotion(): boolean | null {
	const [reduced, setReduced] = useState<boolean | null>(null);

	useEffect(() => {
		const mq = window.matchMedia(QUERY);
		const update = () => setReduced(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	return reduced;
}
