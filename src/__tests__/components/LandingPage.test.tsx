import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

// jsdom has no matchMedia; the hero reads prefers-reduced-motion and (hover: hover).
beforeAll(() => {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}));
	// jsdom logs "not implemented" for canvas; the field engine no-ops without a 2D context.
	HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
});

async function renderLanding() {
	const { Provider } = await import("react-redux");
	const { configureStore } = await import("@reduxjs/toolkit");
	const { default: themeReducer } = await import("@/store/slices/themeSlice");
	const { default: LandingPage } = await import("@/features/landing/LandingPage");
	const store = configureStore({ reducer: { theme: themeReducer } });
	return render(
		<Provider store={store}>
			<LandingPage />
		</Provider>
	);
}

describe("LandingPage", () => {
	it("renders the headline with the live tool count", async () => {
		await renderLanding();
		const { TOOLS_REGISTRY } = await import("@/config/tools-registry");
		const count = TOOLS_REGISTRY.filter((t) => t.implemented).length;
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(`${count} tools that run in your browser.`);
	});

	it("exposes the terminal prompt as a labelled combobox", async () => {
		await renderLanding();
		const input = screen.getByRole("combobox", { name: "Search tools or type a command" });
		expect(input).toHaveAttribute("aria-expanded", "false");
	});

	it("renders the category index and the All tools links", async () => {
		await renderLanding();
		expect(screen.getByRole("heading", { level: 2, name: "The toolbox" })).toBeInTheDocument();
		expect(screen.getAllByRole("link", { name: "All tools" }).length).toBeGreaterThanOrEqual(2);
	});

	it("has no a11y violations", async () => {
		const { container } = await renderLanding();
		expect(await axe(container)).toHaveNoViolations();
	});
});
