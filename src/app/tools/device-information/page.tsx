import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import DeviceInformation from "@/features/device-information/DeviceInformation";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("device-information");

export default function DeviceInformationPage() {
	const tool = getToolById("device-information")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<DeviceInformation />
		</ToolLayout>
	);
}
