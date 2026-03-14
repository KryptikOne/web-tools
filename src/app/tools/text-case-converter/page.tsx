import TextCaseConverter from '@/features/text-case-converter/TextCaseConverter';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { LanguageIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Text Case Converter - Web Tools',
  description: 'Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, and more',
};

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
