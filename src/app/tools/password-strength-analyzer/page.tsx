import ToolLayout from "@/components/ToolLayout/ToolLayout";
import PasswordStrengthAnalyzer from "@/features/password-strength-analyzer/PasswordStrengthAnalyzer";
import { getToolById } from "@/config/tools-registry";

export const metadata = {
	title: "Password Strength Analyser - Web Tools",
	description:
		"Estimate password strength, crack time, and get actionable feedback using zxcvbn. Fully client-side.",
};

export default function PasswordStrengthAnalyzerPage() {
	const tool = getToolById("password-strength-analyzer")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<PasswordStrengthAnalyzer />
		</ToolLayout>
	);
}
