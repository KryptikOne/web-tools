import { toolMetadata } from "@/config/seo";
import DeckBoards from "@/features/deck-boards/DeckBoards";

export const metadata = toolMetadata("deck-boards");

export default function DeckBoardsPage() {
	return <DeckBoards />;
}
