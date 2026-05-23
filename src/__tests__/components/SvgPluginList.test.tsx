import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SVGO_PLUGINS } from "@/features/svg-optimizer/svgoPlugins";

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

describe("SvgPluginList", () => {
	it("renders all plugin toggles alphabetically", async () => {
		const { default: SvgPluginList } = await import(
			"@/features/svg-optimizer/SvgPluginList"
		);
		const allOn = Object.fromEntries(SVGO_PLUGINS.map((p) => [p.id, true]));
		render(<SvgPluginList plugins={allOn} onToggle={vi.fn()} />);
		for (const p of SVGO_PLUGINS) {
			expect(
				screen.getByLabelText(new RegExp(p.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
			).toBeInTheDocument();
		}
	});

	it("calls onToggle with the right id when a plugin is clicked", async () => {
		const { default: SvgPluginList } = await import(
			"@/features/svg-optimizer/SvgPluginList"
		);
		const onToggle = vi.fn();
		const allOn = Object.fromEntries(SVGO_PLUGINS.map((p) => [p.id, true]));
		render(<SvgPluginList plugins={allOn} onToggle={onToggle} />);
		const first = SVGO_PLUGINS[0];
		fireEvent.click(
			screen.getByLabelText(new RegExp(first.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
		);
		expect(onToggle).toHaveBeenCalledWith(first.id, false);
	});
});
