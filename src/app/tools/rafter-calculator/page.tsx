import { toolMetadata } from "@/config/seo";
import RafterCalculator from "@/features/rafter-calculator/RafterCalculator";

export const metadata = toolMetadata("rafter-calculator");

export default function RafterCalculatorPage() {
	return <RafterCalculator />;
}
