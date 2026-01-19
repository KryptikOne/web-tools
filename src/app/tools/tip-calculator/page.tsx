import { Metadata } from "next";
import TipCalculator from "@/features/tip-calculator/TipCalculator";

export const metadata: Metadata = {
	title: "Tip Calculator | Web Tools",
	description: "Calculate tips easily with preset percentages or custom amounts. Split bills between multiple people and see per-person totals.",
};

export default function TipCalculatorPage() {
	return <TipCalculator />;
}
