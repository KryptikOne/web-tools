import { toolMetadata } from "@/config/seo";
import JsonToCsv from '@/features/json-to-csv/JsonToCsv';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { TableCellsIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("json-to-csv");

export default function JsonToCsvPage() {
  return (
    <ToolLayout
      title="JSON to CSV Converter"
      description="Convert JSON arrays of objects to CSV format with customizable options"
      icon={<TableCellsIcon />}
    >
      <JsonToCsv />
    </ToolLayout>
  );
}
