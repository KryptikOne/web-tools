import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
		<a href={href} {...props}>{children}</a>
	),
}));

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn().mockResolvedValue("") },
	});
	// jsdom has no createObjectURL
	Object.assign(URL, { createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() });
});

describe("Contrast checker", () => {
	it("computes a ratio, fixes to AA, and has no a11y violations", async () => {
		const { default: ContrastChecker } = await import("@/features/contrast-checker/ContrastChecker");
		const { container } = render(<ContrastChecker />);
		expect(screen.getByText("14.18:1")).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Foreground"), { target: { value: "#777777" } });
		fireEvent.change(screen.getByLabelText("Background"), { target: { value: "#ffffff" } });
		fireEvent.click(screen.getByRole("button", { name: /Fix to AA$/ }));
		expect((screen.getByLabelText("Foreground") as HTMLInputElement).value).not.toBe("#777777");
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Cipher decoder", () => {
	it("auto-decodes a sample and switches to manual", async () => {
		const { default: CipherDecoder } = await import("@/features/cipher-decoder/CipherDecoder");
		const { container } = render(<CipherDecoder />);
		fireEvent.click(screen.getByRole("button", { name: "Caesar" }));
		expect(screen.getAllByText("THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG")[0]).toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "Manual" }));
		expect(screen.getByLabelText("Cipher")).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Cron builder", () => {
	it("keeps expression and rows in sync both ways", async () => {
		const { default: Cron } = await import("@/features/cron-expression-generator/CronExpressionGenerator");
		const { container } = render(<Cron />);
		const expr = screen.getByLabelText("Expression") as HTMLInputElement;
		expect(expr.value).toBe("30 9 * * 1-5");
		fireEvent.change(expr, { target: { value: "*/15 * * * *" } });
		expect(screen.getAllByText("Every 15 minutes").length).toBeGreaterThan(0);
		fireEvent.change(screen.getByLabelText("Hour field"), { target: { value: "9-17" } });
		expect(expr.value).toBe("*/15 9-17 * * *");
		fireEvent.click(screen.getByRole("button", { name: "Daily at noon" }));
		expect(expr.value).toBe("0 12 * * *");
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Number base converter", () => {
	it("updates every base live and toggles bits", async () => {
		const { default: Base } = await import("@/features/number-base-converter/NumberBaseConverter");
		const { container } = render(<Base />);
		fireEvent.change(screen.getByLabelText("Hexadecimal"), { target: { value: "1F" } });
		expect((screen.getByLabelText("Decimal") as HTMLInputElement).value).toBe("31");
		expect((screen.getByLabelText("Binary") as HTMLInputElement).value).toBe("11111");
		fireEvent.click(screen.getByRole("button", { name: "Bit 5, off" }));
		expect((screen.getByLabelText("Decimal") as HTMLInputElement).value).toBe("63");
		fireEvent.click(screen.getByRole("radio", { name: "Bitwise ops" }));
		expect(screen.getByLabelText("Value A")).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Unit converter panel", () => {
	it("recomputes every row from the edited one", async () => {
		const { default: Panel } = await import("@/components/UnitConverterPanel");
		const { getUnitCategory } = await import("@/lib/unitDefinitions");
		const { container } = render(<Panel category={getUnitCategory("length")!} initialUnitId="mi" initialValue="1" />);
		expect((screen.getByRole("textbox", { name: /^Kilometers/ }) as HTMLInputElement).value).toBe("1.6093");
		fireEvent.change(screen.getByRole("textbox", { name: /^Meters/ }), { target: { value: "100" } });
		expect((screen.getByRole("textbox", { name: /^Centimeters/ }) as HTMLInputElement).value).toBe("10000");
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Epoch & time calculator", () => {
	it("converts a unix timestamp into the other formats and does date math", async () => {
		const { default: Epoch } = await import("@/features/epoch-converter/EpochConverter");
		const { container } = render(<Epoch />);
		fireEvent.change(screen.getByLabelText("Zone"), { target: { value: "UTC" } });
		fireEvent.change(screen.getByLabelText("Unix (seconds)"), { target: { value: "1704067200" } });
		expect((screen.getByLabelText("ISO 8601") as HTMLInputElement).value).toBe("2024-01-01T00:00:00.000Z");
		fireEvent.click(screen.getByRole("radio", { name: "Date math" }));
		fireEvent.change(screen.getByLabelText("Starting date & time"), { target: { value: "2024-01-01 00:00:00" } });
		expect(screen.getByText("2024-01-08T00:00:00.000Z")).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Scientific calculator", () => {
	it("inserts from the keypad and evaluates in degrees", async () => {
		const { default: Calc } = await import("@/features/math-expression-evaluator/MathExpressionEvaluator");
		const { container } = render(<Calc />);
		fireEvent.click(screen.getByRole("button", { name: "sin" }));
		fireEvent.click(screen.getByRole("button", { name: "9" }));
		fireEvent.click(screen.getByRole("button", { name: "0" }));
		fireEvent.click(screen.getByRole("button", { name: ")" }));
		fireEvent.click(screen.getByRole("button", { name: "=" }));
		expect((await screen.findAllByText("= 1", {}, { timeout: 10000 })).length).toBeGreaterThan(0);
		expect(await axe(container)).toHaveNoViolations();
	}, 20000);
});

describe("Metadata stripper", () => {
	it("renders the drop zone with an accessible file input", async () => {
		const { default: Stripper } = await import("@/features/metadata-stripper/MetadataStripper");
		const { container } = render(<Stripper />);
		expect(screen.getByLabelText("Choose images to strip metadata from")).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Graph calculator", () => {
	it("renders functions and the plot", async () => {
		const { default: Graph } = await import("@/features/graph-calculator/GraphCalculator");
		const { container } = render(<Graph />);
		expect(screen.getByRole("img", { name: "Function plot" })).toBeInTheDocument();
		const list = within(container);
		expect(list.getAllByPlaceholderText("e.g. sin(x)")).toHaveLength(2);
		expect(await axe(container)).toHaveNoViolations();
	});
});

describe("Algebra calculator", () => {
	it("simplifies an expression", async () => {
		const { default: Algebra } = await import("@/features/algebra-calculator/AlgebraCalculator");
		const { container } = render(<Algebra />);
		fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
		expect(await screen.findByText("1+2*x", {}, { timeout: 15000 })).toBeInTheDocument();
		expect(await axe(container)).toHaveNoViolations();
	}, 30000);
});
