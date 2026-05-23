import ToolLayout from "@/components/ToolLayout/ToolLayout";
import RegexCheatsheet from "@/features/regex-cheatsheet/RegexCheatsheet";
import { getToolById } from "@/config/tools-registry";

export default function RegexCheatsheetPage() {
	const tool = getToolById("regex-cheatsheet")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<RegexCheatsheet />
		</ToolLayout>
	);
}
