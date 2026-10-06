import { toolMetadata } from "@/config/seo";
import NumberBaseConverter from "@/features/number-base-converter/NumberBaseConverter";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { HashtagIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("number-base-converter");

export default function NumberBaseConverterPage() {
	return (
		<ToolLayout
			title="Number Base Converter"
			description="Convert numbers between binary, octal, decimal, hex, and custom bases"
			icon={<HashtagIcon />}
		>
			<NumberBaseConverter />
		</ToolLayout>
	);
}
