import { toolMetadata } from "@/config/seo";
import BandwidthCalculator from "@/features/bandwidth-calculator/BandwidthCalculator";

export const metadata = toolMetadata("bandwidth-calculator");

export default function BandwidthCalculatorPage() {
	return <BandwidthCalculator />;
}
