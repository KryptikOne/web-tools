import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import XmlJsonConverter from '@/features/xml-json-converter/XmlJsonConverter';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("xml-json-converter");

export default function XmlJsonConverterPage() {
	const tool = getToolById("xml-json-converter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<XmlJsonConverter />
		</ToolLayout>
	);
}
