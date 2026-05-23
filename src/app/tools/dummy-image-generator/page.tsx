import ToolLayout from '@/components/ToolLayout/ToolLayout';
import DummyImageGenerator from '@/features/dummy-image-generator/DummyImageGenerator';
import { getToolById } from "@/config/tools-registry";

export default function DummyImageGeneratorPage() {
	const tool = getToolById("dummy-image-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <DummyImageGenerator />
    </ToolLayout>
  );
}
