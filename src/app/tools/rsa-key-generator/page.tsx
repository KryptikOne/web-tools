import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import RsaKeyGenerator from "@/features/rsa-key-generator/RsaKeyGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("rsa-key-generator");

export default function RsaKeyGeneratorPage() {
	const tool = getToolById("rsa-key-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<RsaKeyGenerator />
		</ToolLayout>
	);
}
