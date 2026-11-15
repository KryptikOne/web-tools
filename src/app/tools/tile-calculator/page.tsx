import { toolMetadata } from "@/config/seo";
import TileCalculator from "@/features/tile-calculator/TileCalculator";

export const metadata = toolMetadata("tile-calculator");

export default function TileCalculatorPage() {
	return <TileCalculator />;
}
