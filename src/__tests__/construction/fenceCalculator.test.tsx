import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import FenceCalculator from "@/features/fence-calculator/FenceCalculator";

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
			<FenceCalculator />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("FenceCalculator", () => {
	it("lays out a post and rail fence with palings and concrete", async () => {
		const { container } = wrap();
		expect(row("Posts")).toBe("4");
		expect(row("Rails")).toBe("9");
		expect(row("Palings")).toBe("72");
		expect(row("Post length")).toBe(`8' 0"`);
		expect(screen.getByRole("img", { name: /^Post and rail fence/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Post hole/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Paling positions mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("fits panels, scallops palings and splits glass", async () => {
		const { container } = wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Post and panel" }));
		fireEvent.change(screen.getByLabelText("Fence length"), { target: { value: "25'" } });
		expect(row("Whole panels")).toBe("3");
		expect(row("Cut panels")).toBe(`5' 6 1/2"`);
		expect(row("Posts")).toBe("5");
		fireEvent.click(screen.getByRole("radio", { name: "Arched palings" }));
		expect(row("Palings")).toBe("17");
		expect(row("Arc radius")).toBe(`9' 3"`);
		expect(row("Height at the centre")).toBe(`4' 6"`);
		expect(screen.getByRole("img", { name: /^Scalloped palings/ })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Glass" }));
		fireEvent.change(screen.getByLabelText("Fence length"), { target: { value: "20'" } });
		expect(row("Panels")).toBe("5");
		expect(row("Spigots")).toBe("10");
		expect(screen.getByRole("region", { name: "Spigot positions mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});
