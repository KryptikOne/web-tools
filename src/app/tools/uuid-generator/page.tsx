import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import UuidGenerator from '@/features/uuid-generator/UuidGenerator';
import { FingerPrintIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("uuid-generator");

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
