import ToolLayout from '@/components/ToolLayout/ToolLayout';
import OgpTagGenerator from '@/features/ogp-tag-generator/OgpTagGenerator';
import { getToolById } from "@/config/tools-registry";

export default function OgpTagGeneratorPage() {
	const tool = getToolById("ogp-tag-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <OgpTagGenerator />
    </ToolLayout>
  );
}
