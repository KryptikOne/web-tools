/** Recipe text ⇄ URL hash, compressed with the browser's built-in deflate. */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function pump(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		total += value.length;
	}
	const out = new Uint8Array(total);
	let pos = 0;
	for (const c of chunks) {
		out.set(c, pos);
		pos += c.length;
	}
	return out;
}

function byteStream(bytes: Uint8Array): ReadableStream<BufferSource> {
	return new ReadableStream<BufferSource>({
		start(controller) {
			controller.enqueue(bytes as unknown as BufferSource);
			controller.close();
		},
	});
}

function toBase64Url(bytes: Uint8Array): string {
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
	const b64 = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
	const bin = atob(b64);
	return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export const SHARE_PARAM = "r";

/** Compress recipe text into a URL-safe token (no leading "#r="). */
export async function encodeShare(text: string): Promise<string> {
	const stream = byteStream(encoder.encode(text)).pipeThrough(new CompressionStream("deflate-raw"));
	return toBase64Url(await pump(stream));
}

/** Read a token or a full hash ("#r=…"); returns null when it cannot be decoded. */
export async function decodeShare(hashOrToken: string): Promise<string | null> {
	try {
		let token = hashOrToken.trim().replace(/^#/, "");
		const m = token.match(new RegExp(`(?:^|&)${SHARE_PARAM}=([^&]+)`));
		if (m) token = m[1];
		if (!token) return null;
		const bytes = fromBase64Url(decodeURIComponent(token));
		const stream = byteStream(bytes).pipeThrough(new DecompressionStream("deflate-raw"));
		const text = decoder.decode(await pump(stream));
		return text || null;
	} catch {
		return null;
	}
}
