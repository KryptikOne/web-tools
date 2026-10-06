import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import EmailNormalizer from "@/features/email-normalizer/EmailNormalizer";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("email-normalizer");

export default function EmailNormalizerPage() {
	const tool = getToolById("email-normalizer")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<EmailNormalizer />
		</ToolLayout>
	);
}
