import CsvToJson from '@/features/csv-to-json/CsvToJson';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { TableCellsIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'CSV to JSON Converter - Web Tools',
  description: 'Convert CSV data to JSON format with delimiter options, header detection, and a live preview table',
};

export default function CsvToJsonPage() {
  return (
    <ToolLayout
      title="CSV to JSON Converter"
      description="Parse CSV data into JSON with configurable delimiters, header detection, and live preview"
      icon={<TableCellsIcon />}
    >
      <CsvToJson />
    </ToolLayout>
  );
}
