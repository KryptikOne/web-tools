import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import SpacingCalculator from "@/features/spacing-calculator/SpacingCalculator";

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
			<SpacingCalculator />
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

describe("SpacingCalculator", () => {
	it("spaces 5 members equally over 96 inches with a member at each end", async () => {
		const { container } = wrap();
		expect(row("Members")).toBe("5");
		expect(row("Centers")).toBe(`23 5/8"`);
		expect(row("Gap")).toBe(`22 1/8"`);
		expect(positions()).toEqual([`3/4"`, `24 3/8"`, `48"`, `71 5/8"`, `95 1/4"`]);
		expect(screen.getByRole("img", { name: /5 members over 96"/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("moves the count with the slider and the reference with the running list", () => {
		wrap();
		fireEvent.change(screen.getByLabelText("Member count slider"), { target: { value: "3" } });
		expect(row("Members")).toBe("3");
		expect(row("Centers")).toBe(`47 1/4"`);
		fireEvent.click(screen.getByRole("radio", { name: "Near" }));
		expect(positions()).toEqual([`0"`, `47 1/4"`, `94 1/2"`]);
	});

	it("lays out exact centers, reports the odd last space and takes an angle", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Exact centers" }));
		expect(row("Members")).toBe("7");
		expect(row("Centers")).toBe(`16"`);
		expect(row("Last space")).toBe(`13"`);
		expect(screen.getByRole("status")).toHaveTextContent(/last space is 13"/);

		fireEvent.click(screen.getByRole("radio", { name: "Adjust both ends" }));
		expect(row("First space")).toBe(`13 3/4"`);
		expect(row("Last space")).toBe(`13 3/4"`);

		fireEvent.change(screen.getByLabelText("Angle"), { target: { value: "45" } });
		expect(row("Footprint")).toBe(`2 1/8"`);
		expect(row("Square centers")).toBe(`11 5/16"`);
	});
});
