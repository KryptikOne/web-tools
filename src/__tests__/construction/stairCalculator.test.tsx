import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import StairCalculator from "@/features/stair-calculator/StairCalculator";

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
			<StairCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};
const positions = (table: string) =>
	within(screen.getByRole("table", { name: table }))
		.getAllByRole("row")
		.slice(1)
		.map((r) => within(r).getAllByRole("cell")[2].textContent);

describe("StairCalculator", () => {
	it("solves 108\" of rise at a 7 1/2\" ideal into 14 risers", async () => {
		const { container } = wrap();
		expect(row("Risers")).toBe(`14 × 7 11/16"`);
		expect(row("Treads")).toBe(`13 × 10"`);
		expect(row("Total run")).toBe(`130"`);
		expect(row("Stair angle")).toBe("37.65°");
		expect(positions("Tread heights")).toHaveLength(13);
		expect(positions("Tread heights")[1]).toBe(`15 7/16"`);
		expect(positions("Stringer running points")).toHaveLength(14);
		expect(screen.getByRole("img", { name: /^Stringer notching template/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("takes another riser count, a level top tread and a total run", () => {
		wrap();
		fireEvent.click(screen.getByRole("button", { name: /^15 ×/ }));
		expect(row("Risers")).toBe(`15 × 7 3/16"`);
		expect(row("Treads")).toBe(`14 × 10"`);
		fireEvent.click(screen.getByRole("radio", { name: "Level with floor" }));
		expect(row("Treads")).toBe(`15 × 10"`);
		fireEvent.click(screen.getByRole("radio", { name: "Total run" }));
		fireEvent.change(screen.getByLabelText("Total run"), { target: { value: "165" } });
		expect(row("Treads")).toBe(`15 × 11"`);
	});

	it("reports headroom from the opening, warns when short, and switches to concrete", () => {
		wrap();
		expect(row("Headroom at the opening")).toBe(`82 9/16"`);
		fireEvent.change(screen.getByLabelText("Opening length slider"), { target: { value: "90" } });
		expect(row("Headroom at the opening")).toBe(`59 7/16"`);
		expect(screen.getByText(/Headroom at the opening is 59.4 in/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Concrete" }));
		// 13 steps × 7.71 × 10 / 2 + 5" waist × 169" slope = 1346 in² × 36" wide
		expect(row("Concrete")).toBe("1.04 yd³");
		expect(screen.queryByRole("img", { name: /^Stringer notching template/ })).not.toBeInTheDocument();
	});
});
