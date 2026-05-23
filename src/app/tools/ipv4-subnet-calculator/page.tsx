import ToolLayout from '@/components/ToolLayout/ToolLayout';
import Ipv4SubnetCalculator from '@/features/ipv4-subnet-calculator/Ipv4SubnetCalculator';
import { getToolById } from "@/config/tools-registry";

export default function Ipv4SubnetCalculatorPage() {
	const tool = getToolById("ipv4-subnet-calculator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <Ipv4SubnetCalculator />
    </ToolLayout>
  );
}
