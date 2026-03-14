import ToolLayout from '@/components/ToolLayout/ToolLayout';
import RegexTester from '@/features/regex-tester/RegexTester';
import { CommandLineIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'RegEx Tester - Web Tools',
  description: 'Test and debug regular expressions with real-time match highlighting, capture groups, and find & replace',
};

export default function RegexTesterPage() {
  return (
    <ToolLayout
      title="RegEx Tester"
      description="Test, debug, and visualize regular expressions with real-time matching"
      icon={<CommandLineIcon />}
    >
      <RegexTester />
    </ToolLayout>
  );
}
