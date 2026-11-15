import { toolMetadata } from "@/config/seo";
import StairCalculator from "@/features/stair-calculator/StairCalculator";

export const metadata = toolMetadata("stair-calculator");

export default function StairCalculatorPage() {
	return <StairCalculator />;
}
