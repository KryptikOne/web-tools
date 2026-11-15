import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import RafterCalculator from "@/features/rafter-calculator/RafterCalculator";

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
			<RafterCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("RafterCalculator", () => {
	it("solves a 12' run at 6:12 with a 2x8 and 2' overhang", async () => {
		const { container } = wrap();
		expect(row("Roof angle")).toBe("26.57°");
		expect(row("Rise")).toBe(`6' 0"`);
		expect(row("Line length")).toBe(`13' 5"`);
		expect(row("Overall length")).toBe(`15' 7 13/16"`);
		expect(row("Heel (birdsmouth plumb)")).toBe(`1 3/4"`);
		expect(row("Height above plate")).toBe(`6 3/8"`);
		expect(screen.getByRole("img", { name: /^Birdsmouth template/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Ridge plumb cut template/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("takes the slope as an angle, switches sizes and warns on a deep birdsmouth", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Angle" }));
		fireEvent.change(screen.getByLabelText("Angle"), { target: { value: "45" } });
		expect(row("Rise")).toBe(`12' 0"`);
		fireEvent.click(screen.getByRole("radio", { name: "2x6" }));
		expect(screen.getByLabelText("Depth")).toHaveValue(`5 1/2"`);
		fireEvent.change(screen.getByLabelText("Seat"), { target: { value: "5 1/2" } });
		expect(screen.getByText(/more than a third of its depth/)).toBeInTheDocument();
		expect(screen.getByText(/wider than the wall/)).toBeInTheDocument();
	});

	it("gets the run from the building width", () => {
		wrap();
		fireEvent.change(screen.getByLabelText("Building width"), { target: { value: "24'" } });
		fireEvent.change(screen.getByLabelText("Ridge thickness"), { target: { value: "1 1/2" } });
		expect(screen.getByText(`Run 11' 11 1/4"`)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Use this run" }));
		expect(screen.getByLabelText("Run to outer wall")).toHaveValue(`11' 11 1/4"`);
	});
});
