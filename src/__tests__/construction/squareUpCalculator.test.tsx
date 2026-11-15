import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import SquareUpCalculator from "@/features/square-up-calculator/SquareUpCalculator";

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
			<SquareUpCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("SquareUpCalculator", () => {
	it("gives the diagonal of a 12' by 10' rectangle and switches to a triangle", async () => {
		const { container } = wrap();
		expect(row("Diagonal")).toBe(`15' 7 7/16"`);
		expect(row("Perimeter")).toBe(`44' 0"`);
		expect(row("Area")).toBe("120.00 sq ft");
		expect(screen.getByRole("img", { name: /^Rectangle 12' 0" by 10' 0"/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();

		fireEvent.click(screen.getByRole("radio", { name: "Triangle" }));
		expect(row("Area")).toBe("60.00 sq ft");
		expect(row("Angle at side 1 end")).toBe("39.81°");
	});

	it("tells how far to slide the string on the batterboard", () => {
		wrap();
		expect(row("Correct diagonal")).toBe(`20' 0"`);
		expect(row("Out of square")).toBe(`−1 1/2"`);
		// corner closed in: move away from the reference side, ≈ 1.5 × 240/144 × 216/192 = 2.8125"
		expect(row("Move string on batterboard")).toBe(`2 13/16"`);
		expect(screen.getByText("away from the reference side")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Current diagonal (B to corner)"), { target: { value: "20'" } });
		expect(row("Move string on batterboard")).toBe("0");
		expect(screen.getByText("No move, it is square")).toBeInTheDocument();
	});
});
