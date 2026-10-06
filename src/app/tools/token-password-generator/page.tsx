import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import TokenPasswordGenerator from "@/features/token-password-generator/TokenPasswordGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("token-password-generator");

export default function TokenPasswordGeneratorPage() {
	const tool = getToolById("token-password-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<TokenPasswordGenerator />
		</ToolLayout>
	);
}
