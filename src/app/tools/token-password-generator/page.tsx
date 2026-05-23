import ToolLayout from "@/components/ToolLayout/ToolLayout";
import TokenPasswordGenerator from "@/features/token-password-generator/TokenPasswordGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = {
	title: "Token & Password Generator - Web Tools",
	description:
		"Generate cryptographically secure random tokens and passwords with configurable charset, length, and entropy estimate.",
};

export default function TokenPasswordGeneratorPage() {
	const tool = getToolById("token-password-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<TokenPasswordGenerator />
		</ToolLayout>
	);
}
