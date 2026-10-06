import { toolMetadata } from "@/config/seo";
import TextBinaryConverter from '@/features/text-binary-converter/TextBinaryConverter';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("text-binary-converter");

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
