import ToolLayout from "@/components/ToolLayout/ToolLayout";
import BcryptTool from "@/features/bcrypt-tool/BcryptTool";
import { getToolById } from "@/config/tools-registry";

export const metadata = {
	title: "Bcrypt Generator & Verifier - Web Tools",
	description:
		"Hash text with bcrypt or verify a string against an existing bcrypt hash. Adjustable cost factor 4-15.",
};

export default function BcryptToolPage() {
	const tool = getToolById("bcrypt-tool")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<BcryptTool />
		</ToolLayout>
	);
}
