import ToolLayout from '@/components/ToolLayout/ToolLayout';
import UrlEncoderDecoder from '@/features/url-encoder-decoder/UrlEncoderDecoder';
import { getToolById } from "@/config/tools-registry";

export default function UrlEncoderDecoderPage() {
	const tool = getToolById("url-encoder-decoder")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <UrlEncoderDecoder />
    </ToolLayout>
  );
}
