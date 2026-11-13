import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useConstructionUnits } from "@/hooks/useConstructionUnits";

function Probe() {
	const u = useConstructionUnits();
	return (
		<div>
			<output data-testid="out">{u.format(123.5)}</output>
			<output data-testid="parsed">{String(u.parse("9'"))}</output>
			<output data-testid="unit">{u.unitLabel}</output>
			<button type="button" onClick={() => u.setMode("mm")}>
				mm
			</button>
			<button type="button" onClick={() => u.setPrecision(8)}>
				eighths
			</button>
		</div>
	);
}

describe("useConstructionUnits", () => {
	beforeEach(() => localStorage.clear());

	it("formats and parses with the stored mode and persists changes", () => {
		render(
			<Provider store={store}>
				<Probe />
			</Provider>,
		);
		expect(screen.getByTestId("out")).toHaveTextContent("10' 3 1/2\"");
		expect(screen.getByTestId("parsed")).toHaveTextContent("108");
		expect(screen.getByTestId("unit")).toHaveTextContent("ft in");

		fireEvent.click(screen.getByRole("button", { name: "eighths" }));
		expect(screen.getByTestId("out")).toHaveTextContent("10' 3 1/2\"");

		fireEvent.click(screen.getByRole("button", { name: "mm" }));
		expect(screen.getByTestId("out")).toHaveTextContent("3136.9 mm");
		expect(screen.getByTestId("parsed")).toHaveTextContent("null");
		expect(screen.getByTestId("unit")).toHaveTextContent("mm");

		const stored = JSON.parse(localStorage.getItem("user-preferences-state") ?? "{}");
		expect(stored.constructionUnitMode).toBe("mm");
		expect(stored.constructionPrecision).toBe(8);
	});
});
