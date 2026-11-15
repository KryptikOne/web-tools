import { toolMetadata } from "@/config/seo";
import ConcreteCalculator from "@/features/concrete-calculator/ConcreteCalculator";

export const metadata = toolMetadata("concrete-calculator");

export default function ConcreteCalculatorPage() {
	return <ConcreteCalculator />;
}
