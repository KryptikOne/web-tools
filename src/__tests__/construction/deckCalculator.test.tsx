import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import DeckCalculator from "@/features/deck-calculator/DeckCalculator";

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
			<DeckCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("DeckCalculator", () => {
	it("quantifies a 20' x 12' deck on stumps with ground fall", async () => {
		const { container } = wrap();
		expect(row("Deck area")).toBe("240.00 sq ft");
		expect(row("Stumps")).toBe("12");
		expect(row("Bearers")).toBe(`3 × 20' 0"`);
		expect(row("Joists")).toBe(`16 × 12' 0"`);
		expect(row("Boards")).toBe("26 rows");
		expect(row("Fascia")).toBe(`64' 0"`);
		expect(screen.getByRole("img", { name: /^Deck framing plan/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Deck elevation across/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /board rows across/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Joists along the length mark-out" })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Stumps along a bearer mark-out" })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Bearers across the width mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("drops the fascia and turns the boards", () => {
		wrap();
		fireEvent.click(screen.getByLabelText("Fascia all round"));
		expect(screen.queryByText("Fascia", { selector: "dt" })).not.toBeInTheDocument();
		fireEvent.click(screen.getByLabelText("Boards across the width"));
		expect(row("Boards")).toMatch(/rows/);
		fireEvent.click(screen.getByRole("radio", { name: "6x6" }));
		expect(row("Stumps")).toBe("12");
	});
});
