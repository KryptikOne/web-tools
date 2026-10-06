import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import RandomNumberGenerator from "@/features/random-number-generator/RandomNumberGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("random-number-generator");

export default function RandomNumberGeneratorPage() {
	const tool = getToolById("random-number-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<RandomNumberGenerator />
		</ToolLayout>
	);
}
