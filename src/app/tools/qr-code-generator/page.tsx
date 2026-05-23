import ToolLayout from '@/components/ToolLayout/ToolLayout';
import QrCodeGenerator from '@/features/qr-code-generator/QrCodeGenerator';
import { getToolById } from "@/config/tools-registry";

export default function QrCodeGeneratorPage() {
	const tool = getToolById("qr-code-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <QrCodeGenerator />
    </ToolLayout>
  );
}
