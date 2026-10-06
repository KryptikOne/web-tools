import { toolMetadata } from "@/config/seo";
import CubicBezier from '@/features/cubic-bezier/CubicBezier';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("cubic-bezier");

export default function CubicBezierPage() {
  return (
    <ToolLayout
      title="Cubic Bezier Generator"
      description="Interactive cubic bezier curve editor for CSS animations and transitions"
      icon={<ArrowTrendingUpIcon />}
    >
      <CubicBezier />
    </ToolLayout>
  );
}
