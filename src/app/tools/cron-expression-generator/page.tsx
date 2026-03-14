import ToolLayout from '@/components/ToolLayout/ToolLayout';
import CronExpressionGenerator from '@/features/cron-expression-generator/CronExpressionGenerator';

export default function CronExpressionGeneratorPage() {
  return (
    <ToolLayout>
      <CronExpressionGenerator />
    </ToolLayout>
  );
}
