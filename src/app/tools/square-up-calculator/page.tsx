import { toolMetadata } from "@/config/seo";
import SquareUpCalculator from "@/features/square-up-calculator/SquareUpCalculator";

export const metadata = toolMetadata("square-up-calculator");

export default function SquareUpCalculatorPage() {
	return <SquareUpCalculator />;
}
