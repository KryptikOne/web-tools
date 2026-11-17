import { toolMetadata } from "@/config/seo";
import KerfCalculator from "@/features/kerf-calculator/KerfCalculator";

export const metadata = toolMetadata("kerf-calculator");

export default function KerfCalculatorPage() {
	return <KerfCalculator />;
}
