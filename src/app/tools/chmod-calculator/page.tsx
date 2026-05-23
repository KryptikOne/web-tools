import ToolLayout from "@/components/ToolLayout/ToolLayout";
import ChmodCalculator from "@/features/chmod-calculator/ChmodCalculator";
import { getToolById } from "@/config/tools-registry";

export default function ChmodCalculatorPage() {
	const tool = getToolById("chmod-calculator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<ChmodCalculator />
		</ToolLayout>
	);
}
