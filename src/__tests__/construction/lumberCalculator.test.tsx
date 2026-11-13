import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import LumberCalculator from "@/features/lumber-calculator/LumberCalculator";

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
			<LumberCalculator />
		</Provider>,
	);

const row = (label: RegExp | string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("LumberCalculator", () => {
	it("prices the default 8' 2x4 at $600 per 1000 bft and keeps a running total", async () => {
		const { container } = wrap();
		expect(row("Board feet per piece")).toBe("3.5 bft");
		expect(row("Total board feet")).toBe("35 bft");
		expect(row("Total cost")).toBe("$21.00");

		fireEvent.change(screen.getByLabelText("Pieces per pack"), { target: { value: "4" } });
		expect(row("Packs")).toBe("3");

		fireEvent.click(screen.getByRole("button", { name: "Add to total" }));
		fireEvent.click(screen.getByRole("button", { name: "Add to total" }));
		const totals = screen.getByRole("table", { name: "Running total" });
		expect(within(totals).getAllByRole("row")).toHaveLength(4); // head, two rows, foot
		expect(within(totals).getByText("20 pieces")).toBeInTheDocument();
		expect(within(totals).getByText("$42.00")).toBeInTheDocument();
		fireEvent.click(within(totals).getAllByRole("button", { name: /Remove/ })[0]);
		expect(within(totals).getByText("10 pieces")).toBeInTheDocument();

		expect(await axe(container)).toHaveNoViolations();
	});

	it("converts linear to square and square to linear with waste", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Linear and square" }));
		// 3 1/2" face x 8' = 2.333 ft²
		expect(row(/Area covered by 8' 0"/)).toBe("2.333 ft²");
		// 100 ft² of 3.5" boards = 4114.3" plus 10% = 4525.7" -> 378' rounded up, 47.1 -> 48 boards
		expect(row(/Board length to cover 100 ft²/)).toBe("378' 0\"");
		expect(row(/Boards at 8' 0"/)).toBe("48");
		expect(await axe(container)).toHaveNoViolations();
	});

	it("converts linear to cubic and follows the unit switch", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Linear and cubic" }));
		expect(row(/Volume of 8' 0"/)).toBe("0.2917 ft³");
		expect(row(/Length in 1 ft³/)).toBe("27' 5 1/8\"");
		expect(row("Log volume")).toBe("6.2832 ft³");

		fireEvent.click(screen.getByRole("radio", { name: "Metric" }));
		expect(row(/Volume of 2438.4 mm/)).toBe("0.0083 m³");
		expect((screen.getByLabelText("Volume") as HTMLInputElement).value).toBe("0.0283");
		expect(await axe(container)).toHaveNoViolations();
	});

	it("takes a custom actual size", () => {
		wrap();
		fireEvent.change(screen.getByLabelText("Size"), { target: { value: "custom" } });
		fireEvent.change(screen.getByLabelText("Thickness"), { target: { value: "1" } });
		fireEvent.change(screen.getByLabelText("Width"), { target: { value: "12" } });
		fireEvent.change(screen.getByLabelText("Piece length"), { target: { value: "1'" } });
		expect(row("Board feet per piece")).toBe("1 bft");
	});
});
