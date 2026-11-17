import { toolMetadata } from "@/config/seo";
import DeckCalculator from "@/features/deck-calculator/DeckCalculator";

export const metadata = toolMetadata("deck-calculator");

export default function DeckCalculatorPage() {
	return <DeckCalculator />;
}
