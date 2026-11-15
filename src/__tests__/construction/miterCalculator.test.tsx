import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import MiterCalculator from "@/features/miter-calculator/MiterCalculator";

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
			<MiterCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("MiterCalculator", () => {
	it("splits a square corner at 45° for equal widths and moves off it for unequal", async () => {
		const { container } = wrap();
		expect(row("Piece 1 miter")).toBe("45.00°");
		expect(row("Joint length")).toBe(`4 15/16"`);
		expect(screen.getByRole("img", { name: /^Piece 1 saw 45.00°/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /true size$/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();

		fireEvent.change(screen.getByLabelText("Width 2"), { target: { value: "7" } });
		expect(row("Piece 1 miter")).toBe("26.57°");
		expect(row("Piece 2 miter")).toBe("63.43°");
	});

	it("gives the standard compound settings and a template", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Compound miter" }));
		expect(row("Saw miter")).toBe("35.26°");
		expect(row("Saw bevel")).toBe("30.00°");
		expect(row("Base edge length")).toBe(`12"`);
		expect(row("Top edge length")).toBe(`4"`);
		expect(screen.getByRole("img", { name: /^4-sided form turned 30°/ })).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Sides"), { target: { value: "6" } });
		fireEvent.change(screen.getByLabelText("Side angle"), { target: { value: "60" } });
		expect(row("Saw miter")).toBe("16.10°");
		expect(row("Saw bevel")).toBe("48.59°");

		fireEvent.change(screen.getByLabelText("Height"), { target: { value: "40" } });
		expect(screen.getByText(/sides would meet/)).toBeInTheDocument();
	});
});
