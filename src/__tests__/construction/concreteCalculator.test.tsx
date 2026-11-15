import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import ConcreteCalculator from "@/features/concrete-calculator/ConcreteCalculator";

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
			<ConcreteCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("ConcreteCalculator", () => {
	it("totals an L-shaped slab with edge beams and rebar, and rebuilds the outline by keyboard", async () => {
		const { container } = wrap();
		// 20' × 16' less 10' × 6' notch = 260 sq ft at 4" = 86.67 ft³ ; perimeter 72' edge beam 12 × 8 extra = 48 ft³
		expect(row("Area")).toBe("260.00 sq ft");
		expect(row("Slab")).toBe("86.67 ft³");
		expect(row("Edge beams")).toBe("48.00 ft³");
		expect(row("Total concrete")).toBe("4.99 yd³");
		expect(row("Rebar")).toBe(`8 × 20' 0"`);
		expect(await axe(container)).toHaveNoViolations();

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));
		expect(screen.getByText(/Close the outline to get volumes/)).toBeInTheDocument();
		const builder = screen.getByRole("group", { name: "Slab outline builder" });
		fireEvent.change(screen.getByLabelText("Side length"), { target: { value: "10'" } });
		fireEvent.keyDown(builder, { key: "ArrowUp", shiftKey: true });
		fireEvent.keyDown(builder, { key: "ArrowRight", shiftKey: true });
		fireEvent.keyDown(builder, { key: "ArrowDown", shiftKey: true });
		expect(screen.getByText(/10' 0" W would close/)).toBeInTheDocument();
		fireEvent.keyDown(builder, { key: "c", shiftKey: true });
		expect(row("Area")).toBe("100.00 sq ft");
		expect(within(screen.getByRole("list", { name: "Sides" })).getAllByRole("listitem")).toHaveLength(4);
		fireEvent.keyDown(builder, { key: "z", shiftKey: true });
		expect(within(screen.getByRole("list", { name: "Sides" })).getAllByRole("listitem")).toHaveLength(3);
	});

	it("counts premix bags for post holes and converts bags to volume", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Premix bags" }));
		// 4 × 12" × 36" holes = 9.42 ft³ → 16 × 80 lb bags
		expect(row("Round holes")).toBe("9.42 ft³");
		expect(row("Total: 80 lb bags")).toBe("16");
		fireEvent.click(screen.getByRole("radio", { name: "60 lb" }));
		expect(row("Total: 60 lb bags")).toBe("21");
		expect(screen.getByText(/10 × 60 lb bags make 4.50 ft³/)).toBeInTheDocument();
	});

	it("totals columns and footings", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Columns" }));
		// 4 round 10" × 96" = 17.45 ft³, 4 round footings 24" × 12" = 12.57 ft³
		expect(row("Round columns")).toBe("17.45 ft³");
		expect(row("Round footings")).toBe("12.57 ft³");
		expect(row("Total")).toBe("30.02 ft³");
		expect(row("Total: 80 lb bags")).toBe("51");
	});
});
