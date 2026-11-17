import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import KerfCalculator from "@/features/kerf-calculator/KerfCalculator";

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
			<KerfCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("KerfCalculator", () => {
	it("kerfs 3/4 stock through 90° on a 6 inch radius", async () => {
		const { container } = wrap();
		expect(row("Kerfs")).toBe("8");
		expect(row("Kerf spacing")).toBe(`1 5/16"`);
		expect(row("Kerf depth")).toBe(`5/8"`);
		expect(screen.getByRole("img", { name: /^Kerfed board flat/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Board bent through 90/ })).toBeInTheDocument();
		expect(screen.getAllByRole("img", { name: /^Kerf strip/ }).length).toBe(2);
		expect(screen.getByRole("region", { name: "Kerf positions along the outside face mark-out" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Round down, kerfs close fully" }));
		expect(row("Kerfs")).toBe("7");
		expect(screen.getByText(/add one kerf/)).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("spaces kerfs around a half ellipse", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Half ellipse" }));
		expect(row("Kerfs")).toBe("16");
		expect(row("Kerf spacing")).toMatch(/ to /);
		expect(screen.getByRole("img", { name: /^Half ellipse 48" wide/ })).toBeInTheDocument();
		expect(screen.getAllByRole("row").length).toBeGreaterThan(16);
		expect(await axe(container)).toHaveNoViolations();
	});
});
