import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { axe, toHaveNoViolations } from "jest-axe";
import favoritesReducer, { toggleFavorite } from "@/store/slices/favoritesSlice";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
		<a href={href} {...props}>{children}</a>
	),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

function renderWithStore(ui: React.ReactElement, preloadedIds: string[] = []) {
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	for (const id of preloadedIds) store.dispatch(toggleFavorite(id));
	return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("FavoritesSection", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("shows the FAVORITES header", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		renderWithStore(<FavoritesSection />);
		expect(screen.getByText(/favorites/i)).toBeInTheDocument();
	});

	it("shows the empty-state hint when there are no favorites", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		renderWithStore(<FavoritesSection />);
		expect(screen.getByText(/star a tool to pin it here/i)).toBeInTheDocument();
	});

	it("renders each favorite as a link to its route", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		renderWithStore(<FavoritesSection />, ["color-picker", "jwt-decoder"]);
		expect(screen.getByText("Color Picker")).toBeInTheDocument();
		expect(screen.getByText("JWT Decoder")).toBeInTheDocument();
		expect(screen.queryByText(/star a tool to pin it here/i)).not.toBeInTheDocument();
	});

	it("has no a11y violations when empty", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		const { container } = renderWithStore(<FavoritesSection />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("has no a11y violations when populated", async () => {
		const { default: FavoritesSection } = await import(
			"@/components/Sidebar/FavoritesSection"
		);
		const { container } = renderWithStore(<FavoritesSection />, ["color-picker", "jwt-decoder"]);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
