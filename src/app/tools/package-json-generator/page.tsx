import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import PackageJsonGenerator from '@/features/package-json-generator/PackageJsonGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("package-json-generator");

export default function PackageJsonGeneratorPage() {
	const tool = getToolById("package-json-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <PackageJsonGenerator />
    </ToolLayout>
  );
}
