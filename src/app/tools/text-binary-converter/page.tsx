import TextBinaryConverter from '@/features/text-binary-converter/TextBinaryConverter';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Text/Binary Converter - Web Tools',
  description: 'Convert text to binary and binary to text with ASCII and UTF-8 encoding options',
};

export default function TextBinaryConverterPage() {
  return (
    <ToolLayout
      title="Text/Binary Converter"
      description="Convert text to binary and binary to text with encoding options"
      icon={<CodeBracketIcon />}
    >
      <TextBinaryConverter />
    </ToolLayout>
  );
}
