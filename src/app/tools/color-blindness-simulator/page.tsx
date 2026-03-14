import ToolLayout from "@/components/ToolLayout/ToolLayout";
import ColorBlindnessSimulator from "@/features/color-blindness-simulator/ColorBlindnessSimulator";
import { EyeIcon } from "@heroicons/react/24/outline";

export const metadata = {
	title: "Color Blindness Simulator - Web Tools",
	description: "Simulate how colors and images appear to people with various types of color vision deficiency",
};

export default function ColorBlindnessSimulatorPage() {
	return (
		<ToolLayout title="Color Blindness Simulator" description="Simulate how colors and images appear with different color vision deficiencies" icon={<EyeIcon />}>
			<ColorBlindnessSimulator />
		</ToolLayout>
	);
}
