import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import YamlViewer from "@/features/yaml-viewer/YamlViewer";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("yaml-viewer");

export default function YamlViewerPage() {
	const tool = getToolById("yaml-viewer")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<YamlViewer />
		</ToolLayout>
	);
}
