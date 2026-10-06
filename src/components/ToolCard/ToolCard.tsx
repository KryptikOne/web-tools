"use client";

import Link from "next/link";
import { Tool } from "@/types/tools";
import StarButton from "@/components/StarButton/StarButton";
import styles from "./ToolCard.module.scss";

interface ToolCardProps {
	tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
	const CardContent = (
		<>
			<div className={styles.header}>
				<h3 className={styles.title}>{tool.name}</h3>
				{tool.implemented ? (
					<StarButton toolId={tool.id} variant="card" size="sm" />
				) : (
					<span className={`${styles.badge} ${styles.comingSoonBadge}`}>Soon</span>
				)}
			</div>
			<p className={styles.description}>{tool.description}</p>
		</>
	);

	if (!tool.implemented) {
		return <div className={`${styles.card} ${styles.notImplemented}`}>{CardContent}</div>;
	}

	return (
		<Link href={tool.route} className={styles.card}>
			{CardContent}
		</Link>
	);
}
