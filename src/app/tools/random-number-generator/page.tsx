import ToolLayout from "@/components/ToolLayout/ToolLayout";
import RandomNumberGenerator from "@/features/random-number-generator/RandomNumberGenerator";
import { getToolById } from "@/config/tools-registry";

export default function RandomNumberGeneratorPage() {
	const tool = getToolById("random-number-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<RandomNumberGenerator />
		</ToolLayout>
	);
}
