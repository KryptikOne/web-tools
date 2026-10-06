import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import IbanValidator from "@/features/iban-validator/IbanValidator";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("iban-validator");

export default function IbanValidatorPage() {
	const tool = getToolById("iban-validator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<IbanValidator />
		</ToolLayout>
	);
}
