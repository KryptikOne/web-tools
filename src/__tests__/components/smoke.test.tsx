import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

// Mock next/link
vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
		<a href={href} {...props}>{children}</a>
	),
}));

// Mock clipboard API
beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	});
});

describe("MarkdownPreview", () => {
	it("renders editor and preview panels", async () => {
		const { default: MarkdownPreview } = await import(
			"@/features/markdown-preview/MarkdownPreview"
		);
		render(<MarkdownPreview />);

		expect(screen.getByText("Editor")).toBeInTheDocument();
		expect(screen.getByText("Preview")).toBeInTheDocument();
	});

	it("renders the textarea with sample markdown", async () => {
		const { default: MarkdownPreview } = await import(
			"@/features/markdown-preview/MarkdownPreview"
		);
		render(<MarkdownPreview />);

		const textarea = screen.getByPlaceholderText("Type your markdown here...");
		expect(textarea).toBeInTheDocument();
		expect((textarea as HTMLTextAreaElement).value).toContain("Markdown Preview");
	});

	it("shows word and character stats", async () => {
		const { default: MarkdownPreview } = await import(
			"@/features/markdown-preview/MarkdownPreview"
		);
		render(<MarkdownPreview />);

		expect(screen.getByText("words")).toBeInTheDocument();
		expect(screen.getByText("characters")).toBeInTheDocument();
	});

	it("renders copy buttons", async () => {
		const { default: MarkdownPreview } = await import(
			"@/features/markdown-preview/MarkdownPreview"
		);
		render(<MarkdownPreview />);

		expect(screen.getByText("Copy HTML")).toBeInTheDocument();
		expect(screen.getByText("Copy Markdown")).toBeInTheDocument();
	});
});

describe("SvgOptimizer", () => {
	it("renders input section and upload button", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		render(<SvgOptimizer />);

		expect(screen.getByText("SVG Input")).toBeInTheDocument();
		expect(screen.getByText("Upload SVG")).toBeInTheDocument();
	});

	it("renders global settings and plugin list", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		render(<SvgOptimizer />);

		expect(screen.getByText("Global settings")).toBeInTheDocument();
		expect(screen.getByText("Plugins")).toBeInTheDocument();
		expect(screen.getByText("Reset to defaults")).toBeInTheDocument();
	});

	it("renders textarea with placeholder", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		render(<SvgOptimizer />);

		expect(
			screen.getByPlaceholderText("Paste your SVG code here…")
		).toBeInTheDocument();
	});

	it("renders drag-and-drop zone when empty", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		render(<SvgOptimizer />);

		expect(
			screen.getByText(/Drag and drop an SVG file/)
		).toBeInTheDocument();
	});
});

describe("HtmlTagRemover", () => {
	it("renders input and output panels", async () => {
		const { default: HtmlTagRemover } = await import(
			"@/features/html-tag-remover/HtmlTagRemover"
		);
		render(<HtmlTagRemover />);

		expect(screen.getByText("HTML Input")).toBeInTheDocument();
		expect(screen.getByText("Stripped Text")).toBeInTheDocument();
	});

	it("renders option checkboxes", async () => {
		const { default: HtmlTagRemover } = await import(
			"@/features/html-tag-remover/HtmlTagRemover"
		);
		render(<HtmlTagRemover />);

		expect(screen.getByText("Preserve line breaks")).toBeInTheDocument();
		expect(screen.getByText("Preserve links")).toBeInTheDocument();
		expect(screen.getByText("Remove specific tags only")).toBeInTheDocument();
	});

	it("renders textareas with correct placeholders", async () => {
		const { default: HtmlTagRemover } = await import(
			"@/features/html-tag-remover/HtmlTagRemover"
		);
		render(<HtmlTagRemover />);

		expect(
			screen.getByPlaceholderText("Paste your HTML here...")
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Stripped text will appear here...")
		).toBeInTheDocument();
	});

	it("renders info section", async () => {
		const { default: HtmlTagRemover } = await import(
			"@/features/html-tag-remover/HtmlTagRemover"
		);
		render(<HtmlTagRemover />);

		expect(screen.getByText("How it works")).toBeInTheDocument();
		expect(screen.getByText("Safe Parsing")).toBeInTheDocument();
	});
});
