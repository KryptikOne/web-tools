import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import GitCheatsheet from "@/features/git-cheatsheet/GitCheatsheet";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("git-cheatsheet");

export default function GitCheatsheetPage() {
	const tool = getToolById("git-cheatsheet")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<GitCheatsheet />
		</ToolLayout>
	);
}
