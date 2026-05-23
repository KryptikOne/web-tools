import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { axe, toHaveNoViolations } from "jest-axe";
import favoritesReducer from "@/store/slices/favoritesSlice";

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

function renderWithStore(ui: React.ReactElement) {
	const store = configureStore({ reducer: { favorites: favoritesReducer } });
	return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("StarButton", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("renders an unpressed button when tool is not favorited", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		renderWithStore(<StarButton toolId="color-picker" />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-pressed", "false");
		expect(button).toHaveAttribute("aria-label", "Add to favorites");
	});

	it("toggles to pressed when clicked", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		renderWithStore(<StarButton toolId="color-picker" />);
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(button).toHaveAttribute("aria-label", "Remove from favorites");
	});

	it("stops click propagation so parent links don't navigate", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		const parentClick = vi.fn();
		renderWithStore(
			<a href="/somewhere" onClick={parentClick}>
				<StarButton toolId="color-picker" />
			</a>
		);
		fireEvent.click(screen.getByRole("button"));
		expect(parentClick).not.toHaveBeenCalled();
	});

	it("has no a11y violations", async () => {
		const { default: StarButton } = await import("@/components/StarButton/StarButton");
		const { container } = renderWithStore(<StarButton toolId="color-picker" />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
