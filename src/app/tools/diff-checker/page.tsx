import DiffChecker from '@/features/diff-checker/DiffChecker';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Diff Checker - Web Tools',
  description: 'Compare two blocks of text side by side or unified, with word and character-level highlighting, syntax colouring, moved-line detection, collapsible unchanged lines, and patch export',
};

export default function DiffCheckerPage() {
  return (
    <ToolLayout
      title="Diff Checker"
      description="Compare two texts and see exactly what changed, down to the word or character"
      icon={<DocumentMagnifyingGlassIcon />}
    >
      <DiffChecker />
    </ToolLayout>
  );
}
