import ToolLayout from '@/components/ToolLayout/ToolLayout';
import UrlParser from '@/features/url-parser/UrlParser';
import { getToolById } from "@/config/tools-registry";

export default function UrlParserPage() {
	const tool = getToolById("url-parser")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <UrlParser />
    </ToolLayout>
  );
}
