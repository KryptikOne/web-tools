import ToolLayout from "@/components/ToolLayout/ToolLayout";
import MathExpressionEvaluator from "@/features/math-expression-evaluator/MathExpressionEvaluator";
import { getToolById } from "@/config/tools-registry";

export default function MathExpressionEvaluatorPage() {
	const tool = getToolById("math-expression-evaluator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<MathExpressionEvaluator />
		</ToolLayout>
	);
}
