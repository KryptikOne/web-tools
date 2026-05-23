import ToolLayout from '@/components/ToolLayout/ToolLayout';
import ImageFormatConverter from '@/features/image-format-converter/ImageFormatConverter';
import { getToolById } from "@/config/tools-registry";

export default function ImageFormatConverterPage() {
	const tool = getToolById("image-format-converter")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <ImageFormatConverter />
    </ToolLayout>
  );
}
