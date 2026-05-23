import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BoxShadowGenerator from '@/features/box-shadow-generator/BoxShadowGenerator';
import { getToolById } from "@/config/tools-registry";

export default function BoxShadowGeneratorPage() {
	const tool = getToolById("box-shadow-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <BoxShadowGenerator />
    </ToolLayout>
  );
}
