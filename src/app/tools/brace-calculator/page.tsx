import { toolMetadata } from "@/config/seo";
import BraceCalculator from "@/features/brace-calculator/BraceCalculator";

export const metadata = toolMetadata("brace-calculator");

export default function BraceCalculatorPage() {
	return <BraceCalculator />;
}
