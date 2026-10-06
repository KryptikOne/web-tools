import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import CssUnitConverter from '@/features/css-unit-converter/CssUnitConverter';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("css-unit-converter");

export default function CssUnitConverterPage() {
	const tool = getToolById("css-unit-converter")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CssUnitConverter />
    </ToolLayout>
  );
}
