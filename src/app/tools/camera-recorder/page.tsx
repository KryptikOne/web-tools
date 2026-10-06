import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import CameraRecorder from "@/features/camera-recorder/CameraRecorder";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("camera-recorder");

export default function CameraRecorderPage() {
	const tool = getToolById("camera-recorder")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<CameraRecorder />
		</ToolLayout>
	);
}
