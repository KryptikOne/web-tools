import { toolMetadata } from "@/config/seo";
import HtmlEscapeUnescape from "@/features/html-escape-unescape/HtmlEscapeUnescape";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { CodeBracketSquareIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("html-escape-unescape");

export default function HtmlEscapeUnescapePage() {
	return (
		<ToolLayout
			title="HTML Escape / Unescape"
			description="Escape and unescape HTML entities. Convert special characters to HTML entities and back."
			icon={<CodeBracketSquareIcon />}
		>
			<HtmlEscapeUnescape />
		</ToolLayout>
	);
}
