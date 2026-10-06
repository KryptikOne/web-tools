import { toolMetadata } from "@/config/seo";
import AspectRatioCalculator from "@/features/aspect-ratio-calculator/AspectRatioCalculator";

export const metadata = toolMetadata("aspect-ratio-calculator");

export default function AspectRatioCalculatorPage() {
	return <AspectRatioCalculator />;
}
