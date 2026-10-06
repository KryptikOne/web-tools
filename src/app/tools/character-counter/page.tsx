import { toolMetadata } from "@/config/seo";
import CharacterCounter from "@/features/character-counter/CharacterCounter";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("character-counter");

export default function CharacterCounterPage() {
	return (
		<ToolLayout
			title="Character Counter"
			description="Analyze text with real-time character, word, and sentence counts plus social media limit tracking"
			icon={<DocumentTextIcon />}
		>
			<CharacterCounter />
		</ToolLayout>
	);
}
