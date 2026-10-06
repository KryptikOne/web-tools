import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import RandomPortGenerator from "@/features/random-port-generator/RandomPortGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("random-port-generator");

export default function RandomPortGeneratorPage() {
	const tool = getToolById("random-port-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<RandomPortGenerator />
		</ToolLayout>
	);
}
