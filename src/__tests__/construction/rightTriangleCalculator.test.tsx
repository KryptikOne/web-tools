import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import RightTriangleCalculator from "@/features/right-triangle-calculator/RightTriangleCalculator";

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
			<RightTriangleCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};
/** The diagram's clickable label for a key, as opposed to the fallback button row. */
const diagramPick = (name: RegExp) => screen.getAllByRole("button", { name }).find((el) => el.tagName.toLowerCase() === "g")!;

describe("RightTriangleCalculator", () => {
	it("solves the default 12' run and 6' rise", async () => {
		const { container } = wrap();
		expect(row("Side c (slope)")).toBe(`13' 5"`);
		expect(row("Angle A (base)")).toBe("26.57°");
		expect(row("Angle B (top)")).toBe("63.43°");
		expect(row("Pitch")).toBe("6:12");
		expect(row("Area")).toBe("36.00 sq ft");
		expect(screen.getByRole("group", { name: /c = 13' 5"/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("picking a diagram label swaps the oldest input and solves from leg and hypotenuse", () => {
		wrap();
		fireEvent.click(diagramPick(/^Side c/));
		expect(diagramPick(/^Side c/)).toHaveAttribute("aria-pressed", "true");
		expect(diagramPick(/^Side b/)).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByText("Enter both known values.")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Side c (slope)"), { target: { value: "10'" } });
		expect(row("Side b (run)")).toBe(`8' 0"`);
		expect(row("Angle A (base)")).toBe("36.87°");
	});

	it("solves from a side and an angle, and refuses two angles", () => {
		wrap();
		fireEvent.keyDown(diagramPick(/^Angle A/), { key: "Enter" });
		fireEvent.change(screen.getByLabelText("Angle A (base)"), { target: { value: "45" } });
		expect(row("Side b (run)")).toBe(`6' 0"`);
		expect(row("Pitch")).toBe("12:12");

		fireEvent.click(screen.getByRole("button", { name: "Angle B (top)" }));
		expect(screen.getByText(/Two angles alone/)).toBeInTheDocument();
	});
});
