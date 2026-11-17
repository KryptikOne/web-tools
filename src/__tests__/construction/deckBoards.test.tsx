import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import DeckBoards from "@/features/deck-boards/DeckBoards";

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
			<DeckBoards />
		</Provider>,
	);

const row = (label: string) => {
	const dt = screen.getByText(label, { selector: "dt" });
	return dt.parentElement!.querySelector("dd")!.textContent;
};

describe("DeckBoards", () => {
	it("lays 5/4x6 boards across a 12' x 20' deck", async () => {
		const { container } = wrap();
		expect(row("Boards across")).toBe("26");
		expect(row("Gap")).toBe(`1/4"`);
		expect(row("Board run per joint")).toBe(`16' 0"`);
		expect(row("Joists crossed")).toBe("16");
		expect(row("Boards to buy")).toBe("33");
		expect(screen.getByText(/Board 26 is a sliver/)).toBeInTheDocument();
		expect(screen.getByRole("img", { name: /^26 board rows across/ })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Board positions mark-out" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("adjusts the gap for whole boards and adds a picture-frame border", () => {
		wrap();
		fireEvent.change(screen.getByLabelText("Fit across the width"), { target: { value: "adjust-gap" } });
		expect(row("Boards across")).toBe("25");
		expect(screen.queryByText(/sliver/)).not.toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Picture-frame border"), { target: { value: "5 1/2" } });
		expect(row("Field inside the border")).toBe(`11' 1/2" × 19' 1/2"`);
		expect(screen.getByText(/mitered at the corners/)).toBeInTheDocument();
	});
});
