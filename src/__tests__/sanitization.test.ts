import { describe, it, expect } from "vitest";
import { sanitizeSvg, sanitizeHtml, escapeHtml } from "@/lib/sanitizeUtils";

describe("SVG sanitization", () => {
	it("removes script tags", () => {
		const input = '<svg><script>alert("xss")</script><rect/></svg>';
		expect(sanitizeSvg(input)).toBe("<svg><rect/></svg>");
	});

	it("removes script tags case-insensitively", () => {
		const input = '<svg><SCRIPT>alert("xss")</SCRIPT><rect/></svg>';
		expect(sanitizeSvg(input)).toBe("<svg><rect/></svg>");
	});

	it("removes multiline script tags", () => {
		const input = `<svg><script>
			alert("xss");
			document.cookie;
		</script><rect/></svg>`;
		expect(sanitizeSvg(input)).toBe("<svg><rect/></svg>");
	});

	it("removes onclick handlers with double quotes", () => {
		const input = '<svg><rect onclick="alert(1)"/></svg>';
		expect(sanitizeSvg(input)).toBe('<svg><rect/></svg>');
	});

	it("removes onclick handlers with single quotes", () => {
		const input = "<svg><rect onclick='alert(1)'/></svg>";
		expect(sanitizeSvg(input)).toBe("<svg><rect/></svg>");
	});

	it("removes onload handlers", () => {
		const input = '<svg onload="alert(1)"><rect/></svg>';
		expect(sanitizeSvg(input)).toBe("<svg><rect/></svg>");
	});

	it("removes onerror handlers", () => {
		const input = '<svg><image onerror="alert(1)"/></svg>';
		expect(sanitizeSvg(input)).toBe("<svg><image/></svg>");
	});

	it("preserves safe SVG content", () => {
		const input =
			'<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="red"/></svg>';
		expect(sanitizeSvg(input)).toBe(input);
	});
});

describe("HTML sanitization", () => {
	it("removes script tags", () => {
		const input = '<p>hello</p><script>alert("xss")</script>';
		expect(sanitizeHtml(input)).toBe("<p>hello</p>");
	});

	it("removes inline event handlers with double quotes", () => {
		const input = '<div onclick="alert(1)">click</div>';
		expect(sanitizeHtml(input)).toBe("<div >click</div>");
	});

	it("removes inline event handlers with single quotes", () => {
		const input = "<div onclick='alert(1)'>click</div>";
		expect(sanitizeHtml(input)).toBe("<div >click</div>");
	});

	it("removes javascript: URLs", () => {
		const input = '<a href="javascript:alert(1)">link</a>';
		expect(sanitizeHtml(input)).toBe('<a href="alert(1)">link</a>');
	});

	it("preserves safe HTML", () => {
		const input = '<p class="text">Hello <strong>world</strong></p>';
		expect(sanitizeHtml(input)).toBe(input);
	});
});

describe("HTML escaping", () => {
	it("escapes ampersands", () => {
		expect(escapeHtml("a & b")).toBe("a &amp; b");
	});

	it("escapes angle brackets", () => {
		expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
	});

	it("escapes double quotes", () => {
		expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
	});

	it("escapes all special characters together", () => {
		expect(escapeHtml('<img src="x" onerror="alert(1)">')).toBe(
			"&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;"
		);
	});

	it("leaves plain text unchanged", () => {
		expect(escapeHtml("Hello world")).toBe("Hello world");
	});
});
