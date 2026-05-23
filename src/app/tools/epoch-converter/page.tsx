import ToolLayout from '@/components/ToolLayout/ToolLayout';
import EpochConverter from '@/features/epoch-converter/EpochConverter';
import { getToolById } from "@/config/tools-registry";

export default function EpochConverterPage() {
	const tool = getToolById("epoch-converter")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <EpochConverter />
    </ToolLayout>
  );
}
