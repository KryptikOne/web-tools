import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

beforeAll(() => {
	class FakeWorker {
		onmessage: ((ev: MessageEvent) => void) | null = null;
		addEventListener() {}
		removeEventListener() {}
		postMessage() {}
		terminate() {}
	}
	// @ts-expect-error replacing the global
	global.Worker = FakeWorker;
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

beforeEach(() => {
	localStorage.clear();
});

describe("SvgOptimizer", () => {
	it("renders all major sections", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		render(<SvgOptimizer />);
		expect(screen.getByText(/SVG Input/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Upload SVG/i })).toBeInTheDocument();
		expect(screen.getByText(/Global settings/i)).toBeInTheDocument();
		expect(screen.getByText(/Plugins/i)).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /Image/i })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: /Code/i })).toBeInTheDocument();
	});

	it("has no a11y violations on initial render", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		const { container } = render(<SvgOptimizer />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
