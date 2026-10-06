import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import LoremIpsumGenerator from '@/features/lorem-ipsum-generator/LoremIpsumGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("lorem-ipsum-generator");

export default function LoremIpsumGeneratorPage() {
	const tool = getToolById("lorem-ipsum-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <LoremIpsumGenerator />
    </ToolLayout>
  );
}
