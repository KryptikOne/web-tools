import { toolMetadata } from "@/config/seo";
import ShelfCalculator from "@/features/shelf-calculator/ShelfCalculator";

export const metadata = toolMetadata("shelf-calculator");

export default function ShelfCalculatorPage() {
	return <ShelfCalculator />;
}
