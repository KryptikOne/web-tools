import ToolLayout from '@/components/ToolLayout/ToolLayout';
import SvgOptimizer from '@/features/svg-optimizer/SvgOptimizer';
import { getToolById } from "@/config/tools-registry";

export default function SvgOptimizerPage() {
	const tool = getToolById("svg-optimizer")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <SvgOptimizer />
    </ToolLayout>
  );
}
