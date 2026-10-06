import { toolMetadata } from "@/config/seo";
import DiffChecker from '@/features/diff-checker/DiffChecker';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("diff-checker");

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
