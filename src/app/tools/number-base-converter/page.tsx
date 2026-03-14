import NumberBaseConverter from "@/features/number-base-converter/NumberBaseConverter";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { HashtagIcon } from "@heroicons/react/24/outline";

export const metadata = {
	title: "Number Base Converter - Web Tools",
	description: "Convert numbers between binary, octal, decimal, hexadecimal, and custom bases (2-36) with grouped display and bit length representations",
};

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
