import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

let mockPath = "/tools/diff-checker";
vi.mock("next/navigation", () => ({ usePathname: () => mockPath }));

const readJsonLd = (container: HTMLElement) => {
	const el = container.querySelector('script[type="application/ld+json"]');
	return el ? JSON.parse(el.innerHTML) : null;
};

describe("ToolStructuredData", () => {
	beforeEach(() => {
		mockPath = "/tools/diff-checker";
	});

	it("renders WebApplication JSON-LD for the current tool", async () => {
		const { default: ToolStructuredData } = await import("@/components/JsonLd/ToolStructuredData");
		const { container } = render(<ToolStructuredData />);
		const ld = readJsonLd(container);
		expect(ld["@graph"][0]).toMatchObject({
			"@type": "WebApplication",
			name: "Diff Checker",
			url: "https://bittbott.dev/tools/diff-checker",
		});
	});

	it.each(["/tools", "/styleguide", "/"])("renders nothing on non-tool path %s", async (p) => {
		mockPath = p;
		const { default: ToolStructuredData } = await import("@/components/JsonLd/ToolStructuredData");
		const { container } = render(<ToolStructuredData />);
		expect(readJsonLd(container)).toBeNull();
	});
});
