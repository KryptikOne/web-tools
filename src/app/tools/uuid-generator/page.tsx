import ToolLayout from '@/components/ToolLayout/ToolLayout';
import UuidGenerator from '@/features/uuid-generator/UuidGenerator';
import { FingerPrintIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'UUID Generator - Web Tools',
  description: 'Generate, format, and validate UUIDs (v4). Supports bulk generation with multiple format options.',
};

export default function UuidGeneratorPage() {
  return (
    <ToolLayout
      title="UUID Generator"
      description="Generate, format, and validate universally unique identifiers"
      icon={<FingerPrintIcon />}
    >
      <UuidGenerator />
    </ToolLayout>
  );
}
