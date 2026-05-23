import ToolLayout from '@/components/ToolLayout/ToolLayout';
import FaviconGenerator from '@/features/favicon-generator/FaviconGenerator';
import { getToolById } from "@/config/tools-registry";

export default function FaviconGeneratorPage() {
	const tool = getToolById("favicon-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <FaviconGenerator />
    </ToolLayout>
  );
}
