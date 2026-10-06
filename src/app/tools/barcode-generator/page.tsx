import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import BarcodeGenerator from '@/features/barcode-generator/BarcodeGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("barcode-generator");

export default function BarcodeGeneratorPage() {
	const tool = getToolById("barcode-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <BarcodeGenerator />
    </ToolLayout>
  );
}
