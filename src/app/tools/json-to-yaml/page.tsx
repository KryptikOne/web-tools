import JsonToYaml from '@/features/json-to-yaml/JsonToYaml';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'JSON to YAML Converter - Web Tools',
  description: 'Convert between JSON and YAML formats with real-time preview and configurable indentation',
};

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
