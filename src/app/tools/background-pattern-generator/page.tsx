import { toolMetadata } from "@/config/seo";
import BackgroundPatternGenerator from '@/features/background-pattern-generator/BackgroundPatternGenerator';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("background-pattern-generator");

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
