import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import MetadataStripper from "@/features/metadata-stripper/MetadataStripper";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("metadata-stripper");

export default function MetadataStripperPage() {
	const tool = getToolById("metadata-stripper")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<MetadataStripper />
		</ToolLayout>
	);
}
