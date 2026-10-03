import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import recipesReducer from "@/store/slices/recipesSlice";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/tools/recipe-table",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn() }),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
	Object.assign(URL, { createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() });
});

beforeEach(() => {
	localStorage.clear();
	window.location.hash = "";
});

async function renderPage() {
	const { default: RecipeTablePage } = await import("@/features/recipe-table/RecipeTablePage");
	const store = configureStore({ reducer: { recipes: recipesReducer } });
	const utils = render(
		<Provider store={store}>
			<RecipeTablePage />
		</Provider>
	);
	return { ...utils, store };
}

describe("RecipeTablePage", () => {
	it("seeds sample recipes and renders the active one as a table", async () => {
		const { container } = await renderPage();
		expect(screen.getByRole("button", { name: /^Aglio e olio/ })).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 2, name: "Aglio e olio" })).toBeInTheDocument();
		expect(container.querySelectorAll("table td").length).toBeGreaterThan(10);
		expect(await axe(container)).toHaveNoViolations();
	});

	it("re-renders the table as you type and saves after the debounce", async () => {
		vi.useFakeTimers();
		const { store } = await renderPage();
		const ta = screen.getByLabelText("Recipe text") as HTMLTextAreaElement;
		fireEvent.change(ta, { target: { value: "# Toast\nserves: 1\n\ntoast 3 min\n- bread: 2 slices\n" } });
		expect(screen.getByRole("heading", { level: 2, name: "Toast" })).toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(600);
		});
		const active = store.getState().recipes.recipes.find((r) => r.id === store.getState().recipes.activeId)!;
		expect(active.text).toContain("# Toast");
		vi.useRealTimers();
	});

	it("scales amounts with the serves stepper and converts units", async () => {
		await renderPage();
		expect(screen.getAllByText("200 g")[0]).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "More servings" }));
		fireEvent.click(screen.getByRole("button", { name: "More servings" }));
		expect(screen.getAllByText("400 g")[0]).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Imperial" }));
		expect(screen.getAllByText("14.1 oz")[0]).toBeInTheDocument();
	});

	it("shows the shared banner for a recipe in the hash", async () => {
		const { encodeShare } = await import("@/lib/recipeUtils");
		const token = await encodeShare("# Shared soup\nserves: 2\n\nsimmer 10 min\n- stock: 500 ml\n");
		window.location.hash = `#r=${token}`;
		await renderPage();
		expect(await screen.findByText(/Shared recipe/)).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 2, name: "Shared soup" })).toBeInTheDocument();
	});
});

describe("printing", () => {
	it("renders the recipe into a body-level portal only while printing", async () => {
		await renderPage();
		expect(document.querySelector("[data-print-root]")).not.toBeNull();
		expect(document.querySelector("[data-print-root] h2")).toBeNull();
		act(() => {
			window.dispatchEvent(new Event("beforeprint"));
		});
		expect(document.querySelector("[data-print-root] h2")?.textContent).toBe("Aglio e olio");
		expect(document.head.textContent).toContain("size: landscape");
		act(() => {
			window.dispatchEvent(new Event("afterprint"));
		});
		expect(document.querySelector("[data-print-root] h2")).toBeNull();
	});
});
