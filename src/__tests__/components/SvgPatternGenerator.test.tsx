import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

/** Pull the SVG markup back out of a `url("data:image/svg+xml,...")` value. */
function decodePreview(backgroundImage: string): string {
	const match = backgroundImage.match(/data:image\/svg\+xml,([^"]+)/);
	if (!match) throw new Error(`No data URI in: ${backgroundImage}`);
	return decodeURIComponent(match[1]);
}

describe("SvgPatternGenerator preview (TOOL-8)", () => {
	it("renders a valid pattern SVG, not a double-encoded one", async () => {
		const { default: SvgPatternGenerator } = await import(
			"@/features/svg-pattern-generator/SvgPatternGenerator"
		);
		render(<SvgPatternGenerator />);

		const svg = decodePreview(
			screen.getByTestId("pattern-preview").style.backgroundImage
		);

		expect(svg).toContain("fill='url(#p)'");
		expect(svg).toContain("width='100%'");
		expect(svg).toContain("<circle");
		expect(svg).not.toContain("%23");
		expect(svg).not.toContain("%25");
	});

	it("updates the preview when a preset is selected", async () => {
		const { default: SvgPatternGenerator } = await import(
			"@/features/svg-pattern-generator/SvgPatternGenerator"
		);
		render(<SvgPatternGenerator />);

		fireEvent.click(screen.getByRole("button", { name: "Squares" }));
		const squares = decodePreview(
			screen.getByTestId("pattern-preview").style.backgroundImage
		);
		expect(squares).toContain("<rect x=");
		expect(squares).not.toContain("<circle");

		fireEvent.click(screen.getByRole("button", { name: "Hexagons" }));
		const hex = decodePreview(
			screen.getByTestId("pattern-preview").style.backgroundImage
		);
		expect(hex).toContain("<polygon");
		expect(hex).toContain("fill='url(#p)'");
	});

	it("emits the same correctly encoded URI in the CSS snippet", async () => {
		const { default: SvgPatternGenerator } = await import(
			"@/features/svg-pattern-generator/SvgPatternGenerator"
		);
		const { container } = render(<SvgPatternGenerator />);
		const css =
			Array.from(container.querySelectorAll("code"))
				.map((el) => el.textContent ?? "")
				.find((text) => text.startsWith("background-image")) ?? "";
		const match = css.match(/data:image\/svg\+xml,([^"]+)/);
		expect(match).not.toBeNull();
		const svg = decodeURIComponent(match![1]);
		expect(svg).toContain("fill='url(#p)'");
		expect(svg).not.toContain("%2523");
	});
});
