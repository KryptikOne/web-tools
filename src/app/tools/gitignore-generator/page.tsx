import ToolLayout from '@/components/ToolLayout/ToolLayout';
import GitignoreGenerator from '@/features/gitignore-generator/GitignoreGenerator';

export default function GitignoreGeneratorPage() {
  return (
    <ToolLayout>
      <GitignoreGenerator />
    </ToolLayout>
  );
}
