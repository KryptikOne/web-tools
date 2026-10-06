import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import MarkdownPreview from '@/features/markdown-preview/MarkdownPreview';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("markdown-preview");

export default function MarkdownPreviewPage() {
	const tool = getToolById("markdown-preview")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <MarkdownPreview />
    </ToolLayout>
  );
}
