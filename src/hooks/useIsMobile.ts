import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the viewport is mobile-sized.
 * Returns `null` during SSR/initial render to avoid hydration mismatches,
 * then resolves to a boolean once client-side.
 *
 * @param breakpoint - Width threshold in pixels (default: 768)
 * @returns `null` during SSR, `true` if mobile, `false` if desktop
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean | null {
	const [isMobile, setIsMobile] = useState<boolean | null>(null);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < breakpoint);
		};

		// Initial check
		checkMobile();

		// Listen for resize
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, [breakpoint]);

	return isMobile;
}
