/** Trigger a browser download for a Blob. Client-side only. */
export function downloadBlob(filename: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

/** Trigger a browser download of a text file. */
export function downloadTextFile(filename: string, text: string, mimeType = "text/plain"): void {
	downloadBlob(filename, new Blob([text], { type: `${mimeType};charset=utf-8` }));
}

/** Trigger a browser download of raw bytes. */
export function downloadBytes(filename: string, bytes: Uint8Array, mimeType = "application/octet-stream"): void {
	downloadBlob(filename, new Blob([bytes as BlobPart], { type: mimeType }));
}
