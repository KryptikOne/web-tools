import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import CspParser from '@/features/csp-parser/CspParser';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("csp-parser");

export default function CspParserPage() {
	const tool = getToolById("csp-parser")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CspParser />
    </ToolLayout>
  );
}
