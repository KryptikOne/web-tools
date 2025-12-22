import PaletteGenerator from "@/features/palette-generator/PaletteGenerator";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { SwatchIcon } from "@heroicons/react/24/outline";

export const metadata = {
	title: "Color Palette Generator - Web Tools",
	description: "Generate beautiful color palettes with various harmony rules including analogous, complementary, triadic, and more",
};

export default function PaletteGeneratorPage() {
	return (
		<ToolLayout title="Color Palette Generator" description="Generate beautiful color palettes with various harmony rules" icon={<SwatchIcon />}>
			<PaletteGenerator />
		</ToolLayout>
	);
}
