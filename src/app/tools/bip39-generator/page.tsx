import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import Bip39Generator from "@/features/bip39-generator/Bip39Generator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("bip39-generator");

export default function Bip39GeneratorPage() {
	const tool = getToolById("bip39-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<Bip39Generator />
		</ToolLayout>
	);
}
