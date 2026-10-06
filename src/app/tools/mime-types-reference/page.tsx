import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import MimeTypesReference from "@/features/mime-types-reference/MimeTypesReference";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("mime-types-reference");

export default function MimeTypesReferencePage() {
	const tool = getToolById("mime-types-reference")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<MimeTypesReference />
		</ToolLayout>
	);
}
