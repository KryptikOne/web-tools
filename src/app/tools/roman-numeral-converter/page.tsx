import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import RomanNumeralConverter from '@/features/roman-numeral-converter/RomanNumeralConverter';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("roman-numeral-converter");

export default function RomanNumeralConverterPage() {
	const tool = getToolById("roman-numeral-converter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<RomanNumeralConverter />
		</ToolLayout>
	);
}
