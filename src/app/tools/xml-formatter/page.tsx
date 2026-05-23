import ToolLayout from "@/components/ToolLayout/ToolLayout";
import XmlFormatter from "@/features/xml-formatter/XmlFormatter";
import { getToolById } from "@/config/tools-registry";

export default function XmlFormatterPage() {
	const tool = getToolById("xml-formatter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<XmlFormatter />
		</ToolLayout>
	);
}
