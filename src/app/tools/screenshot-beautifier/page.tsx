import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import ScreenshotBeautifier from '@/features/screenshot-beautifier/ScreenshotBeautifier';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("screenshot-beautifier");

export default function ScreenshotBeautifierPage() {
	const tool = getToolById("screenshot-beautifier")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <ScreenshotBeautifier />
    </ToolLayout>
  );
}
