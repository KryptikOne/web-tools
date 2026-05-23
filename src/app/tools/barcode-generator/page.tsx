import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BarcodeGenerator from '@/features/barcode-generator/BarcodeGenerator';
import { getToolById } from "@/config/tools-registry";

export default function BarcodeGeneratorPage() {
	const tool = getToolById("barcode-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <BarcodeGenerator />
    </ToolLayout>
  );
}
