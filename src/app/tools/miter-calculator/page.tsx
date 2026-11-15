import { toolMetadata } from "@/config/seo";
import MiterCalculator from "@/features/miter-calculator/MiterCalculator";

export const metadata = toolMetadata("miter-calculator");

export default function MiterCalculatorPage() {
	return <MiterCalculator />;
}
