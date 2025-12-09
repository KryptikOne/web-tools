import CubicBezier from '@/features/cubic-bezier/CubicBezier';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Cubic Bezier Generator - Web Tools',
  description: 'Interactive cubic bezier curve editor for CSS animations and transitions',
};

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
