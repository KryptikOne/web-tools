import ToolLayout from "@/components/ToolLayout/ToolLayout";
import GraphCalculator from "@/features/graph-calculator/GraphCalculator";
import { getToolById } from "@/config/tools-registry";

export default function GraphCalculatorPage() {
	const tool = getToolById("graph-calculator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<GraphCalculator />
		</ToolLayout>
	);
}
