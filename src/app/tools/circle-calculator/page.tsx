import { toolMetadata } from "@/config/seo";
import CircleCalculator from "@/features/circle-calculator/CircleCalculator";

export const metadata = toolMetadata("circle-calculator");

export default function CircleCalculatorPage() {
	return <CircleCalculator />;
}
