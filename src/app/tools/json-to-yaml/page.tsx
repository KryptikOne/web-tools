import { toolMetadata } from "@/config/seo";
import JsonToYaml from '@/features/json-to-yaml/JsonToYaml';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("json-to-yaml");

export default function JsonToYamlPage() {
  return (
    <ToolLayout
      title="JSON / YAML Converter"
      description="Convert between JSON and YAML formats with real-time preview"
      icon={<ArrowsRightLeftIcon />}
    >
      <JsonToYaml />
    </ToolLayout>
  );
}
