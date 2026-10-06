import { toolMetadata } from "@/config/seo";
import AsciiToHex from '@/features/ascii-to-hex/AsciiToHex';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { CodeBracketSquareIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("ascii-to-hex");

export default function AsciiToHexPage() {
  return (
    <ToolLayout
      title="ASCII to Hex Converter"
      description="Convert between ASCII text and hexadecimal values with customizable formatting"
      icon={<CodeBracketSquareIcon />}
    >
      <AsciiToHex />
    </ToolLayout>
  );
}
