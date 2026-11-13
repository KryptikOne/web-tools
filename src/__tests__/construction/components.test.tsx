import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import { setConstructionUnitMode, setConstructionPrecision } from "@/store/slices/userPreferencesSlice";
import { UnitAndPrecisionBar, DimensionInput, RunningList, LumberTable } from "@/components/construction";

expect.extend(toHaveNoViolations);

const writeText = vi.fn().mockResolvedValue(undefined);
beforeAll(() => {
	Object.assign(navigator, { clipboard: { writeText } });
});

beforeEach(() => {
	store.dispatch(setConstructionUnitMode("ft-in"));
	store.dispatch(setConstructionPrecision(16));
	writeText.mockClear();
});

const wrap = (ui: React.ReactElement) => render(<Provider store={store}>{ui}</Provider>);

describe("UnitAndPrecisionBar", () => {
	it("switches units and hides precision in metric", async () => {
		const { container } = wrap(<UnitAndPrecisionBar />);
		expect(screen.getByRole("radiogroup", { name: "Units" })).toBeInTheDocument();
		expect(screen.getByRole("radiogroup", { name: "Precision" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Metric" }));
		expect(screen.queryByRole("radiogroup", { name: "Precision" })).toBeNull();
		expect(store.getState().userPreferences.constructionUnitMode).toBe("mm");
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("DimensionInput", () => {
	function Harness({ step }: { step?: number }) {
		return <DimensionInput id="rise" label="Total rise" value={108} onChange={onChange} step={step} min={0} max={240} />;
	}
	const onChange = vi.fn();

	it("parses typed text to inches and echoes the formatted value", async () => {
		const { container } = wrap(<Harness />);
		const input = screen.getByLabelText("Total rise") as HTMLInputElement;
		expect(input.value).toBe("9' 0\"");
		fireEvent.change(input, { target: { value: "10' 3 1/2" } });
		expect(onChange).toHaveBeenLastCalledWith(123.5);
		expect(screen.getByText("10' 3 1/2\"")).toBeInTheDocument();
		fireEvent.change(input, { target: { value: "abc" } });
		expect(onChange).toHaveBeenLastCalledWith(null);
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(await axe(container)).toHaveNoViolations();
	});

	it("renders a linked slider when step is given", () => {
		wrap(<Harness step={1} />);
		const slider = screen.getByLabelText("Total rise slider") as HTMLInputElement;
		expect(slider.type).toBe("range");
		fireEvent.change(slider, { target: { value: "70" } });
		expect(onChange).toHaveBeenLastCalledWith(70);
		const input = screen.getByLabelText("Total rise") as HTMLInputElement;
		expect(input.value).toBe("5' 10\"");
		expect(input).not.toHaveAttribute("aria-invalid");
	});
});

describe("RunningList", () => {
	it("formats positions, highlights every nth, copies and steps through mark-out", async () => {
		const onRef = vi.fn();
		const { container } = wrap(<RunningList title="Stud centers" positions={[16, 32, 48]} reference="center" onReferenceChange={onRef} />);
		const table = screen.getByRole("table", { name: "Stud centers" });
		expect(within(table).getByText("1' 4\"")).toBeInTheDocument();
		expect(within(table).getByText("2' 8\"")).toBeInTheDocument();
		expect(within(table).getByText("4' 0\"")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("radio", { name: "Near" }));
		expect(onRef).toHaveBeenCalledWith("near");

		fireEvent.change(screen.getByLabelText("Highlight every"), { target: { value: "3" } });
		expect(within(table).getAllByRole("row").filter((r) => r.className.includes("highlight"))).toHaveLength(1);
		fireEvent.click(screen.getByLabelText("Only highlighted"));
		expect(within(table).getAllByRole("row")).toHaveLength(2); // header + one row

		fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
		expect(writeText).toHaveBeenCalledWith("3\t4' 0\"");

		fireEvent.click(screen.getByLabelText("Only highlighted"));
		fireEvent.click(screen.getByRole("button", { name: /Mark-out/ }));
		const dialog = screen.getByRole("dialog");
		expect(within(dialog).getByText("1' 4\"")).toBeInTheDocument();
		fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
		expect(within(dialog).getByText("2' 8\"")).toBeInTheDocument();
		fireEvent.keyDown(dialog, { key: "Escape" });
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("LumberTable", () => {
	it("lists actual sizes at the current precision", async () => {
		const { container } = wrap(<LumberTable />);
		const row = screen.getByText("2x4").closest("tr")!;
		expect(row).toHaveTextContent("1 1/2\" x 3 1/2\"");
		expect(await axe(container)).toHaveNoViolations();
	});
});
