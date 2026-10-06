import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import SvgOptimizer from '@/features/svg-optimizer/SvgOptimizer';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("svg-optimizer");

export default function SvgOptimizerPage() {
	const tool = getToolById("svg-optimizer")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <SvgOptimizer />
    </ToolLayout>
  );
}
