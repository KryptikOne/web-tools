import ToolLayout from '@/components/ToolLayout/ToolLayout';
import Ipv4AddressConverter from '@/features/ipv4-address-converter/Ipv4AddressConverter';
import { getToolById } from "@/config/tools-registry";

export default function Ipv4AddressConverterPage() {
	const tool = getToolById("ipv4-address-converter")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <Ipv4AddressConverter />
    </ToolLayout>
  );
}
