import ToolLayout from '@/components/ToolLayout/ToolLayout';
import ImageResizer from '@/features/image-resizer/ImageResizer';
import { getToolById } from "@/config/tools-registry";

export default function ImageResizerPage() {
	const tool = getToolById("image-resizer")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <ImageResizer />
    </ToolLayout>
  );
}
