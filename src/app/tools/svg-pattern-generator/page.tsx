import ToolLayout from "@/components/ToolLayout/ToolLayout";
import SvgPatternGenerator from "@/features/svg-pattern-generator/SvgPatternGenerator";
import { ViewfinderCircleIcon } from "@heroicons/react/24/outline";

export const metadata = {
	title: "SVG Pattern Generator - Web Tools",
	description:
		"Create seamless SVG patterns with live preview, CSS output, and downloadable SVG files",
};

export default function SvgPatternGeneratorPage() {
	return (
		<ToolLayout
			title="SVG Pattern Generator"
			description="Create seamless SVG patterns with live preview, CSS output, and downloadable SVG files"
			icon={<ViewfinderCircleIcon />}
		>
			<SvgPatternGenerator />
		</ToolLayout>
	);
}
