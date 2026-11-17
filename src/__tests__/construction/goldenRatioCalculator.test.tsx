import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import GoldenRatioCalculator from "@/features/golden-ratio-calculator/GoldenRatioCalculator";

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
			<GoldenRatioCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("GoldenRatioCalculator", () => {
	it("steps six members under a 6:12 line", async () => {
		const { container } = wrap();
		expect(row("Members")).toBe("6");
		expect(row("Common difference")).toBe(`8"`);
		expect(row("Cut angle")).toBe("26.57°");
		expect(screen.getByRole("img", { name: /^6 members from 36"/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Member lengths mark-out" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Shorter" }));
		expect(screen.getByRole("img", { name: /to -4"|to 0"/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("divides a length by the golden ratio", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Golden ratio" }));
		expect(row("Long part")).toBe(`29 11/16"`);
		expect(row("Short part")).toBe(`18 5/16"`);
		expect(screen.getByRole("img", { name: /^Golden rectangle/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Short part" }));
		expect(screen.getByLabelText("Short part")).toHaveValue(`18 5/16"`);
		expect(await axe(container)).toHaveNoViolations();
	});
});
