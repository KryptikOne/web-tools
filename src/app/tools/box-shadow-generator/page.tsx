import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BoxShadowGenerator from '@/features/box-shadow-generator/BoxShadowGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("box-shadow-generator");

export default function BoxShadowGeneratorPage() {
	const tool = getToolById("box-shadow-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <BoxShadowGenerator />
    </ToolLayout>
  );
}
