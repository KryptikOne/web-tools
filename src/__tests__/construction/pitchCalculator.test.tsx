import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import PitchCalculator from "@/features/pitch-calculator/PitchCalculator";

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
			<PitchCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("PitchCalculator", () => {
	it("solves the default 12' run at 6:12 and follows angle precision", async () => {
		const { container } = wrap();
		expect(row("Pitch")).toBe("6:12");
		expect(row("Angle")).toBe("26.57°");
		expect(row("Rise")).toBe(`6' 0"`);
		expect(row("Grade")).toBe("50%");
		expect(row("Slope length")).toBe(`13' 5"`);
		expect(row("Rafter multiplier")).toBe("1.1180");

		fireEvent.click(within(screen.getByRole("radiogroup", { name: "Angle precision" })).getByRole("radio", { name: "1°" }));
		expect(row("Angle")).toBe("27°");
		expect(screen.getByRole("img", { name: /base angle 27°/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("takes angle, rise or grade as the known value", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Angle" }));
		fireEvent.change(screen.getByLabelText("Angle"), { target: { value: "45" } });
		expect(row("Pitch")).toBe("12:12");
		expect(row("Rise")).toBe(`12' 0"`);

		fireEvent.click(screen.getByRole("radio", { name: "Grade" }));
		fireEvent.change(screen.getByLabelText("Grade"), { target: { value: "25" } });
		expect(row("Pitch")).toBe("3:12");
		expect(row("Rise")).toBe(`3' 0"`);

		fireEvent.click(screen.getByRole("radio", { name: "Rise" }));
		fireEvent.change(screen.getByLabelText("Rise"), { target: { value: "4'" } });
		expect(row("Pitch")).toBe("4:12");
		expect(row("Angle")).toBe("18.43°");
	});

	it("uses a table row as the pitch and gates the person toggle on run length", () => {
		wrap();
		fireEvent.click(screen.getByRole("button", { name: "8:12" }));
		expect(row("Pitch")).toBe("8:12");
		expect(row("Angle")).toBe("33.69°");
		expect(screen.getByRole("button", { name: "8:12" })).toHaveAttribute("aria-pressed", "true");

		const person = screen.getByLabelText(/average height person/) as HTMLInputElement;
		expect(person.disabled).toBe(false);
		fireEvent.change(screen.getByLabelText("Run"), { target: { value: "5'" } });
		expect(person.disabled).toBe(true);
	});
});
