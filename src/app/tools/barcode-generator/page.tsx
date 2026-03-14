import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BarcodeGenerator from '@/features/barcode-generator/BarcodeGenerator';

export default function BarcodeGeneratorPage() {
  return (
    <ToolLayout>
      <BarcodeGenerator />
    </ToolLayout>
  );
}
