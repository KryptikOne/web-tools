import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

describe("ToolLayout", () => {
	it("renders the description when passed", async () => {
		const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
		render(
			<ToolLayout description="Does test things">
				<p>Body</p>
			</ToolLayout>
		);
		expect(screen.getByText("Does test things")).toBeInTheDocument();
		expect(screen.getByText("Body")).toBeInTheDocument();
	});

	it("does not render the title prop (ownership moved to TopBar)", async () => {
		const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
		render(
			<ToolLayout title="Test Tool" description="Does test things">
				<p>Body</p>
			</ToolLayout>
		);
		expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
		expect(screen.queryByText("Test Tool")).not.toBeInTheDocument();
		expect(screen.getByText("Does test things")).toBeInTheDocument();
	});

	it("renders no header when description is omitted", async () => {
		const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
		render(
			<ToolLayout title="Only Title">
				<p>Body</p>
			</ToolLayout>
		);
		expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
		expect(screen.queryByText("Only Title")).not.toBeInTheDocument();
		expect(screen.getByText("Body")).toBeInTheDocument();
	});

	it("has no a11y violations", async () => {
		const { default: ToolLayout } = await import("@/components/ToolLayout/ToolLayout");
		const { container } = render(
			<ToolLayout description="Does test things">
				<p>Body</p>
			</ToolLayout>
		);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
