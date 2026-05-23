import ToolLayout from '@/components/ToolLayout/ToolLayout';
import JwtDecoder from '@/features/jwt-decoder/JwtDecoder';
import { getToolById } from "@/config/tools-registry";

export default function JwtDecoderPage() {
	const tool = getToolById("jwt-decoder")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <JwtDecoder />
    </ToolLayout>
  );
}
