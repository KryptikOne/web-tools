import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import MathExpressionEvaluator from "@/features/math-expression-evaluator/MathExpressionEvaluator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("math-expression-evaluator");

export default function MathExpressionEvaluatorPage() {
	const tool = getToolById("math-expression-evaluator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<MathExpressionEvaluator />
		</ToolLayout>
	);
}
