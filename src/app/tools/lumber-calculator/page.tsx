import { toolMetadata } from "@/config/seo";
import LumberCalculator from "@/features/lumber-calculator/LumberCalculator";

export const metadata = toolMetadata("lumber-calculator");

export default function LumberCalculatorPage() {
	return <LumberCalculator />;
}
