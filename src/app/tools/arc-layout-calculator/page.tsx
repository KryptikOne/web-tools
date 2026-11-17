import { toolMetadata } from "@/config/seo";
import ArcLayoutCalculator from "@/features/arc-layout-calculator/ArcLayoutCalculator";

export const metadata = toolMetadata("arc-layout-calculator");

export default function ArcLayoutCalculatorPage() {
	return <ArcLayoutCalculator />;
}
