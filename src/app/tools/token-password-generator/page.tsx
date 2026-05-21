import ToolLayout from "@/components/ToolLayout/ToolLayout";
import TokenPasswordGenerator from "@/features/token-password-generator/TokenPasswordGenerator";

export const metadata = {
	title: "Token & Password Generator - Web Tools",
	description:
		"Generate cryptographically secure random tokens and passwords with configurable charset, length, and entropy estimate.",
};

export default function TokenPasswordGeneratorPage() {
	return (
		<ToolLayout>
			<TokenPasswordGenerator />
		</ToolLayout>
	);
}
