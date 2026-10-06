import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import JsonMinifier from "@/features/json-minifier/JsonMinifier";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("json-minifier");

export default function JsonMinifierPage() {
	const tool = getToolById("json-minifier")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<JsonMinifier />
		</ToolLayout>
	);
}
