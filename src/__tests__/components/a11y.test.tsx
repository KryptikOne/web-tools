import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { ToolCategory } from "@/types/tools";

expect.extend(toHaveNoViolations);

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

describe("Accessibility — Shared Components", () => {
	it("ToolCard has no a11y violations", async () => {
		const { default: ToolCard } = await import(
			"@/components/ToolCard/ToolCard"
		);
		const { container } = render(
			<ToolCard
				tool={{
					id: "test-tool",
					name: "Test Tool",
					description: "A test tool description",
					category: ToolCategory.CSS_DESIGN,
					route: "/tools/test-tool",
					implemented: true,
				}}
			/>
		);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("ToolLayout has no a11y violations", async () => {
		const { default: ToolLayout } = await import(
			"@/components/ToolLayout/ToolLayout"
		);
		const { container } = render(
			<ToolLayout title="Test Tool" description="A test description">
				<p>Tool content</p>
			</ToolLayout>
		);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe("Accessibility — High-Risk Tools", () => {
	it("MarkdownPreview has no a11y violations", async () => {
		const { default: MarkdownPreview } = await import(
			"@/features/markdown-preview/MarkdownPreview"
		);
		const { container } = render(<MarkdownPreview />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("HtmlTagRemover has no a11y violations", async () => {
		const { default: HtmlTagRemover } = await import(
			"@/features/html-tag-remover/HtmlTagRemover"
		);
		const { container } = render(<HtmlTagRemover />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("SvgOptimizer has no a11y violations", async () => {
		const { default: SvgOptimizer } = await import(
			"@/features/svg-optimizer/SvgOptimizer"
		);
		const { container } = render(<SvgOptimizer />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe("Accessibility — Feature Tools", () => {
	it("UuidGenerator has no a11y violations", async () => {
		const { default: UuidGenerator } = await import(
			"@/features/uuid-generator/UuidGenerator"
		);
		const { container } = render(<UuidGenerator />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("UrlEncoderDecoder has no a11y violations", async () => {
		const { default: UrlEncoderDecoder } = await import(
			"@/features/url-encoder-decoder/UrlEncoderDecoder"
		);
		const { container } = render(<UrlEncoderDecoder />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("JsonToYaml has no a11y violations", async () => {
		const { default: JsonToYaml } = await import(
			"@/features/json-to-yaml/JsonToYaml"
		);
		const { container } = render(<JsonToYaml />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("HttpStatusCodes has no a11y violations", async () => {
		const { default: HttpStatusCodes } = await import(
			"@/features/http-status-codes/HttpStatusCodes"
		);
		const { container } = render(<HttpStatusCodes />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it("WeightConverter has no a11y violations", async () => {
		const { default: WeightConverter } = await import(
			"@/features/weight-converter/WeightConverter"
		);
		const { container } = render(<WeightConverter />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
