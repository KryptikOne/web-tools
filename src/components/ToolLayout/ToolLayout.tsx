import { ReactNode } from "react";
import styles from "./ToolLayout.module.scss";

interface ToolLayoutProps {
	title?: string;
	description?: string;
	icon?: ReactNode;
	children: ReactNode;
}

export default function ToolLayout({ children }: ToolLayoutProps) {
	return (
		<div className={styles.container}>
			<div className={styles.content}>{children}</div>
		</div>
	);
}
