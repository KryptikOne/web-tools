import ToolLayout from "@/components/ToolLayout/ToolLayout";
import RsaKeyGenerator from "@/features/rsa-key-generator/RsaKeyGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = {
	title: "RSA Key Pair Generator - Web Tools",
	description:
		"Generate RSA public/private key pairs (2048/3072/4096 bits) for signing or encryption. PEM output.",
};

export default function RsaKeyGeneratorPage() {
	const tool = getToolById("rsa-key-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<RsaKeyGenerator />
		</ToolLayout>
	);
}
