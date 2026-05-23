import { ReactNode } from "react";
import styles from "./ToolLayout.module.scss";

interface ToolLayoutProps {
	/** @deprecated Title display is owned by the TopBar; accepted for legacy call sites but not rendered. */
	title?: string;
	description?: string;
	/** @deprecated Icon display is not used; accepted for legacy call sites but not rendered. */
	icon?: ReactNode;
	children: ReactNode;
}

export default function ToolLayout({ description, children }: ToolLayoutProps) {
	return (
		<div className={styles.container}>
			{description && (
				<header className={styles.header}>
					<p className={styles.description}>{description}</p>
				</header>
			)}
			<div className={styles.content}>{children}</div>
		</div>
	);
}
