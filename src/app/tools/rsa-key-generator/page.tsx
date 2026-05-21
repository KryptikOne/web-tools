import ToolLayout from "@/components/ToolLayout/ToolLayout";
import RsaKeyGenerator from "@/features/rsa-key-generator/RsaKeyGenerator";

export const metadata = {
	title: "RSA Key Pair Generator - Web Tools",
	description:
		"Generate RSA public/private key pairs (2048/3072/4096 bits) for signing or encryption. PEM output.",
};

export default function RsaKeyGeneratorPage() {
	return (
		<ToolLayout>
			<RsaKeyGenerator />
		</ToolLayout>
	);
}
