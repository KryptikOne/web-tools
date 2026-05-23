import ToolLayout from '@/components/ToolLayout/ToolLayout';
import PxRemCalculator from '@/features/px-rem-calculator/PxRemCalculator';
import { getToolById } from "@/config/tools-registry";

export default function PxRemCalculatorPage() {
	const tool = getToolById("px-rem-calculator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <PxRemCalculator />
    </ToolLayout>
  );
}
