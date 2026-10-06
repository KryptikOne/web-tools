import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import NumeronymGenerator from '@/features/numeronym-generator/NumeronymGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("numeronym-generator");

export default function NumeronymGeneratorPage() {
	const tool = getToolById("numeronym-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <NumeronymGenerator />
    </ToolLayout>
  );
}
