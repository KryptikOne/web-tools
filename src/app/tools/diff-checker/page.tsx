import DiffChecker from '@/features/diff-checker/DiffChecker';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Diff Checker - Web Tools',
  description: 'Compare two blocks of text side by side and highlight the differences line by line',
};

export default function DiffCheckerPage() {
  return (
    <ToolLayout
      title="Diff Checker"
      description="Compare two blocks of text and highlight differences line by line"
      icon={<DocumentMagnifyingGlassIcon />}
    >
      <DiffChecker />
    </ToolLayout>
  );
}
