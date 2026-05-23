import ToolLayout from '@/components/ToolLayout/ToolLayout';
import TomlConverter from '@/features/toml-converter/TomlConverter';
import { getToolById } from "@/config/tools-registry";

export default function TomlConverterPage() {
	const tool = getToolById("toml-converter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<TomlConverter />
		</ToolLayout>
	);
}
