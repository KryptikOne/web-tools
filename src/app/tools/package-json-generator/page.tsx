import ToolLayout from '@/components/ToolLayout/ToolLayout';
import PackageJsonGenerator from '@/features/package-json-generator/PackageJsonGenerator';

export default function PackageJsonGeneratorPage() {
  return (
    <ToolLayout>
      <PackageJsonGenerator />
    </ToolLayout>
  );
}
