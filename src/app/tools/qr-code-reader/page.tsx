import ToolLayout from '@/components/ToolLayout/ToolLayout';
import QrCodeReader from '@/features/qr-code-reader/QrCodeReader';
import { getToolById } from "@/config/tools-registry";

export default function QrCodeReaderPage() {
	const tool = getToolById("qr-code-reader")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <QrCodeReader />
    </ToolLayout>
  );
}
