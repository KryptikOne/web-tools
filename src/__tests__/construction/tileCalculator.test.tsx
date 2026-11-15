import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import TileCalculator from "@/features/tile-calculator/TileCalculator";

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
			<TileCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};
const positions = () =>
	within(screen.getByRole("table", { name: "Tile mark-out" }))
		.getAllByRole("row")
		.slice(1)
		.map((r) => within(r).getAllByRole("cell")[2].textContent);

describe("TileCalculator", () => {
	it("fits 12 inch tiles across 100 inches with even end cuts and lists the far side of each tile", async () => {
		const { container } = wrap();
		expect(row("Tiles across")).toBe("9");
		expect(row("First tile")).toBe(row("Last tile"));
		expect(positions()).toHaveLength(9);
		expect(positions()[8]).toBe(`99 3/4"`);
		expect(await axe(container)).toHaveNoViolations();

		fireEvent.change(screen.getByLabelText("Layout"), { target: { value: "wall-joint" } });
		expect(row("Tiles across")).toBe("8");
		expect(row("Gap at start wall")).toBe(`1 1/8"`);

		fireEvent.change(screen.getByLabelText("Layout"), { target: { value: "cut-first-at" } });
		expect(screen.getByLabelText("First tile ends at")).toBeInTheDocument();
		expect(positions()[0]).toBe(`8"`);
	});

	it("counts tiles, boxes and cost for a room", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Quantity" }));
		expect(row("Tiles")).toBe("10 × 8 = 80");
		expect(row("Boxes")).toBe("9");
		expect(row("Cost")).toBe("$225.00");
		expect(screen.getByRole("img", { name: /10 tiles across by 8 down/ })).toBeInTheDocument();
	});

	it("counts tiles from an area", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "By area" }));
		expect(row("Tiles to cover")).toBe("100");
		expect(row("With waste")).toBe("110");
		expect(row("Boxes")).toBe("11");
		fireEvent.change(screen.getByLabelText("Waste"), { target: { value: "0" } });
		expect(row("Boxes")).toBe("10");
	});
});
