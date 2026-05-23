import ToolLayout from "@/components/ToolLayout/ToolLayout";
import SafelinkDecoder from "@/features/safelink-decoder/SafelinkDecoder";
import { getToolById } from "@/config/tools-registry";

export default function SafelinkDecoderPage() {
	const tool = getToolById("safelink-decoder")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<SafelinkDecoder />
		</ToolLayout>
	);
}
