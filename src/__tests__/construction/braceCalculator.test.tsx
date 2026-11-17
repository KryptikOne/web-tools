import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import BraceCalculator from "@/features/brace-calculator/BraceCalculator";

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
			<BraceCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("BraceCalculator", () => {
	it("braces an 8 foot square frame corner to corner", async () => {
		const { container } = wrap();
		expect(row("Brace angle")).toBe("45.00°");
		expect(row("Long point to long point")).toBe(`135 3/4"`);
		expect(row("Let-in notches")).toBe("5");
		expect(screen.getByRole("img", { name: /^Frame 96" by 96"/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Diagonal brace end cut template/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: /^Notch bottoms up each stud/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Square to the brace" }));
		expect(row("End cuts")).toBe("square");
		expect(row("Long point to long point")).toBe(`132 1/4"`);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("cuts a knee brace and its housings", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Knee brace" }));
		expect(row("Brace angle")).toBe("45.00°");
		expect(row("Long point to long point")).toBe(`37 7/16"`);
		expect(row("Housing on the post")).toMatch(/ to /);
		expect(screen.getByRole("img", { name: /^Knee brace at 45/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Knee brace post end template/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Rise and run" }));
		expect(screen.getByLabelText("Rise")).toHaveValue(`24"`);
		expect(await axe(container)).toHaveNoViolations();
	});
});
