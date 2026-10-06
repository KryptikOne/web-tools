import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import SqlFormatter from "@/features/sql-formatter/SqlFormatter";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("sql-formatter");

export default function SqlFormatterPage() {
	const tool = getToolById("sql-formatter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<SqlFormatter />
		</ToolLayout>
	);
}
