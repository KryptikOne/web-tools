/** Trigger a browser download of a text file. Client-side only. */
export function downloadTextFile(filename: string, text: string, mimeType = "text/plain"): void {
	const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
