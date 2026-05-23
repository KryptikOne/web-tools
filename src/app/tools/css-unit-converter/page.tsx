import ToolLayout from '@/components/ToolLayout/ToolLayout';
import CssUnitConverter from '@/features/css-unit-converter/CssUnitConverter';
import { getToolById } from "@/config/tools-registry";

export default function CssUnitConverterPage() {
	const tool = getToolById("css-unit-converter")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CssUnitConverter />
    </ToolLayout>
  );
}
