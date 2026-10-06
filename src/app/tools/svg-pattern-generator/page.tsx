import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import SvgPatternGenerator from "@/features/svg-pattern-generator/SvgPatternGenerator";
import { ViewfinderCircleIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("svg-pattern-generator");

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
