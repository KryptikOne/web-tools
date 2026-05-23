import ToolLayout from '@/components/ToolLayout/ToolLayout';
import Base64EncoderDecoder from '@/features/base64-encoder-decoder/Base64EncoderDecoder';
import { getToolById } from "@/config/tools-registry";

export default function Base64EncoderDecoderPage() {
	const tool = getToolById("base64-encoder-decoder")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <Base64EncoderDecoder />
    </ToolLayout>
  );
}
