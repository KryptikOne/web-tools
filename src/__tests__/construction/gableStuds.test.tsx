import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import GableStuds from "@/features/gable-studs/GableStuds";

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
			<GableStuds />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("GableStuds", () => {
	it("lays out a 24' gable end at 6:12 with a stud under the ridge", async () => {
		const { container } = wrap();
		expect(row("Rake angle")).toBe("26.57°");
		expect(row("Common difference")).toBe(`8"`);
		expect(row("Height at the ridge")).toBe(`14' 0"`);
		expect(row("Rise")).toBe(`6' 0"`);
		expect(screen.getByText(/cut to a point/)).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Gable end/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Gable stud top cut template/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Stud positions, level mark-out" })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Stud positions along the rake mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("switches to a half gable driven by the peak height", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Half gable" }));
		expect(screen.getByRole("radio", { name: "Ridge" })).toBeDisabled();
		fireEvent.click(screen.getByRole("radio", { name: "Peak height" }));
		fireEvent.change(screen.getByLabelText("Plate length"), { target: { value: "12'" } });
		fireEvent.change(screen.getByLabelText("Height at the high end"), { target: { value: "14'" } });
		expect(row("Rake angle")).toBe("26.57°");
		expect(row("Studs")).toBe("10");
		expect(row("Rise")).toBe(`6' 0"`);
		expect(screen.getByRole("img", { name: /^Raked wall/ })).toBeInTheDocument();
	});
});
