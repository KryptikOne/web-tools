import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import ContrastChecker from "@/features/contrast-checker/ContrastChecker";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("contrast-checker");

export default function ContrastCheckerPage() {
	const tool = getToolById("contrast-checker")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<ContrastChecker />
		</ToolLayout>
	);
}
