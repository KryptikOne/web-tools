import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BasicAuthGenerator from '@/features/basic-auth-generator/BasicAuthGenerator';
import { getToolById } from "@/config/tools-registry";

export default function BasicAuthGeneratorPage() {
	const tool = getToolById("basic-auth-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <BasicAuthGenerator />
    </ToolLayout>
  );
}
