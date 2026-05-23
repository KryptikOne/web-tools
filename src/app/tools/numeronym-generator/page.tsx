import ToolLayout from '@/components/ToolLayout/ToolLayout';
import NumeronymGenerator from '@/features/numeronym-generator/NumeronymGenerator';
import { getToolById } from "@/config/tools-registry";

export default function NumeronymGeneratorPage() {
	const tool = getToolById("numeronym-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <NumeronymGenerator />
    </ToolLayout>
  );
}
