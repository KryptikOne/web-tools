import ToolLayout from '@/components/ToolLayout/ToolLayout';
import SlugifyString from '@/features/slugify-string/SlugifyString';
import { getToolById } from "@/config/tools-registry";

export default function SlugifyStringPage() {
	const tool = getToolById("slugify-string")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <SlugifyString />
    </ToolLayout>
  );
}
