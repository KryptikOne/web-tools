import { toolMetadata } from "@/config/seo";
import WainscotCalculator from "@/features/wainscot-calculator/WainscotCalculator";

export const metadata = toolMetadata("wainscot-calculator");

export default function WainscotCalculatorPage() {
	return <WainscotCalculator />;
}
