import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import BlockCalculator from "@/features/block-calculator/BlockCalculator";

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
			<BlockCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("BlockCalculator", () => {
	it("counts blocks for a 40 by 8 foot wall with a door", async () => {
		const { container } = wrap();
		expect(row("Courses")).toBe("12");
		expect(row("Blocks")).toBe("338");
		expect(row("With waste")).toBe("355");
		expect(row("Half blocks")).toBe("12");
		expect(row("Mortar")).toBe("11 bags");
		expect(screen.getByRole("img", { name: /^Block wall elevation/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Block plan/ })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("adds grout and rebar, and another opening", async () => {
		const { container } = wrap();
		fireEvent.change(screen.getByLabelText("Grout cores"), { target: { value: "2" } });
		expect(row("Core fill")).toBe("42.3 ft³");
		fireEvent.change(screen.getByLabelText("Vertical rebar"), { target: { value: "2" } });
		expect(row("Vertical rebar")).toMatch(/^31 × 9' 0"/);
		fireEvent.click(screen.getByRole("button", { name: "Add opening" }));
		expect(screen.getByLabelText("Opening 2 width")).toBeInTheDocument();
		expect(row("Blocks")).toBe("325");
		fireEvent.click(screen.getByRole("button", { name: "Remove opening 2" }));
		expect(row("Blocks")).toBe("338");
		expect(await axe(container)).toHaveNoViolations();
	});
});
