import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import WallFraming from "@/features/wall-framing/WallFraming";

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
			<WallFraming />
		</Provider>,
	);

const row = (label: string, region = "Layout") => {
	const dt = within(screen.getByRole("region", { name: region })).getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};
const positions = () =>
	within(screen.getByRole("table", { name: "Stud mark-out" }))
		.getAllByRole("row")
		.slice(1)
		.map((r) => within(r).getAllByRole("cell")[2].textContent);

describe("WallFraming", () => {
	it("lays out a 12' wall at 16\" centres and marks the near side", async () => {
		const { container } = wrap();
		expect(row("Studs")).toBe("10");
		expect(row("Sheet joints backed")).toBe("2 of 2");
		expect(positions().slice(0, 3)).toEqual([`0"`, `15 1/4"`, `31 1/4"`]);
		expect(await axe(container)).toHaveNoViolations();

		fireEvent.click(screen.getByRole("radio", { name: `24"` }));
		expect(row("Studs")).toBe("7");
		fireEvent.change(screen.getByLabelText("First stud offset"), { target: { value: "2" } });
		expect(row("Sheet joints backed")).toBe("0 of 2");
		expect(screen.getAllByText(/no stud behind/).length).toBeGreaterThan(0);
	});

	it("builds end assemblies and forces 8' sheets at 19.2\" centres", () => {
		wrap();
		fireEvent.change(screen.getByLabelText("Start with"), { target: { value: "double" } });
		expect(row("Studs")).toBe("11");
		expect(positions().slice(0, 2)).toEqual([`0"`, `1 1/2"`]);
		fireEvent.click(screen.getByRole("radio", { name: `19.2"` }));
		expect(screen.getByRole("radio", { name: `8'` })).toHaveAttribute("aria-checked", "true");
		expect(screen.getByRole("radio", { name: `4'` })).toBeDisabled();
	});

	it("totals the lumber order", () => {
		wrap();
		expect(screen.getByText("Order")).toBeInTheDocument();
		// 480" at 16": 31 + 4×2 + 0 + 2×4 = 47 studs
		expect(row("Studs", "Order")).toBe("47");
		expect(row("Plate stock", "Order")).toBe(`8 × 192"`);
		// (120 + 40 + 47 × 92.625 / 12) linear ft × 0.4375 bft per ft
		expect(row("Board feet", "Order")).toBe("228.7");
	});
});
