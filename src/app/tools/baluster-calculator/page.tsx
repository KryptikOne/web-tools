import { toolMetadata } from "@/config/seo";
import BalusterCalculator from "@/features/baluster-calculator/BalusterCalculator";

export const metadata = toolMetadata("baluster-calculator");

export default function BalusterCalculatorPage() {
	return <BalusterCalculator />;
}
