import ToolLayout from "@/components/ToolLayout/ToolLayout";
import TextEncryption from "@/features/text-encryption/TextEncryption";
import { getToolById } from "@/config/tools-registry";

export const metadata = {
	title: "Text Encryption / Decryption - Web Tools",
	description:
		"Encrypt and decrypt text symmetrically with a passphrase using AES-GCM and PBKDF2. Fully client-side.",
};

export default function TextEncryptionPage() {
	const tool = getToolById("text-encryption")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<TextEncryption />
		</ToolLayout>
	);
}
