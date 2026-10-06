import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import ListConverter from '@/features/list-converter/ListConverter';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("list-converter");

export default function ListConverterPage() {
	const tool = getToolById("list-converter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<ListConverter />
		</ToolLayout>
	);
}
