import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BorderRadiusGenerator from '@/features/border-radius-generator/BorderRadiusGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("border-radius-generator");

export default function BorderRadiusGeneratorPage() {
	const tool = getToolById("border-radius-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <BorderRadiusGenerator />
    </ToolLayout>
  );
}
