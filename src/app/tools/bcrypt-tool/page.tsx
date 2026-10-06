import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import BcryptTool from "@/features/bcrypt-tool/BcryptTool";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("bcrypt-tool");

export default function BcryptToolPage() {
	const tool = getToolById("bcrypt-tool")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<BcryptTool />
		</ToolLayout>
	);
}
