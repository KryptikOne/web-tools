import ToolLayout from '@/components/ToolLayout/ToolLayout';
import CronExpressionGenerator from '@/features/cron-expression-generator/CronExpressionGenerator';
import { getToolById } from "@/config/tools-registry";

export default function CronExpressionGeneratorPage() {
	const tool = getToolById("cron-expression-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <CronExpressionGenerator />
    </ToolLayout>
  );
}
