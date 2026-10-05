import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn().mockResolvedValue("") },
	});
	Element.prototype.scrollIntoView = vi.fn();
});

// Cold-importing the component (and lowlight) is slow under a parallel run; pay it once here.
beforeAll(async () => {
	await import("@/features/diff-checker/DiffChecker");
	await import("@/lib/syntaxHighlightUtils").then((m) => m.loadHighlighter());
}, 30_000);

const lines = (n: number, change?: [number, string]) =>
	Array.from({ length: n }, (_, i) => (change && i === change[0] ? change[1] : `line ${i + 1}`)).join("\n");

describe("DiffChecker", () => {
	it("highlights the changed word inside a changed line", async () => {
		const { default: DiffChecker } = await import("@/features/diff-checker/DiffChecker");
		const { container } = render(<DiffChecker />);
		fireEvent.change(screen.getByLabelText("Original text"), { target: { value: "category: UNIT_CONVERTERS" } });
		fireEvent.change(screen.getByLabelText("Modified text"), { target: { value: "category: KITCHEN" } });

		expect(screen.getByText("UNIT_CONVERTERS").closest("[class*=hlRemoved]")).not.toBeNull();
		expect(screen.getByText("KITCHEN").closest("[class*=hlAdded]")).not.toBeNull();
		expect(await axe(container)).toHaveNoViolations();
	});

	it("detects a moved block and colours code from the file extension", async () => {
		const { default: DiffChecker } = await import("@/features/diff-checker/DiffChecker");
		const { container } = render(<DiffChecker />);
		fireEvent.click(screen.getByRole("button", { name: /Sample/ }));
		const block = ["function helper(value) {", "  return value * 2;", "}"];
		const rest = ["const a = 1;", "const b = 2;", "const c = 3;"];
		fireEvent.change(screen.getByLabelText("Original text"), { target: { value: [...block, ...rest].join("\n") } });
		fireEvent.change(screen.getByLabelText("Modified text"), { target: { value: [...rest, ...block].join("\n") } });

		expect(screen.getByText("1 moved")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /moved to line 4/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /moved from line 1/ })).toBeInTheDocument();
		// Sample names the files registry.ts, so TypeScript highlighting kicks in once lowlight loads.
		expect(await screen.findByRole("option", { name: "Auto (TypeScript)" })).toBeInTheDocument();
		await waitFor(() => expect(container.querySelector("[class*=synKeyword]")).not.toBeNull());
		expect(await axe(container)).toHaveNoViolations();
	});

	it("sample shows moved, moved-with-edits, added and removed code", async () => {
		const { default: DiffChecker } = await import("@/features/diff-checker/DiffChecker");
		render(<DiffChecker />);
		fireEvent.click(screen.getByRole("button", { name: /Sample/ }));
		expect(screen.getByText("2 moved")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "moved to line 43" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "moved to line 33 with edits" })).toBeInTheDocument();
		expect(screen.getByText("trim().").closest("[class*=hlAdded]")).not.toBeNull();
		expect(screen.getAllByRole("button", { name: /unchanged lines/ }).length).toBeGreaterThan(0);

		expect(screen.getByText("6 changes")).toBeInTheDocument();
		expect(screen.getByText("+19")).toBeInTheDocument();

		// Case and whitespace edits disappear with the matching options. The casing
		// change shares a block with SEARCH_DELAY_MS, so lines drop by 2 but blocks by 1.
		fireEvent.click(screen.getByLabelText("Ignore case"));
		fireEvent.click(screen.getByLabelText("Ignore whitespace"));
		expect(screen.getByText("5 changes")).toBeInTheDocument();
		expect(screen.getByText("+17")).toBeInTheDocument();
	});

	it("collapses unchanged lines and expands them on click", async () => {
		const { default: DiffChecker } = await import("@/features/diff-checker/DiffChecker");
		render(<DiffChecker />);
		fireEvent.change(screen.getByLabelText("Original text"), { target: { value: lines(40) } });
		fireEvent.change(screen.getByLabelText("Modified text"), { target: { value: lines(40, [20, "changed"]) } });

		expect(screen.queryByText("line 2")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: /Show 17 unchanged lines/ }));
		expect(screen.getAllByText("line 2").length).toBeGreaterThan(0);
	});

	it("reports identical input and switches to unified view", async () => {
		const { default: DiffChecker } = await import("@/features/diff-checker/DiffChecker");
		render(<DiffChecker />);
		fireEvent.change(screen.getByLabelText("Original text"), { target: { value: "Same" } });
		fireEvent.change(screen.getByLabelText("Modified text"), { target: { value: "same" } });
		fireEvent.click(screen.getByLabelText("Ignore case"));
		expect(screen.getByText("No differences.")).toBeInTheDocument();

		fireEvent.click(screen.getByLabelText("Ignore case"));
		fireEvent.click(screen.getByRole("radio", { name: "Unified" }));
		expect(screen.getByRole("radio", { name: "Unified" })).toHaveAttribute("aria-checked", "true");
		fireEvent.click(screen.getByRole("button", { name: "Next change" }));
		expect(screen.getByText("1 / 1")).toBeInTheDocument();
	});
});
