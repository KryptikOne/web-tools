import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn() }),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn().mockResolvedValue("") },
	});
});

describe("Time duration calculator", () => {
	it("renders live time rows, keeps both date modes, and has no a11y violations", async () => {
		const { default: TimeDurationCalculator } = await import("@/features/time-duration-calculator/TimeDurationCalculator");
		const { container } = render(<TimeDurationCalculator />);

		// Live unit rows: edit one, the rest follow (1 hour by default)
		const row = (id: string) => container.querySelector<HTMLInputElement>(`#unit-time-${id}`)!;
		expect(row("hr").value).toBe("1");
		expect(row("min").value).toBe("60");
		expect(row("s").value).toBe("3600");
		fireEvent.change(row("day"), { target: { value: "2" } });
		expect(row("hr").value).toBe("48");
		expect(row("ms").value).toBe("172,800,000");

		// Date difference is the default date mode (09:00 to 17:00 today = 8 hours)
		expect(screen.getByRole("radio", { name: "Date Difference" })).toHaveAttribute("aria-checked", "true");
		expect(screen.getByLabelText("Start date")).toBeInTheDocument();
		expect(screen.getByText("8")).toBeInTheDocument();

		// Add / Subtract mode still exists
		fireEvent.click(screen.getByRole("radio", { name: "Add / Subtract" }));
		expect(screen.getByLabelText("Starting date")).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Days", { selector: "input[type=number]" }), { target: { value: "1" } });
		expect(screen.getByText(/^Result:/)).toBeInTheDocument();

		expect(await axe(container)).toHaveNoViolations();
	});
});
