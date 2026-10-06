import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import CrontabCheatsheet from "@/features/crontab-cheatsheet/CrontabCheatsheet";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("crontab-cheatsheet");

export default function CrontabCheatsheetPage() {
	const tool = getToolById("crontab-cheatsheet")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<CrontabCheatsheet />
		</ToolLayout>
	);
}
