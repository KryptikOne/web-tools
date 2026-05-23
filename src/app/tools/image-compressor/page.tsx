import ToolLayout from '@/components/ToolLayout/ToolLayout';
import ImageCompressor from '@/features/image-compressor/ImageCompressor';
import { getToolById } from "@/config/tools-registry";

export default function ImageCompressorPage() {
	const tool = getToolById("image-compressor")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <ImageCompressor />
    </ToolLayout>
  );
}
