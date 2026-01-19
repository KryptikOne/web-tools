import { Metadata } from "next";
import PercentageCalculator from "@/features/percentage-calculator/PercentageCalculator";

export const metadata: Metadata = {
	title: "Percentage Calculator | Web Tools",
	description: "Calculate percentages easily. Find what percent one number is of another, calculate percentage of a number, or find the whole from a part and percentage.",
};

export default function PercentageCalculatorPage() {
	return <PercentageCalculator />;
}
