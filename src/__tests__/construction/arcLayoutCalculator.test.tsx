import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import ArcLayoutCalculator from "@/features/arc-layout-calculator/ArcLayoutCalculator";

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
			<ArcLayoutCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("ArcLayoutCalculator", () => {
	it("sets out an arc by offsets from its chord", async () => {
		const { container } = wrap();
		expect(row("Radius")).toBe(`51"`);
		expect(row("Offsets")).toBe(`9 at 6"`);
		expect(screen.getByRole("img", { name: /^Arc 48" chord/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Copy table" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Radius and chord" }));
		expect(screen.getByLabelText("Radius")).toHaveValue(`51"`);
		expect(row("Rise")).toBe(`6"`);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("builds gothic arches and an oval", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Gothic arch" }));
		expect(row("Rise")).toBe(`41 9/16"`);
		expect(row("Apex angle")).toBe("120.0°");
		fireEvent.change(screen.getByLabelText("Style"), { target: { value: "tudor" } });
		expect(row("Junctions")).toMatch(/ and /);
		expect(screen.getByRole("img", { name: /^Tudor/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Oval" }));
		expect(row("String length")).toBe(`60"`);
		expect(row("Foci")).toBe(`22 3/8"`);
		expect(screen.getByRole("img", { name: /^Oval 60" by 40"/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});
