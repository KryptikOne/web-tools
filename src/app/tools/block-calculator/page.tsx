import { toolMetadata } from "@/config/seo";
import BlockCalculator from "@/features/block-calculator/BlockCalculator";

export const metadata = toolMetadata("block-calculator");

export default function BlockCalculatorPage() {
	return <BlockCalculator />;
}
