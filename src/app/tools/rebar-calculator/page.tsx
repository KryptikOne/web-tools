import { toolMetadata } from "@/config/seo";
import RebarCalculator from "@/features/rebar-calculator/RebarCalculator";

export const metadata = toolMetadata("rebar-calculator");

export default function RebarCalculatorPage() {
	return <RebarCalculator />;
}
