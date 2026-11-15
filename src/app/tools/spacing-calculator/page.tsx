import { toolMetadata } from "@/config/seo";
import SpacingCalculator from "@/features/spacing-calculator/SpacingCalculator";

export const metadata = toolMetadata("spacing-calculator");

export default function SpacingCalculatorPage() {
	return <SpacingCalculator />;
}
