"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseClipboardOptions {
	resetMs?: number;
}

interface UseClipboardResult {
	copy: (text: string, field?: string) => Promise<boolean>;
	copiedField: string | null;
	isCopied: (field?: string) => boolean;
	reset: () => void;
}

const DEFAULT_FIELD = "__default__";

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardResult {
	const { resetMs = 2000 } = options;
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const reset = useCallback(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setCopiedField(null);
	}, []);

	const copy = useCallback(
		async (text: string, field: string = DEFAULT_FIELD): Promise<boolean> => {
			if (!text) return false;
			try {
				await navigator.clipboard.writeText(text);
				setCopiedField(field);
				if (timeoutRef.current) clearTimeout(timeoutRef.current);
				timeoutRef.current = setTimeout(() => setCopiedField(null), resetMs);
				return true;
			} catch {
				return false;
			}
		},
		[resetMs]
	);

	const isCopied = useCallback(
		(field: string = DEFAULT_FIELD) => copiedField === field,
		[copiedField]
	);

	return { copy, copiedField, isCopied, reset };
}
