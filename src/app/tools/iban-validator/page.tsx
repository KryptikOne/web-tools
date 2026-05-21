import ToolLayout from "@/components/ToolLayout/ToolLayout";
import IbanValidator from "@/features/iban-validator/IbanValidator";

export default function IbanValidatorPage() {
	return (
		<ToolLayout>
			<IbanValidator />
		</ToolLayout>
	);
}
