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

let reduced = true;

beforeAll(() => {
	// jsdom has no matchMedia. Reduced motion shows the whole session at once.
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: reduced,
		media: query,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}));
	// jsdom logs "not implemented" for canvas; the field engine no-ops without a 2D context.
	HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
});

async function renderNotFound(pathname: string) {
	window.history.replaceState(null, "", pathname);
	const { Provider } = await import("react-redux");
	const { configureStore } = await import("@reduxjs/toolkit");
	const { default: themeReducer } = await import("@/store/slices/themeSlice");
	const { default: NotFoundPage } = await import("@/features/not-found/NotFoundPage");
	const store = configureStore({ reducer: { theme: themeReducer } });
	return render(
		<Provider store={store}>
			<NotFoundPage />
		</Provider>
	);
}

describe("NotFoundPage", () => {
	it("replays the requested path as a failed cd", async () => {
		reduced = true;
		await renderNotFound("/tools/jsno-prettifier");
		expect(await screen.findByText("cd /tools/jsno-prettifier")).toBeInTheDocument();
		expect(screen.getByText("cd: no such file or directory: /tools/jsno-prettifier")).toBeInTheDocument();
	});

	it("truncates long paths", async () => {
		reduced = true;
		const long = `/${"a".repeat(90)}`;
		await renderNotFound(long);
		expect(await screen.findByText(`cd ${long.slice(0, 60)}…`)).toBeInTheDocument();
	});

	it("offers Home and All tools links and the live tool count", async () => {
		reduced = true;
		await renderNotFound("/nope");
		const { TOOLS_REGISTRY } = await import("@/config/tools-registry");
		const count = TOOLS_REGISTRY.filter((t) => t.implemented).length;
		expect(screen.getByRole("link", { name: "All tools" })).toHaveAttribute("href", "/tools");
		expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
		expect(screen.getByText(String(count))).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "404" })).toBeInTheDocument();
	});

	it("has no a11y violations", async () => {
		reduced = true;
		const { container } = await renderNotFound("/nope");
		await screen.findByText("cd /nope");
		expect(await axe(container)).toHaveNoViolations();
	});
});
