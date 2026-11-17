import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import SiteUtilities from "@/features/site-utilities/SiteUtilities";

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
			<SiteUtilities />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("SiteUtilities", () => {
	it("converts angles both ways", async () => {
		const { container } = wrap();
		expect(row("Degrees minutes seconds")).toBe(`45° 30' 00"`);
		expect(row("As a bearing")).toBe(`N 45° 30' 00" E`);
		fireEvent.change(screen.getByLabelText("Minutes"), { target: { value: "15" } });
		expect(row("Decimal degrees")).toBe("45.25°");
		fireEvent.change(screen.getByLabelText("Decimal degrees"), { target: { value: "370" } });
		expect(row("Normalised")).toBe(`10° 00' 00"`);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("scales drawing lengths and prints a bar", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Drawing scale" }));
		expect(row(`2" on the drawing`)).toBe(`8' 0"`);
		expect(row(`8' 0" real`)).toBe(`2"`);
		expect(screen.getByRole("img", { name: /^Scale bar for 1\/4"/ })).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Scale"), { target: { value: "1:50" } });
		expect(row(`2" on the drawing`)).toBe(`8' 4"`);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("totals rooms and takes a void away", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Floor area" }));
		expect(row("Total area")).toBe("300.00 sq ft");
		fireEvent.click(screen.getByRole("button", { name: "Add room" }));
		expect(row("Total area")).toBe("400.00 sq ft");
		fireEvent.click(screen.getAllByLabelText("Take away")[2]);
		expect(row("Total area")).toBe("200.00 sq ft");
		fireEvent.click(screen.getByRole("button", { name: "Remove room 3" }));
		expect(row("Total area")).toBe("300.00 sq ft");
		expect(await axe(container)).toHaveNoViolations();
	});
});
