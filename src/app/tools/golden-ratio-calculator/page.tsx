import { toolMetadata } from "@/config/seo";
import GoldenRatioCalculator from "@/features/golden-ratio-calculator/GoldenRatioCalculator";

export const metadata = toolMetadata("golden-ratio-calculator");

export default function GoldenRatioCalculatorPage() {
	return <GoldenRatioCalculator />;
}
