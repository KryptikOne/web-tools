import ToolLayout from '@/components/ToolLayout/ToolLayout';
import QrCodeReader from '@/features/qr-code-reader/QrCodeReader';

export default function QrCodeReaderPage() {
  return (
    <ToolLayout>
      <QrCodeReader />
    </ToolLayout>
  );
}
