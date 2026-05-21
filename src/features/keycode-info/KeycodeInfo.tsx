"use client";

import { useCallback, useRef, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import styles from "./KeycodeInfo.module.scss";

interface KeyEventInfo {
	id: number;
	key: string;
	code: string;
	keyCode: number;
	which: number;
	location: number;
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
	repeat: boolean;
	timestamp: number;
}

const PREVENT_DEFAULT_KEYS = new Set([
	"Space",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Tab",
	"PageUp",
	"PageDown",
	"Home",
	"End",
]);

const LOCATION_NAMES: Record<number, string> = {
	0: "Standard",
	1: "Left",
	2: "Right",
	3: "Numpad",
};

function formatKey(key: string): string {
	if (key === " ") return "Space";
	return key;
}

export default function KeycodeInfo() {
	const [latest, setLatest] = useState<KeyEventInfo | null>(null);
	const [history, setHistory] = useState<KeyEventInfo[]>([]);
	const [focused, setFocused] = useState(false);
	const captureRef = useRef<HTMLDivElement>(null);
	const idRef = useRef(0);

	const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
		if (PREVENT_DEFAULT_KEYS.has(event.code)) {
			event.preventDefault();
		}

		const info: KeyEventInfo = {
			id: idRef.current++,
			key: event.key,
			code: event.code,
			keyCode: event.keyCode,
			which: event.which,
			location: event.location,
			ctrlKey: event.ctrlKey,
			altKey: event.altKey,
			shiftKey: event.shiftKey,
			metaKey: event.metaKey,
			repeat: event.repeat,
			timestamp: Date.now(),
		};

		setLatest(info);
		setHistory((prev) => [info, ...prev].slice(0, 12));
	}, []);

	const handleClear = () => {
		setLatest(null);
		setHistory([]);
	};

	const focusCapture = () => captureRef.current?.focus();

	return (
		<div className={styles.container}>
			<div
				ref={captureRef}
				tabIndex={0}
				role="button"
				aria-label="Press any key — captures keyboard events"
				onKeyDown={handleKeyDown}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onClick={focusCapture}
				className={`${styles.captureArea} ${focused ? styles.captureFocused : ""}`}
			>
				{latest ? (
					<>
						<div className={styles.captureKey}>{formatKey(latest.key)}</div>
						<div className={styles.captureCode}>{latest.code || "—"}</div>
					</>
				) : (
					<>
						<div className={styles.capturePrompt}>
							{focused ? "Press any key" : "Click here, then press any key"}
						</div>
						<div className={styles.captureHint}>
							Arrow / space / tab won&apos;t scroll the page while focused.
						</div>
					</>
				)}
			</div>

			{latest && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<div className="flex items-center justify-between mb-4 flex-wrap gap-3">
						<h3 className={`text-lg font-semibold m-0 ${styles.cardTitle}`}>
							Event details
						</h3>
						<button type="button" className={styles.btnSecondary} onClick={handleClear}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>

					<div className={styles.fieldGrid}>
						<DetailField label="event.key" value={formatKey(latest.key)} mono styles={styles} />
						<DetailField label="event.code" value={latest.code || "(empty)"} mono styles={styles} />
						<DetailField label="event.keyCode" value={String(latest.keyCode)} mono styles={styles} />
						<DetailField label="event.which" value={String(latest.which)} mono styles={styles} />
						<DetailField
							label="event.location"
							value={`${latest.location} (${LOCATION_NAMES[latest.location] ?? "Unknown"})`}
							styles={styles}
						/>
						<DetailField
							label="event.repeat"
							value={latest.repeat ? "true" : "false"}
							styles={styles}
						/>
					</div>

					<h4 className={`mt-5 mb-2 text-sm font-semibold ${styles.cardTitle}`}>
						Modifiers
					</h4>
					<div className={styles.modGrid}>
						<ModBadge label="Ctrl" active={latest.ctrlKey} styles={styles} />
						<ModBadge label="Alt" active={latest.altKey} styles={styles} />
						<ModBadge label="Shift" active={latest.shiftKey} styles={styles} />
						<ModBadge label="Meta" active={latest.metaKey} styles={styles} />
					</div>
				</div>
			)}

			{history.length > 0 && (
				<div className={`mt-4 ${styles.glassCard}`}>
					<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
						Recent presses
					</h3>
					<div className={styles.historyList}>
						<div className={`${styles.historyRow} ${styles.historyHeader}`}>
							<div>key</div>
							<div>code</div>
							<div>keyCode</div>
							<div>location</div>
						</div>
						{history.map((h) => (
							<div key={h.id} className={styles.historyRow}>
								<code className={styles.mono}>{formatKey(h.key)}</code>
								<code className={styles.mono}>{h.code || "—"}</code>
								<code className={styles.mono}>{h.keyCode}</code>
								<span>{LOCATION_NAMES[h.location] ?? h.location}</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-4 m-0 ${styles.cardTitle}`}>
					About KeyboardEvent
				</h3>
				<div className={`grid grid-cols-2 gap-6 ${styles.infoGrid}`}>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							key vs code
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							<code>event.key</code> is the printable character produced by the
							key (layout-aware). <code>event.code</code> is the physical key on
							the keyboard (layout-independent), e.g. <code>KeyA</code>.
						</p>
					</div>
					<div>
						<h4 className={`font-semibold mb-2 m-0 ${styles.infoSubtitle}`}>
							keyCode / which
						</h4>
						<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
							<code>keyCode</code> and <code>which</code> are legacy fields kept
							for compatibility. Prefer <code>key</code> / <code>code</code> in
							new code.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function DetailField({
	label,
	value,
	mono,
	styles,
}: {
	label: string;
	value: string;
	mono?: boolean;
	styles: Record<string, string>;
}) {
	return (
		<div className={styles.detailField}>
			<div className={styles.detailLabel}>{label}</div>
			<div className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>{value}</div>
		</div>
	);
}

function ModBadge({
	label,
	active,
	styles,
}: {
	label: string;
	active: boolean;
	styles: Record<string, string>;
}) {
	return (
		<div className={`${styles.modBadge} ${active ? styles.modActive : ""}`}>{label}</div>
	);
}
