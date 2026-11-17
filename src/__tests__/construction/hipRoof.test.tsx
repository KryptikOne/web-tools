import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import HipRoof from "@/features/hip-roof/HipRoof";

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
			<HipRoof />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("HipRoof", () => {
	it("frames an 8:12 hip roof on a 24' x 40' building", async () => {
		const { container } = wrap();
		expect(row("Roof angle")).toBe("33.69°");
		expect(row("Hip angle")).toBe("25.24°");
		expect(row("Jack diminish")).toBe(`1' 7 1/4"`);
		expect(row("Ridge")).toBe(`16' 0"`);
		expect(row("Rafters")).toBe("96");
		expect(row("Hip drop")).toBe(`3/8"`);
		expect(screen.getByRole("img", { name: /^Hip roof plan/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Hip rafter elevation/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Hip section/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Jack cheek cut template/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Hip cheek cut template/ })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^Ridge plumb cut template/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Rafter positions along a long wall mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("switches to backing and swaps width and length when entered the other way", () => {
		wrap();
		fireEvent.click(screen.getByRole("radio", { name: "Back (bevel)" }));
		expect(row("Backing bevel")).toBe("23.09°");
		fireEvent.change(screen.getByLabelText("Building width"), { target: { value: "40'" } });
		fireEvent.change(screen.getByLabelText("Building length"), { target: { value: "24'" } });
		expect(row("Ridge")).toBe(`16' 0"`);
	});
});
