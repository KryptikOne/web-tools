import { toolMetadata } from "@/config/seo";
import HtmlTagRemover from "@/features/html-tag-remover/HtmlTagRemover";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("html-tag-remover");

export default function HtmlTagRemoverPage() {
  return (
    <ToolLayout
      title="HTML Tag Remover"
      description="Strip HTML tags from text with options to preserve structure and links"
      icon={<CodeBracketIcon />}
    >
      <HtmlTagRemover />
    </ToolLayout>
  );
}
