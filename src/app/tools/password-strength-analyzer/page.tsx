import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import PasswordStrengthAnalyzer from "@/features/password-strength-analyzer/PasswordStrengthAnalyzer";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("password-strength-analyzer");

export default function PasswordStrengthAnalyzerPage() {
	const tool = getToolById("password-strength-analyzer")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<PasswordStrengthAnalyzer />
		</ToolLayout>
	);
}
