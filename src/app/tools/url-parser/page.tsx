import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import UrlParser from '@/features/url-parser/UrlParser';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("url-parser");

export default function UrlParserPage() {
	const tool = getToolById("url-parser")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <UrlParser />
    </ToolLayout>
  );
}
