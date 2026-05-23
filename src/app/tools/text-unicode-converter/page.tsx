import ToolLayout from '@/components/ToolLayout/ToolLayout';
import TextUnicodeConverter from '@/features/text-unicode-converter/TextUnicodeConverter';
import { getToolById } from "@/config/tools-registry";

export default function TextUnicodeConverterPage() {
	const tool = getToolById("text-unicode-converter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<TextUnicodeConverter />
		</ToolLayout>
	);
}
