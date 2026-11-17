import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import WainscotCalculator from "@/features/wainscot-calculator/WainscotCalculator";

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
			<WainscotCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("WainscotCalculator", () => {
	it("frames four panels on a 10 foot wall", async () => {
		const { container } = wrap();
		expect(row("Panels")).toBe("4");
		expect(row("Panel width")).toBe(`26 1/4"`);
		expect(row("Opening height")).toBe(`28"`);
		expect(screen.getByRole("img", { name: /^Wainscoting elevation/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Stile positions, near face mark-out" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Target width" }));
		fireEvent.change(screen.getByLabelText("Target panel width"), { target: { value: "16" } });
		expect(row("Panels")).toBe("6");
		expect(await axe(container)).toHaveNoViolations();
	});

	it("runs panels up a stair wall", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Stair wall" }));
		expect(row("Rake")).toBe("36.87°");
		expect(row("Panels")).toBe("12");
		expect(row("Stile end cuts")).toBe("36.87°");
		expect(screen.getByRole("img", { name: /^Stair wainscoting/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Stile positions along the rake mark-out" })).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Panels per tread"), { target: { value: "2" } });
		expect(row("Panels")).toBe("24");
		expect(await axe(container)).toHaveNoViolations();
	});
});
