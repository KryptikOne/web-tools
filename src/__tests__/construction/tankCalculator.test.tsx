import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import TankCalculator from "@/features/tank-calculator/TankCalculator";

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
			<TankCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("TankCalculator", () => {
	it("measures a 48 by 120 inch horizontal tank half full", async () => {
		const { container } = wrap();
		expect(row("Capacity")).toBe("916.7 US gallons");
		expect(row(`At 2' 0"`)).toMatch(/US gallons$/);
		expect(screen.getByText(/50\.\d% full/)).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^End view of the tank/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Volume against depth/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Copy chart" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("switches to a vertical tank with a cone bottom in litres", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Vertical" }));
		fireEvent.change(screen.getByLabelText("Height"), { target: { value: "96" } });
		fireEvent.click(screen.getAllByRole("radio", { name: "Cone" })[0]);
		fireEvent.change(screen.getByLabelText("Show volumes in"), { target: { value: "l" } });
		expect(row("Capacity")).toMatch(/litres$/);
		expect(screen.getByRole("img", { name: /^Side view of the tank/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Rectangular" }));
		expect(row("Capacity")).toMatch(/litres$/);
		expect(await axe(container)).toHaveNoViolations();
	});
});
