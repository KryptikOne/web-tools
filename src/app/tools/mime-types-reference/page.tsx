import ToolLayout from "@/components/ToolLayout/ToolLayout";
import MimeTypesReference from "@/features/mime-types-reference/MimeTypesReference";
import { getToolById } from "@/config/tools-registry";

export default function MimeTypesReferencePage() {
	const tool = getToolById("mime-types-reference")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<MimeTypesReference />
		</ToolLayout>
	);
}
