/**
 * Remove <script> tags and on* event handler attributes from SVG strings.
 */
export function sanitizeSvg(svg: string): string {
	let sanitized = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
	sanitized = sanitized.replace(
		/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
		""
	);
	return sanitized;
}

/**
 * Remove <script> tags, on* event handlers, and javascript: URLs from HTML strings.
 */
export function sanitizeHtml(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/on\w+="[^"]*"/gi, "")
		.replace(/on\w+='[^']*'/gi, "")
		.replace(/javascript:/gi, "");
}

/**
 * Escape HTML special characters (&, <, >, ") for safe rendering.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
