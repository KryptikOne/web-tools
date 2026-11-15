import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import BalusterCalculator from "@/features/baluster-calculator/BalusterCalculator";

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
			<BalusterCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};
const positions = () =>
	within(screen.getByRole("table", { name: "Running measurements" }))
		.getAllByRole("row")
		.slice(1)
		.map((r) => within(r).getAllByRole("cell")[2].textContent);

describe("BalusterCalculator", () => {
	it("finds the fewest balusters under a 4 inch code gap", async () => {
		const { container } = wrap();
		expect(row("Balusters")).toBe("13");
		expect(row("Gap")).toBe(`3 3/4"`);
		expect(positions()).toHaveLength(13);
		expect(await axe(container)).toHaveNoViolations();

		fireEvent.change(screen.getByLabelText("Rail angle"), { target: { value: "35" } });
		expect(screen.getByLabelText("Infill height")).toBeInTheDocument();
		expect(row("Balusters")).toBe("10");
		expect(screen.getByText("Centers along rail", { selector: "dt" })).toBeInTheDocument();
	});

	it("gives the end gap that matches an unequal panel and lists equal-gap options", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Panels" }));
		expect(row("Balusters")).toBe("7");
		expect(row("End gap")).toBe(`3 1/2"`);
		expect(positions()[0]).toBe(`4 1/4"`);
		const table = screen.getByRole("table", { name: "Options with equal gaps" });
		expect(within(table).getAllByRole("row")).toHaveLength(6);
	});

	it("sets out stair balusters tread by tread", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Stairs" }));
		expect(row("Centers")).toBe(`5"`);
		expect(row("Baluster 1 from riser")).toBe(`2 1/2"`);
		expect(row("Length step")).toBe(`3 3/4"`);
		expect(positions()).toEqual([`2 1/2"`, `7 1/2"`, `12 1/2"`, `17 1/2"`, `22 1/2"`, `27 1/2"`]);
		fireEvent.click(screen.getByRole("radio", { name: "3" }));
		expect(row("Centers")).toBe(`3 5/16"`);
		expect(positions()).toHaveLength(9);
	});
});
