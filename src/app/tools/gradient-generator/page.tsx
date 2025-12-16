import GradientGenerator from '@/features/gradient-generator/GradientGenerator';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { SwatchIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'CSS Gradient Generator - Web Tools',
  description: 'Create beautiful CSS gradients visually with support for linear and radial gradients',
};

export default function GradientGeneratorPage() {
  return (
    <ToolLayout
      title="CSS Gradient Generator"
      description="Create beautiful CSS gradients visually with support for linear and radial gradients"
      icon={<SwatchIcon />}
    >
      <GradientGenerator />
    </ToolLayout>
  );
}
