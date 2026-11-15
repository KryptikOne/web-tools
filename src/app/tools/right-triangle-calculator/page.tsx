import { toolMetadata } from "@/config/seo";
import RightTriangleCalculator from "@/features/right-triangle-calculator/RightTriangleCalculator";

export const metadata = toolMetadata("right-triangle-calculator");

export default function RightTriangleCalculatorPage() {
	return <RightTriangleCalculator />;
}
