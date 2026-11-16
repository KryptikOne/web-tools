import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import GableRoof from "@/features/gable-roof/GableRoof";

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
			<GableRoof />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("GableRoof", () => {
	it("frames a 24' x 40' gable at 6:12", async () => {
		const { container } = wrap();
		expect(row("Roof angle")).toBe("26.57°");
		expect(row("Run")).toBe(`12' 0"`);
		expect(row("Ridge shortening")).toBe(`13/16"`);
		expect(row("Line length")).toBe(`13' 4 3/16"`);
		expect(row("Rafters")).toBe("62");
		expect(row("Ridge length")).toBe(`42' 0"`);
		expect(row("Roof area")).toBe("1314.81 sq ft");
		expect(row("Sheathing sheets")).toBe("48");
		expect(screen.getByRole("img", { name: /^Gable roof section/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Rafter plan/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Rafter positions along the plate mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("switches the overhang to along the rafter and keeps the same roof", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Along rafter" }));
		expect(screen.getByLabelText("Eave overhang")).toHaveValue(`2' 2 13/16"`);
		expect(row("Overall length")).toBe(`15' 7"`);
		fireEvent.click(screen.getByRole("radio", { name: `24"` }));
		expect(row("Rafters")).toBe("42");
	});
});
