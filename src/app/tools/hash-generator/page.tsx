import { toolMetadata } from "@/config/seo";
import HashGenerator from "@/features/hash-generator/HashGenerator";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { FingerPrintIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("hash-generator");

export default function HashGeneratorPage() {
	return (
		<ToolLayout
			title="Hash Generator"
			description="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or files"
			icon={<FingerPrintIcon />}
		>
			<HashGenerator />
		</ToolLayout>
	);
}
