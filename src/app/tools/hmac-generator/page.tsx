import ToolLayout from "@/components/ToolLayout/ToolLayout";
import HmacGenerator from "@/features/hmac-generator/HmacGenerator";

export const metadata = {
	title: "HMAC Generator - Web Tools",
	description:
		"Compute HMAC of a message with a key using SHA-1/256/384/512. Outputs hex and base64.",
};

export default function HmacGeneratorPage() {
	return (
		<ToolLayout>
			<HmacGenerator />
		</ToolLayout>
	);
}
