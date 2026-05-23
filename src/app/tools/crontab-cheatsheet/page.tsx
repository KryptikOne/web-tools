import ToolLayout from "@/components/ToolLayout/ToolLayout";
import CrontabCheatsheet from "@/features/crontab-cheatsheet/CrontabCheatsheet";
import { getToolById } from "@/config/tools-registry";

export default function CrontabCheatsheetPage() {
	const tool = getToolById("crontab-cheatsheet")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<CrontabCheatsheet />
		</ToolLayout>
	);
}
