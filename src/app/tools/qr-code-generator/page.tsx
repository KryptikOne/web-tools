import ToolLayout from '@/components/ToolLayout/ToolLayout';
import QrCodeGenerator from '@/features/qr-code-generator/QrCodeGenerator';

export default function QrCodeGeneratorPage() {
  return (
    <ToolLayout>
      <QrCodeGenerator />
    </ToolLayout>
  );
}
