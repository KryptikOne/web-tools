import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import TomlConverter from '@/features/toml-converter/TomlConverter';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("toml-converter");

export default function TomlConverterPage() {
	const tool = getToolById("toml-converter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<TomlConverter />
		</ToolLayout>
	);
}
