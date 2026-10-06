import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import MetaTagGenerator from '@/features/meta-tag-generator/MetaTagGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("meta-tag-generator");

export default function MetaTagGeneratorPage() {
	const tool = getToolById("meta-tag-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <MetaTagGenerator />
    </ToolLayout>
  );
}
