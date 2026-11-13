"use client";

import { useEffect, useRef, useState } from "react";
import { LinkIcon, QrCodeIcon, CheckIcon } from "@heroicons/react/24/outline";
import QRCode from "qrcode";
import { useClipboard } from "@/hooks/useClipboard";
import { buildShareUrl, decodeState } from "@/lib/construction/shareUtils";
import styles from "./ShareCalculation.module.scss";

export interface ShareCalculationProps<T> {
	/** The inputs to encode into the link */
	state: T;
	/** Called once on mount when the page URL carries a shared calculation */
	onLoad?: (state: T) => void;
	className?: string;
}

/**
 * "Copy link" and a QR code for the current calculation. The link carries every input in its hash,
 * so it opens the same numbers on another device.
 */
export default function ShareCalculation<T>({ state, onLoad, className = "" }: ShareCalculationProps<T>) {
	const { copy, isCopied } = useClipboard();
	const [qr, setQr] = useState<string | null>(null);
	const [showQr, setShowQr] = useState(false);
	const loaded = useRef(false);

	useEffect(() => {
		if (loaded.current || !onLoad) return;
		loaded.current = true;
		const hash = window.location.hash;
		if (!hash) return;
		decodeState<T>(hash).then((s) => {
			if (s !== null) onLoad(s);
		});
	}, [onLoad]);

	useEffect(() => {
		if (!showQr) return;
		let cancelled = false;
		buildShareUrl(state)
			.then((url) => QRCode.toDataURL(url, { margin: 1, width: 220 }))
			.then((dataUrl) => {
				if (!cancelled) setQr(dataUrl);
			})
			.catch(() => setQr(null));
		return () => {
			cancelled = true;
		};
	}, [showQr, state]);

	const copyLink = async () => {
		const url = await buildShareUrl(state);
		window.history.replaceState(null, "", url);
		copy(url);
	};

	return (
		<div className={`${styles.wrap} ${className}`}>
			<div className="flex flex-wrap items-center gap-2">
				<button type="button" className={styles.btn} onClick={copyLink}>
					{isCopied() ? <CheckIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
					{isCopied() ? "Link copied" : "Copy link"}
				</button>
				<button type="button" className={styles.btn} onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
					<QrCodeIcon className="w-4 h-4" />
					QR code
				</button>
				<span className={styles.note}>The link carries every input, so it opens the same calculation on a phone.</span>
			</div>
			{showQr && (
				<div className={styles.qr}>
					{qr ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={qr} alt="QR code for a link to this calculation" width={220} height={220} />
					) : (
						<span className={styles.note}>Building QR code…</span>
					)}
				</div>
			)}
		</div>
	);
}
