import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import MacAddressGenerator from '@/features/mac-address-generator/MacAddressGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("mac-address-generator");

export default function MacAddressGeneratorPage() {
	const tool = getToolById("mac-address-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <MacAddressGenerator />
    </ToolLayout>
  );
}
