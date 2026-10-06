import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import CssFilterGenerator from '@/features/css-filter-generator/CssFilterGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("css-filter-generator");

export default function CssFilterGeneratorPage() {
	const tool = getToolById("css-filter-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CssFilterGenerator />
    </ToolLayout>
  );
}
