import { toolMetadata } from "@/config/seo";
import PitchCalculator from "@/features/pitch-calculator/PitchCalculator";

export const metadata = toolMetadata("pitch-calculator");

export default function PitchCalculatorPage() {
	return <PitchCalculator />;
}
