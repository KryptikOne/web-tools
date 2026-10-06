import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import DockerRunToCompose from "@/features/docker-run-to-compose/DockerRunToCompose";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("docker-run-to-compose");

export default function DockerRunToComposePage() {
	const tool = getToolById("docker-run-to-compose")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<DockerRunToCompose />
		</ToolLayout>
	);
}
