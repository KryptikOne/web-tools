import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import StringObfuscator from '@/features/string-obfuscator/StringObfuscator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("string-obfuscator");

export default function StringObfuscatorPage() {
	const tool = getToolById("string-obfuscator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <StringObfuscator />
    </ToolLayout>
  );
}
