import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import ShelfCalculator from "@/features/shelf-calculator/ShelfCalculator";

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
			<ShelfCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("ShelfCalculator", () => {
	it("spaces five equal openings in a 70 inch carcass", async () => {
		const { container } = wrap();
		expect(row("Shelves")).toBe("4");
		expect(row("Each opening")).toBe(`13 3/8"`);
		expect(row("Closes")).toBe("yes");
		expect(screen.getByRole("img", { name: /^Carcass 70" inside/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Shelf undersides from the inside bottom mark-out" })).toBeInTheDocument();
		expect(screen.getAllByRole("img", { name: /^Story stick segment/ }).length).toBe(8);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("graduates and sets openings", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Graduated" }));
		expect(row("Openings")).toBe(`10 3/8" to 16 3/8"`);
		fireEvent.click(screen.getByRole("radio", { name: "Ratio" }));
		expect(row("Openings")).toMatch(/ to /);
		fireEvent.click(screen.getByRole("radio", { name: "Set heights" }));
		expect(screen.getByLabelText("Opening 4")).toBeInTheDocument();
		expect(row("Last opening")).toBe(`15"`);
		fireEvent.click(screen.getByRole("radio", { name: "Centre" }));
		expect(screen.getByRole("region", { name: "Shelf centres from the inside bottom mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});
