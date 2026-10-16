import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

beforeAll(() => {
	Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

describe("Tip calculator", () => {
	it("leads with the total, then each person's share when splitting, and is accessible", async () => {
		const { default: TipCalculator } = await import("@/features/tip-calculator/TipCalculator");
		const { container } = render(<TipCalculator />);

		// Readout card comes before the controls card
		const headings = container.querySelectorAll("h2");
		expect(headings[0]).toHaveTextContent("Results");
		expect(screen.getByText("Total bill")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Bill"), { target: { value: "75.48" } });
		fireEvent.click(screen.getByRole("button", { name: "15%" }));
		expect(screen.getByText("$86.80")).toBeInTheDocument(); // total
		expect(screen.getByText("$11.32")).toBeInTheDocument(); // tip

		fireEvent.click(screen.getByRole("button", { name: "One more person" }));
		expect(screen.getByText("Each person pays")).toBeInTheDocument();
		expect(screen.getByText("$43.40")).toBeInTheDocument();
		expect(screen.getByText("Tip Per Person")).toBeInTheDocument();
		expect(screen.getByText("$5.66")).toBeInTheDocument();

		// Custom dollar tip overrides the preset
		fireEvent.change(screen.getByLabelText("Custom tip amount"), { target: { value: "10" } });
		expect(screen.getByText("$10.00")).toBeInTheDocument();
		expect(screen.getByText("$42.74")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /clear/i }));
		expect((screen.getByLabelText("Bill") as HTMLInputElement).value).toBe("");

		expect(await axe(container)).toHaveNoViolations();
	});
});
