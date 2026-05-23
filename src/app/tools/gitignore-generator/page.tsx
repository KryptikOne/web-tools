import ToolLayout from '@/components/ToolLayout/ToolLayout';
import GitignoreGenerator from '@/features/gitignore-generator/GitignoreGenerator';
import { getToolById } from "@/config/tools-registry";

export default function GitignoreGeneratorPage() {
	const tool = getToolById("gitignore-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <GitignoreGenerator />
    </ToolLayout>
  );
}
