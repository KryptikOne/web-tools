import ToolLayout from "@/components/ToolLayout/ToolLayout";
import PasswordStrengthAnalyzer from "@/features/password-strength-analyzer/PasswordStrengthAnalyzer";

export const metadata = {
	title: "Password Strength Analyser - Web Tools",
	description:
		"Estimate password strength, crack time, and get actionable feedback using zxcvbn. Fully client-side.",
};

export default function PasswordStrengthAnalyzerPage() {
	return (
		<ToolLayout>
			<PasswordStrengthAnalyzer />
		</ToolLayout>
	);
}
