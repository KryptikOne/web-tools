import ToolLayout from "@/components/ToolLayout/ToolLayout";
import BcryptTool from "@/features/bcrypt-tool/BcryptTool";

export const metadata = {
	title: "Bcrypt Generator & Verifier - Web Tools",
	description:
		"Hash text with bcrypt or verify a string against an existing bcrypt hash. Adjustable cost factor 4-15.",
};

export default function BcryptToolPage() {
	return (
		<ToolLayout>
			<BcryptTool />
		</ToolLayout>
	);
}
