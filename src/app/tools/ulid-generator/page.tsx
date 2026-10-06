import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import UlidGenerator from "@/features/ulid-generator/UlidGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("ulid-generator");

export default function UlidGeneratorPage() {
	const tool = getToolById("ulid-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<UlidGenerator />
		</ToolLayout>
	);
}
