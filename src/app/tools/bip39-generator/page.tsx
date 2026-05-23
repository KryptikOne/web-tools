import ToolLayout from "@/components/ToolLayout/ToolLayout";
import Bip39Generator from "@/features/bip39-generator/Bip39Generator";
import { getToolById } from "@/config/tools-registry";

export const metadata = {
	title: "BIP39 Mnemonic Generator - Web Tools",
	description:
		"Generate and validate BIP39 mnemonics. Derive entropy and 64-byte seeds. All client-side.",
};

export default function Bip39GeneratorPage() {
	const tool = getToolById("bip39-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<Bip39Generator />
		</ToolLayout>
	);
}
