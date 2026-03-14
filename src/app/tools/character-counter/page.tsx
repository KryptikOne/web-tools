import { Metadata } from "next";
import CharacterCounter from "@/features/character-counter/CharacterCounter";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
	title: "Character Counter | Web Tools",
	description:
		"Count characters, words, sentences, paragraphs, and lines. View reading and speaking time estimates, character frequency analysis, and social media character limits.",
};

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
