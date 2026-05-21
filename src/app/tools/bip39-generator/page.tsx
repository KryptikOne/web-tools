import ToolLayout from "@/components/ToolLayout/ToolLayout";
import Bip39Generator from "@/features/bip39-generator/Bip39Generator";

export const metadata = {
	title: "BIP39 Mnemonic Generator - Web Tools",
	description:
		"Generate and validate BIP39 mnemonics. Derive entropy and 64-byte seeds. All client-side.",
};

export default function Bip39GeneratorPage() {
	return (
		<ToolLayout>
			<Bip39Generator />
		</ToolLayout>
	);
}
