import ToolLayout from '@/components/ToolLayout/ToolLayout';
import CssFilterGenerator from '@/features/css-filter-generator/CssFilterGenerator';
import { getToolById } from "@/config/tools-registry";

export default function CssFilterGeneratorPage() {
	const tool = getToolById("css-filter-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CssFilterGenerator />
    </ToolLayout>
  );
}
