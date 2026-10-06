import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import EtaCalculator from "@/features/eta-calculator/EtaCalculator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("eta-calculator");

export default function EtaCalculatorPage() {
	const tool = getToolById("eta-calculator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<EtaCalculator />
		</ToolLayout>
	);
}
