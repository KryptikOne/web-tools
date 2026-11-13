import styles from "./ConstructionNotes.module.scss";

/** The standing notes every construction tool carries: actual sizes, and geometry only. */
export default function ConstructionNotes({ className = "" }: { className?: string }) {
	return (
		<aside className={`${styles.notes} ${className}`} aria-label="Notes">
			<p>All inch inputs and dimensions are actual finished sizes, not nominal. A nominal 2x4 is entered as 1 1/2 x 3 1/2.</p>
			<p>These calculators are geometric only. Check local codes and engineering requirements for sizes, spacing and loads before building.</p>
		</aside>
	);
}
