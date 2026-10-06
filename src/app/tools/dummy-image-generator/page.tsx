import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import DummyImageGenerator from '@/features/dummy-image-generator/DummyImageGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("dummy-image-generator");

export default function DummyImageGeneratorPage() {
	const tool = getToolById("dummy-image-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <DummyImageGenerator />
    </ToolLayout>
  );
}
