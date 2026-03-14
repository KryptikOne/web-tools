import AsciiToHex from '@/features/ascii-to-hex/AsciiToHex';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { CodeBracketSquareIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'ASCII to Hex Converter - Web Tools',
  description: 'Convert ASCII text to hexadecimal and hex to ASCII with delimiter options, case toggle, and a full ASCII character table',
};

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
