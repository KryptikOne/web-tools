import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

describe("SvgGlobalSettings", () => {
	it("renders multipass, pretty, indent, and precision controls", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={vi.fn()}
			/>
		);
		expect(screen.getByLabelText(/multipass/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/pretty/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/indent/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
	});

	it("calls onChange when multipass toggles", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		const onChange = vi.fn();
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={onChange}
			/>
		);
		fireEvent.click(screen.getByLabelText(/multipass/i));
		expect(onChange).toHaveBeenCalledWith({ multipass: true });
	});

	it("calls onChange when precision slider moves", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		const onChange = vi.fn();
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={onChange}
			/>
		);
		fireEvent.change(screen.getByLabelText(/precision/i), { target: { value: "4" } });
		expect(onChange).toHaveBeenCalledWith({ floatPrecision: 4 });
	});

	it("disables the indent input when pretty is off", async () => {
		const { default: SvgGlobalSettings } = await import(
			"@/features/svg-optimizer/SvgGlobalSettings"
		);
		render(
			<SvgGlobalSettings
				multipass={false}
				pretty={false}
				indent={2}
				floatPrecision={2}
				onChange={vi.fn()}
			/>
		);
		expect(screen.getByLabelText(/indent/i)).toBeDisabled();
	});
});
