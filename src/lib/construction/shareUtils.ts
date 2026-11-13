/**
 * Calculation state ⇄ URL hash token. JSON is deflated and base64url encoded by the same codec the
 * recipe share links use, so a long set of inputs still makes a short link.
 */
import { encodeShare, decodeShare } from "@/lib/recipeUtils/share";

export const SHARE_PARAM = "c";

export async function encodeState(state: unknown): Promise<string> {
	return encodeShare(JSON.stringify(state));
}

/** Accepts a bare token or a full hash (`#c=…`). Returns null when nothing decodes. */
export async function decodeState<T>(hashOrToken: string): Promise<T | null> {
	let token = hashOrToken.trim().replace(/^#/, "");
	if (!token) return null;
	if (token.includes("=")) {
		const params = new URLSearchParams(token);
		const value = params.get(SHARE_PARAM);
		if (!value) return null;
		token = value;
	}
	const text = await decodeShare(token);
	if (text === null) return null;
	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}

/** Build a share URL for the current page carrying the encoded state. */
export async function buildShareUrl(state: unknown, location: { origin: string; pathname: string } = window.location): Promise<string> {
	const token = await encodeState(state);
	return `${location.origin}${location.pathname}#${SHARE_PARAM}=${token}`;
}
