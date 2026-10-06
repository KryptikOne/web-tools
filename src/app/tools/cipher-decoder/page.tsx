import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import CipherDecoder from "@/features/cipher-decoder/CipherDecoder";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("cipher-decoder");

export default function CipherDecoderPage() {
	const tool = getToolById("cipher-decoder")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<CipherDecoder />
		</ToolLayout>
	);
}
