import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import RoofShapes from "@/features/roof-shapes/RoofShapes";

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
			<RoofShapes />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("RoofShapes", () => {
	it("solves a skillion from the two wall heights", async () => {
		const { container } = wrap();
		expect(row("Roof angle")).toBe("14.04°");
		fireEvent.click(screen.getByRole("radio", { name: "Wall heights" }));
		fireEvent.change(screen.getByLabelText("High wall height"), { target: { value: "14'" } });
		expect(row("Roof angle")).toBe("26.57°");
		expect(row("Rise")).toBe(`6' 0"`);
		expect(row("Line length")).toBe(`13' 5"`);
		expect(row("Overall length")).toBe(`15' 7 13/16"`);
		expect(screen.getByRole("img", { name: /^Skillion section/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("solves a gambrel and its break joint", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Gambrel" }));
		fireEvent.click(screen.getByRole("radio", { name: "Angle" }));
		fireEvent.change(screen.getByLabelText("Lower angle"), { target: { value: "60" } });
		fireEvent.change(screen.getByLabelText("Upper angle"), { target: { value: "30" } });
		fireEvent.change(screen.getByLabelText("Span"), { target: { value: "24'" } });
		expect(row("Break angle")).toBe("150.00°");
		expect(row("Upper slope")).toBe("30.00°");
		expect(screen.getByRole("img", { name: /^Gambrel section/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("places a saltbox ridge for equal walls", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Saltbox" }));
		fireEvent.change(screen.getByLabelText("Span"), { target: { value: "24'" } });
		expect(row("Ridge offset")).toBe(`4' 0"`);
		expect(row("Front slope")).toBe("45.00°");
		expect(screen.getByRole("img", { name: /^Saltbox section/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Offset" }));
		expect(screen.getByLabelText("Ridge offset")).toHaveValue(`4' 0"`);
		expect(await axe(container)).toHaveNoViolations();
	});
});
