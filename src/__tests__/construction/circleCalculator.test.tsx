import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import CircleCalculator from "@/features/circle-calculator/CircleCalculator";

expect.extend(toHaveNoViolations);

beforeAll(() => {
	Object.assign(navigator, { clipboard: { writeText: async () => undefined } });
});
beforeEach(() => {
	store.dispatch(setConstructionUnitMode("in"));
	store.dispatch(setConstructionPrecision(16));
});

const wrap = () =>
	render(
		<Provider store={store}>
			<CircleCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("CircleCalculator", () => {
	it("solves a hexagon on a 24 inch radius and steps the side count", async () => {
		const { container } = wrap();
		expect(row("Side length")).toBe(`24"`);
		expect(row("Interior angle")).toBe("120.00°");
		expect(row("Apothem")).toBe(`20 13/16"`);
		expect(row("Polygon area")).toBe("1496.49 sq in");
		const list = screen.getByRole("table", { name: "Corners around the circumference" });
		expect(within(list).getAllByRole("row")).toHaveLength(7);
		expect(await axe(container)).toHaveNoViolations();

		fireEvent.click(screen.getByRole("button", { name: "More sides" }));
		expect(row("Interior angle")).toBe("128.57°");
		fireEvent.change(screen.getByLabelText("Sides"), { target: { value: "4" } });
		expect(row("Side length")).toBe(`33 15/16"`);
	});

	it("solves a circle from any one value", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Circle" }));
		expect(row("Radius")).toBe(`24"`);
		expect(row("Circumference")).toBe(`150 13/16"`);
		fireEvent.click(screen.getByRole("radio", { name: "Area" }));
		fireEvent.change(screen.getByLabelText("Area"), { target: { value: "3.14159265" } });
		expect(row("Radius")).toBe(`1"`);
		expect(row("Diameter")).toBe(`2"`);
	});

	it("solves a chord and arc from two picked values", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Chords and arcs" }));
		// default: radius 24, chord 30
		expect(row("Angle")).toBe("77.36°");
		expect(row("Arc height")).toBe(`5 1/4"`);
		fireEvent.click(screen.getByRole("button", { name: "Angle" }));
		// now chord 30 and angle 90
		expect(row("Radius")).toBe(`21 3/16"`);
		expect(screen.getByRole("button", { name: "Radius" })).toHaveAttribute("aria-pressed", "false");
	});
});
