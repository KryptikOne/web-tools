import { toolMetadata } from "@/config/seo";
import FenceCalculator from "@/features/fence-calculator/FenceCalculator";

export const metadata = toolMetadata("fence-calculator");

export default function FenceCalculatorPage() {
	return <FenceCalculator />;
}
