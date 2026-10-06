import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import Chronometer from "@/features/chronometer/Chronometer";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("chronometer");

export default function ChronometerPage() {
	const tool = getToolById("chronometer")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<Chronometer />
		</ToolLayout>
	);
}
