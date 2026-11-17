import { toolMetadata } from "@/config/seo";
import BrickCalculator from "@/features/brick-calculator/BrickCalculator";

export const metadata = toolMetadata("brick-calculator");

export default function BrickCalculatorPage() {
	return <BrickCalculator />;
}
