import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import TextEncryption from "@/features/text-encryption/TextEncryption";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("text-encryption");

export default function TextEncryptionPage() {
	const tool = getToolById("text-encryption")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<TextEncryption />
		</ToolLayout>
	);
}
