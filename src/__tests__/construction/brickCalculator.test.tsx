import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import BrickCalculator from "@/features/brick-calculator/BrickCalculator";

expect.extend(toHaveNoViolations);

beforeAll(() => {
	Object.assign(navigator, { clipboard: { writeText: async () => undefined } });
});
beforeEach(() => {
	store.dispatch(setConstructionUnitMode("ft-in"));
	store.dispatch(setConstructionPrecision(16));
});

const wrap = () =>
	render(
		<Provider store={store}>
			<BrickCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("BrickCalculator", () => {
	it("gauges modular bricks to 8 feet and prints a rod in segments", async () => {
		const { container } = wrap();
		expect(row("Courses")).toBe("37");
		expect(row("Height reached")).toBe(`8' 0"`);
		expect(row(`Sill at 3' 0"`)).toMatch(/^course 14/);
		expect(screen.getByRole("region", { name: "Course heights mark-out" })).toBeInTheDocument();
		expect(screen.getAllByRole("img", { name: /^Gauge rod segment/ }).length).toBe(10);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("bonds a 10 foot wall with adjusted perps and draws the courses", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Bond (bricks along)" }));
		expect(row("Bricks per course")).toBe("15 / 16");
		expect(row("Bricks")).toBe("558");
		expect(screen.getByRole("img", { name: /^8 courses of brickwork/ })).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Bond pattern"), { target: { value: "flemish" } });
		expect(screen.getByText("Stretcher and header alternating in every course")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Cut the end bricks" }));
		expect(row("Perp joint")).toBe(`3/8"`);
		expect(await axe(container)).toHaveNoViolations();
	});
});
