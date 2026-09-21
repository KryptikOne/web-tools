import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

async function renderTool() {
	const { default: NatoPhoneticConverter } = await import(
		"@/features/nato-phonetic-converter/NatoPhoneticConverter"
	);
	return render(<NatoPhoneticConverter />);
}

describe("NatoPhoneticConverter", () => {
	it("spells typed text into char/word pairs with word breaks", async () => {
		await renderTool();
		fireEvent.change(screen.getByLabelText("Input"), { target: { value: "Hi 5" } });
		const out = within(screen.getByRole("region", { name: "Output" }));
		expect(out.getByText("Hotel")).toBeInTheDocument();
		expect(out.getByText("India")).toBeInTheDocument();
		expect(out.getByText("Five")).toBeInTheDocument();
		expect(out.getByText("/")).toBeInTheDocument();
	});

	it("auto-detects calls and reads them back", async () => {
		await renderTool();
		fireEvent.change(screen.getByLabelText("Input"), {
			target: { value: "Hotel India / Five" },
		});
		expect(screen.getByText("HI 5")).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: /Auto/ })).toHaveAttribute("aria-checked", "true");
	});

	it("switches alphabets", async () => {
		await renderTool();
		fireEvent.click(screen.getByRole("radio", { name: "DIN 5009" }));
		fireEvent.change(screen.getByLabelText("Input"), { target: { value: "a" } });
		const out = within(screen.getByRole("region", { name: "Output" }));
		expect(out.getByText("Aachen")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Ä, Umlaut Aachen" })).toBeInTheDocument();
	});

	it("tapping a chart cell appends the letter to the input", async () => {
		await renderTool();
		fireEvent.click(screen.getByRole("button", { name: "K, Kilo" }));
		fireEvent.click(screen.getByRole("button", { name: "9, Nine" }));
		expect(screen.getByLabelText("Input")).toHaveValue("K9");
	});

	it("forced Read mode decodes and tapping appends the call word", async () => {
		await renderTool();
		fireEvent.click(screen.getByRole("radio", { name: "Read" }));
		fireEvent.click(screen.getByRole("button", { name: "K, Kilo" }));
		fireEvent.click(screen.getByRole("button", { name: "9, Nine" }));
		expect(screen.getByLabelText("Input")).toHaveValue("Kilo Nine ");
		expect(screen.getByText("K9")).toBeInTheDocument();
	});

	it("copies the plain-text spelling", async () => {
		await renderTool();
		fireEvent.change(screen.getByLabelText("Input"), { target: { value: "ok" } });
		fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Oscar Kilo");
	});

	it("has no a11y violations", async () => {
		const { container } = await renderTool();
		fireEvent.change(screen.getByLabelText("Input"), { target: { value: "Hello 1" } });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
