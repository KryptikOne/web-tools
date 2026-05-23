import ToolLayout from '@/components/ToolLayout/ToolLayout';
import Ipv4RangeExpander from '@/features/ipv4-range-expander/Ipv4RangeExpander';
import { getToolById } from "@/config/tools-registry";

export default function Ipv4RangeExpanderPage() {
	const tool = getToolById("ipv4-range-expander")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <Ipv4RangeExpander />
    </ToolLayout>
  );
}
