import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import CurvedMoldingCalculator from "@/features/curved-molding-calculator/CurvedMoldingCalculator";

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
			<CurvedMoldingCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("CurvedMoldingCalculator", () => {
	it("segments 3 inch trim round a quarter circle", async () => {
		const { container } = wrap();
		expect(row("Inside radius")).toBe(`36"`);
		expect(row("End miters")).toBe("11.25°");
		expect(row("Segments")).toMatch(/^4 × 15 3\/16"/);
		expect(screen.getByRole("img", { name: /^Curved molding plan/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Segment template/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("kerfs one piece from a chord and rise and sets crown cuts", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Chord and rise" }));
		fireEvent.change(screen.getByLabelText("Chord"), { target: { value: "48" } });
		fireEvent.change(screen.getByLabelText("Rise"), { target: { value: "6" } });
		expect(row("Inside radius")).toBe(`51"`);
		fireEvent.click(screen.getByLabelText("Kerf bent"));
		expect(row("Kerfs")).toMatch(/ at /);
		expect(screen.getByRole("region", { name: "Kerf positions along the back mark-out" })).toBeInTheDocument();
		fireEvent.click(screen.getByLabelText("Crown molding"));
		expect(row("Crown compound cut")).toMatch(/^miter /);
		fireEvent.change(screen.getByLabelText("Segments"), { target: { value: "0" } });
		expect(screen.getByText(/set a segment count/)).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});
