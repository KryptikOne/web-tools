import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { Provider } from "react-redux";
import { store } from "@/store";
import ConstructionDemo from "@/app/styleguide/construction/ConstructionDemo";

expect.extend(toHaveNoViolations);

beforeAll(() => {
	Object.assign(navigator, { clipboard: { writeText: async () => undefined } });
});

describe("Construction styleguide demo", () => {
	it("renders every primitive, follows the unit switch, and is accessible", async () => {
		const { container } = render(
			<Provider store={store}>
				<ConstructionDemo />
			</Provider>,
		);
		expect(screen.getByRole("img", { name: /Right triangle/ })).toBeInTheDocument();
		expect(screen.getByRole("table", { name: "Running measurements" })).toBeInTheDocument();
		expect(screen.getByText("2x4").closest("tr")).toHaveTextContent("1 1/2\" x 3 1/2\"");

		fireEvent.click(screen.getByRole("radio", { name: "Metric" }));
		expect(screen.getByText("2x4").closest("tr")).toHaveTextContent("38.1 mm x 88.9 mm");
		expect(document.querySelector("[data-print-root]")).not.toBeNull();

		expect(await axe(container)).toHaveNoViolations();
	});
});
