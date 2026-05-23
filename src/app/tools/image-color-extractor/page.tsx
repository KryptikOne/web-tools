import ToolLayout from '@/components/ToolLayout/ToolLayout';
import ImageColorExtractor from '@/features/image-color-extractor/ImageColorExtractor';
import { getToolById } from "@/config/tools-registry";

export default function ImageColorExtractorPage() {
	const tool = getToolById("image-color-extractor")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <ImageColorExtractor />
    </ToolLayout>
  );
}
