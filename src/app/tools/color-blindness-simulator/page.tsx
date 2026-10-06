import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import ColorBlindnessSimulator from "@/features/color-blindness-simulator/ColorBlindnessSimulator";
import { EyeIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("color-blindness-simulator");

export default function ColorBlindnessSimulatorPage() {
	return (
		<ToolLayout title="Color Blindness Simulator" description="Simulate how colors and images appear with different color vision deficiencies" icon={<EyeIcon />}>
			<ColorBlindnessSimulator />
		</ToolLayout>
	);
}
