import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import NatoPhoneticConverter from '@/features/nato-phonetic-converter/NatoPhoneticConverter';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("nato-phonetic-converter");

export default function NatoPhoneticConverterPage() {
	const tool = getToolById("nato-phonetic-converter")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<NatoPhoneticConverter />
		</ToolLayout>
	);
}
