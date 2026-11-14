import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import FractionConverter from "@/features/fraction-converter/FractionConverter";

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
			<FractionConverter />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("FractionConverter", () => {
	it("adds table fractions to a measure list and removes them again", async () => {
		const { container } = wrap();
		const eighths = screen.getByRole("list", { name: "Eighths" });
		expect(within(eighths).getAllByRole("listitem")).toHaveLength(8);
		fireEvent.click(within(eighths).getByRole("button", { name: /^Add 1\/8 inch/ }));
		fireEvent.click(within(screen.getByRole("list", { name: "Sixteenths" })).getByRole("button", { name: /^Add 1\/16 inch/ }));
		expect(row("Length")).toBe('3/16"');
		expect(row("Millimetres")).toBe("4.763 mm");

		fireEvent.click(screen.getByRole("button", { name: 'Remove 1/8"' }));
		expect(row("Length")).toBe('1/16"');
		expect(screen.getByRole("img", { name: /1\/16" is 0.0625" or 1.588 mm/ })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Clear measure list" }));
		expect(screen.getByText("No fractions added yet.")).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("evaluates typed and keyed expressions at the chosen precision", () => {
		wrap();
		const input = screen.getByLabelText("Inches") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "3 1/2 + 1/8" } });
		expect(row("Result")).toBe('3 5/8"');
		expect(row("Decimal inches")).toBe('3.625"');

		fireEvent.change(screen.getByLabelText("Precision", { selector: "select" }), { target: { value: "0.01" } });
		expect(row("Result")).toBe('3.63"');

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));
		expect(input.value).toBe("");
		fireEvent.click(screen.getByRole("button", { name: "7" }));
		fireEvent.click(screen.getByRole("button", { name: "×" }));
		fireEvent.click(screen.getByRole("button", { name: "2" }));
		expect(input.value).toBe("7 × 2");
		expect(row("Result")).toBe('14"');
		fireEvent.click(screen.getByRole("button", { name: "Backspace" }));
		expect(input.value).toBe("7 ×");
		expect(input).toHaveAttribute("aria-invalid", "true");
	});

	it("redraws the wheel for precision and convert options", () => {
		wrap();
		fireEvent.click(within(screen.getByRole("radiogroup", { name: "Wheel precision" })).getByRole("radio", { name: "1/64" }));
		expect(screen.getByRole("img", { name: /wheel at 1\/64/ })).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Convert"), { target: { value: "mm-2" } });
		expect(screen.getByRole("img", { name: /Fraction to mm wheel/ })).toBeInTheDocument();
		fireEvent.click(screen.getByLabelText("Pad zeros"));
		const eighths = screen.getByRole("list", { name: "Eighths" });
		expect(within(eighths).getByText("12.70 mm")).toBeInTheDocument();
	});
});
