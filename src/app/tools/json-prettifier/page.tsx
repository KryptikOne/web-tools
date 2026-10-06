import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import JsonPrettifier from "@/features/json-prettifier/JsonPrettifier";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("json-prettifier");

export default function JsonPrettifierPage() {
	const tool = getToolById("json-prettifier")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<JsonPrettifier />
		</ToolLayout>
	);
}
