import { toolMetadata } from "@/config/seo";
import TextCaseConverter from '@/features/text-case-converter/TextCaseConverter';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { LanguageIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("text-case-converter");

export default function TextCaseConverterPage() {
  return (
    <ToolLayout
      title="Text Case Converter"
      description="Convert text between multiple case formats instantly"
      icon={<LanguageIcon />}
    >
      <TextCaseConverter />
    </ToolLayout>
  );
}
