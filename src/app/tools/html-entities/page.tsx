import { toolMetadata } from "@/config/seo";
import HtmlEntitiesReference from '@/features/html-entities/HtmlEntitiesReference';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

export const metadata = toolMetadata("html-entities");

export default function HtmlEntitiesPage() {
  return (
    <ToolLayout
      title="HTML Entities Reference"
      description="Comprehensive HTML entities reference sheet with Unicode, Entity, CSS, and HTML codes"
      icon={<CodeBracketIcon />}
    >
      <HtmlEntitiesReference />
    </ToolLayout>
  );
}