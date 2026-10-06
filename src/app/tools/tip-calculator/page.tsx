import { toolMetadata } from "@/config/seo";
import TipCalculator from "@/features/tip-calculator/TipCalculator";

export const metadata = toolMetadata("tip-calculator");

export default function TipCalculatorPage() {
	return <TipCalculator />;
}
