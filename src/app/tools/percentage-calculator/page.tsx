import { toolMetadata } from "@/config/seo";
import PercentageCalculator from "@/features/percentage-calculator/PercentageCalculator";

export const metadata = toolMetadata("percentage-calculator");

export default function PercentageCalculatorPage() {
	return <PercentageCalculator />;
}
