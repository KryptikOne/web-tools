import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import ImageFormatConverter from '@/features/image-format-converter/ImageFormatConverter';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("image-format-converter");

export default function ImageFormatConverterPage() {
	const tool = getToolById("image-format-converter")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <ImageFormatConverter />
    </ToolLayout>
  );
}
