"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { flushSync } from "react-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import styles from "./PrintDiagrams.module.scss";

export interface PrintDiagramsProps {
	/** Heading on the printed sheet */
	title: string;
	/** Short note printed under the heading, e.g. the inputs the drawing was made from */
	subtitle?: string;
	children: ReactNode;
	className?: string;
}

/**
 * Shows its diagrams inline and adds a "Print diagrams" button. While printing, a copy of the
 * children is portalled to a body-level root that the print stylesheet shows on its own, one
 * diagram per page, each Diagram at its declared physical size.
 */
export default function PrintDiagrams({ title, subtitle, children, className = "" }: PrintDiagramsProps) {
	const [printing, setPrinting] = useState(false);
	const [root, setRoot] = useState<HTMLElement | null>(null);

	useEffect(() => {
		document.body.classList.add("diagram-print");
		const el = document.createElement("div");
		el.setAttribute("data-print-root", "");
		document.body.appendChild(el);
		setRoot(el);
		const before = () => flushSync(() => setPrinting(true));
		const after = () => setPrinting(false);
		window.addEventListener("beforeprint", before);
		window.addEventListener("afterprint", after);
		return () => {
			window.removeEventListener("beforeprint", before);
			window.removeEventListener("afterprint", after);
			document.body.classList.remove("diagram-print");
			el.remove();
		};
	}, []);

	return (
		<div className={`${styles.wrap} ${className}`}>
			<div className={styles.header}>
				<h3 className={styles.title}>{title}</h3>
				<button type="button" className={styles.btn} onClick={() => window.print()} title="Print at 100% scale or save as PDF">
					<PrinterIcon className="w-4 h-4" />
					Print diagrams
				</button>
			</div>
			<p className={styles.hint}>Printing uses the real sizes. Set the printer scale to 100% and check one dimension with a tape before cutting.</p>
			<div className={styles.grid}>{children}</div>

			{printing &&
				root &&
				createPortal(
					<div className={styles.sheet}>
						<h1 className={styles.sheetTitle}>{title}</h1>
						{subtitle && <p className={styles.sheetSub}>{subtitle}</p>}
						{Children.map(children, (child, i) => (
							<div key={i} className="diagram-print-page">
								{child}
							</div>
						))}
					</div>,
					root,
				)}
		</div>
	);
}
