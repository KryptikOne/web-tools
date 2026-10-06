import { toolMetadata } from "@/config/seo";
import InvisibleCharacterRemover from '@/features/invisible-character-remover/InvisibleCharacterRemover';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { EyeSlashIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("invisible-character-remover");

export default function InvisibleCharacterRemoverPage() {
  return (
    <ToolLayout
      title="Invisible Character Remover"
      description="Strip invisible and problematic Unicode characters from text and code"
      icon={<EyeSlashIcon />}
    >
      <InvisibleCharacterRemover />
    </ToolLayout>
  );
}
