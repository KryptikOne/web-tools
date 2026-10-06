import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import HttpStatusCodes from '@/features/http-status-codes/HttpStatusCodes';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("http-status-codes");

export default function HttpStatusCodesPage() {
	const tool = getToolById("http-status-codes")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <HttpStatusCodes />
    </ToolLayout>
  );
}
