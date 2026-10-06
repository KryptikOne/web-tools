import { toolMetadata } from "@/config/seo";
import ColorPicker from '@/features/color-picker/ColorPicker';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { SwatchIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("color-picker");

export default function ColorPickerPage() {
  return (
    <ToolLayout
      title="Color Picker"
      description="Advanced OKLCH-based color picker with multi-format conversion and WCAG compliance checking"
      icon={<SwatchIcon />}
    >
      <ColorPicker />
    </ToolLayout>
  );
}
