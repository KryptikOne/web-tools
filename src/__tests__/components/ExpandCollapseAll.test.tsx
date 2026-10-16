import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import ExpandCollapseAll from "@/components/Sidebar/ExpandCollapseAll";

expect.extend(toHaveNoViolations);

describe("ExpandCollapseAll", () => {
	it("offers expand when any category is closed, collapse when all are open", async () => {
		const onToggle = vi.fn();
		const { rerender, container } = render(<ExpandCollapseAll allExpanded={false} onToggle={onToggle} />);
		fireEvent.click(screen.getByRole("button", { name: "Expand all categories" }));
		expect(onToggle).toHaveBeenCalledTimes(1);

		rerender(<ExpandCollapseAll allExpanded onToggle={onToggle} />);
		expect(screen.getByRole("button", { name: "Collapse all categories" })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});
