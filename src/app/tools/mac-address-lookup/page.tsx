import ToolLayout from '@/components/ToolLayout/ToolLayout';
import MacAddressLookup from '@/features/mac-address-lookup/MacAddressLookup';
import { getToolById } from "@/config/tools-registry";

export default function MacAddressLookupPage() {
	const tool = getToolById("mac-address-lookup")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <MacAddressLookup />
    </ToolLayout>
  );
}
