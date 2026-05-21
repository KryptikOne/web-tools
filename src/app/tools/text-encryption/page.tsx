import ToolLayout from "@/components/ToolLayout/ToolLayout";
import TextEncryption from "@/features/text-encryption/TextEncryption";

export const metadata = {
	title: "Text Encryption / Decryption - Web Tools",
	description:
		"Encrypt and decrypt text symmetrically with a passphrase using AES-GCM and PBKDF2. Fully client-side.",
};

export default function TextEncryptionPage() {
	return (
		<ToolLayout>
			<TextEncryption />
		</ToolLayout>
	);
}
