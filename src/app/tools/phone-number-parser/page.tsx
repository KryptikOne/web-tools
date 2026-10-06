import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import PhoneNumberParser from "@/features/phone-number-parser/PhoneNumberParser";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("phone-number-parser");

export default function PhoneNumberParserPage() {
	const tool = getToolById("phone-number-parser")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<PhoneNumberParser />
		</ToolLayout>
	);
}
