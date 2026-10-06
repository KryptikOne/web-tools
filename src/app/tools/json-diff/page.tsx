import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import JsonDiff from "@/features/json-diff/JsonDiff";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("json-diff");

export default function JsonDiffPage() {
	const tool = getToolById("json-diff")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<JsonDiff />
		</ToolLayout>
	);
}
