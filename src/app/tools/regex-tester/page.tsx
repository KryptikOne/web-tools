import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import RegexTester from '@/features/regex-tester/RegexTester';
import { CommandLineIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("regex-tester");

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
