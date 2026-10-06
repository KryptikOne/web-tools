import { toolMetadata } from "@/config/seo";
import DiceRoller from "@/features/dice-roller/DiceRoller";

export const metadata = toolMetadata("dice-roller");

export default function DiceRollerPage() {
	return <DiceRoller />;
}
