import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import Ipv6UlaGenerator from '@/features/ipv6-ula-generator/Ipv6UlaGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("ipv6-ula-generator");

export default function Ipv6UlaGeneratorPage() {
	const tool = getToolById("ipv6-ula-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <Ipv6UlaGenerator />
    </ToolLayout>
  );
}
