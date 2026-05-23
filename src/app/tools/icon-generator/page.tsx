import ToolLayout from '@/components/ToolLayout/ToolLayout';
import IconGenerator from '@/features/icon-generator/IconGenerator';
import { getToolById } from "@/config/tools-registry";

export default function IconGeneratorPage() {
	const tool = getToolById("icon-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <IconGenerator />
    </ToolLayout>
  );
}
