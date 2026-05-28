"use client";

import { useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import styles from "./SidebarSearch.module.scss";

interface SidebarSearchProps {
	query: string;
	onQueryChange: (value: string) => void;
	onSubmit: () => void;
	matchCount: number;
}

export default function SidebarSearch({ query, onQueryChange, onSubmit, matchCount }: SidebarSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	// Global `/` shortcut to focus the search (skip when typing in another field).
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key !== "/") return;
			const target = e.target as HTMLElement | null;
			if (target) {
				const tag = target.tagName;
				if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
					return;
				}
			}
			e.preventDefault();
			inputRef.current?.focus();
			inputRef.current?.select();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			if (query) {
				e.preventDefault();
				onQueryChange("");
			} else {
				inputRef.current?.blur();
			}
		} else if (e.key === "Enter") {
			e.preventDefault();
			onSubmit();
		}
	};

	return (
		<div className={styles.wrapper}>
			<label className={styles.field}>
				<span className="sr-only">Search tools</span>
				<MagnifyingGlassIcon className={styles.icon} aria-hidden="true" />
				<input
					ref={inputRef}
					type="text"
					className={styles.input}
					placeholder="Search tools…"
					value={query}
					onChange={(e) => onQueryChange(e.target.value)}
					onKeyDown={handleKeyDown}
					spellCheck={false}
					autoComplete="off"
					aria-label="Search tools"
				/>
				{query && (
					<button
						type="button"
						className={styles.clear}
						onClick={() => {
							onQueryChange("");
							inputRef.current?.focus();
						}}
						aria-label="Clear search"
					>
						<XMarkIcon />
					</button>
				)}
				{!query && <kbd className={styles.kbd} aria-hidden="true">/</kbd>}
			</label>
			<span className={styles.srStatus} role="status" aria-live="polite">
				{query ? `${matchCount} ${matchCount === 1 ? "tool" : "tools"} match` : ""}
			</span>
		</div>
	);
}
