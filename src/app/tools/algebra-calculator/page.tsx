import ToolLayout from "@/components/ToolLayout/ToolLayout";
import AlgebraCalculator from "@/features/algebra-calculator/AlgebraCalculator";
import { getToolById } from "@/config/tools-registry";

export default function AlgebraCalculatorPage() {
	const tool = getToolById("algebra-calculator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<AlgebraCalculator />
		</ToolLayout>
	);
}
