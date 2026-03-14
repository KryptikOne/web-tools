import BackgroundPatternGenerator from '@/features/background-pattern-generator/BackgroundPatternGenerator';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Background Pattern Generator - Web Tools',
  description: 'Create seamless CSS background patterns using gradients. Stripes, dots, checkerboard, grid, zigzag, waves, and triangles.',
};

export default function BackgroundPatternGeneratorPage() {
  return (
    <ToolLayout
      title="Background Pattern Generator"
      description="Create seamless CSS background patterns using gradients"
      icon={<Square3Stack3DIcon />}
    >
      <BackgroundPatternGenerator />
    </ToolLayout>
  );
}
