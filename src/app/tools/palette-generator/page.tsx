import { toolMetadata } from "@/config/seo";
import PaletteGenerator from "@/features/palette-generator/PaletteGenerator";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { SwatchIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("palette-generator");

export default function PaletteGeneratorPage() {
	return (
		<ToolLayout title="Color Palette Generator" description="Generate beautiful color palettes with various harmony rules" icon={<SwatchIcon />}>
			<PaletteGenerator />
		</ToolLayout>
	);
}
