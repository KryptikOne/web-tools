import HtmlTagRemover from "@/features/html-tag-remover/HtmlTagRemover";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "HTML Tag Remover - Web Tools",
  description:
    "Strip HTML tags from text with options to preserve line breaks, links, and selectively remove specific tags",
};

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
