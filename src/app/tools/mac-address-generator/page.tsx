import ToolLayout from '@/components/ToolLayout/ToolLayout';
import MacAddressGenerator from '@/features/mac-address-generator/MacAddressGenerator';
import { getToolById } from "@/config/tools-registry";

export default function MacAddressGeneratorPage() {
	const tool = getToolById("mac-address-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <MacAddressGenerator />
    </ToolLayout>
  );
}
