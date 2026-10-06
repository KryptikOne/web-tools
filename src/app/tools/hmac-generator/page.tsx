import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import HmacGenerator from "@/features/hmac-generator/HmacGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("hmac-generator");

export default function HmacGeneratorPage() {
	const tool = getToolById("hmac-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<HmacGenerator />
		</ToolLayout>
	);
}
