import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BorderRadiusGenerator from '@/features/border-radius-generator/BorderRadiusGenerator';
import { getToolById } from "@/config/tools-registry";

export default function BorderRadiusGeneratorPage() {
	const tool = getToolById("border-radius-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <BorderRadiusGenerator />
    </ToolLayout>
  );
}
