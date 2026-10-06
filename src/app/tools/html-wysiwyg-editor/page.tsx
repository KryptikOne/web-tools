import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import HtmlWysiwygEditor from "@/features/html-wysiwyg-editor/HtmlWysiwygEditor";
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("html-wysiwyg-editor");

export default function HtmlWysiwygEditorPage() {
	const tool = getToolById("html-wysiwyg-editor")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<HtmlWysiwygEditor />
		</ToolLayout>
	);
}
