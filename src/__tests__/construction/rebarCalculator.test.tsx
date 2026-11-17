import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import RebarCalculator from "@/features/rebar-calculator/RebarCalculator";

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
			<RebarCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("RebarCalculator", () => {
	it("grids a 20 by 12 foot slab with #4 at 12 inches", async () => {
		const { container } = wrap();
		expect(row("Bars along")).toBe("13");
		expect(row("Bars across")).toBe("21");
		expect(row("Lap")).toBe(`1' 8"`);
		expect(row("Chairs")).toBe("80");
		expect(screen.getByRole("img", { name: /^Rebar plan/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Section/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Lap splice/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Bars along, from the long edge mark-out" })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Bars across, from the end mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("cages a footing with ties and prices by the pound", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Footing cage" }));
		fireEvent.change(screen.getByLabelText("Length"), { target: { value: "40'" } });
		fireEvent.change(screen.getByLabelText("Width"), { target: { value: "24" } });
		fireEvent.change(screen.getByLabelText("Depth"), { target: { value: "12" } });
		fireEvent.change(screen.getByLabelText("Cover"), { target: { value: "3" } });
		fireEvent.click(screen.getByRole("radio", { name: "Count" }));
		fireEvent.change(screen.getByLabelText("Bars along"), { target: { value: "4" } });
		expect(row("Bars along")).toBe("4");
		expect(row("Ties")).toBe("21");
		expect(screen.getByText(/spliced with/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Pound" }));
		expect(row("Cost")).toMatch(/^\$/);
		expect(screen.getByRole("region", { name: "Ties, from the end mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});
