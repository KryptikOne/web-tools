import { toolMetadata } from "@/config/seo";
import CurvedMoldingCalculator from "@/features/curved-molding-calculator/CurvedMoldingCalculator";

export const metadata = toolMetadata("curved-molding-calculator");

export default function CurvedMoldingCalculatorPage() {
	return <CurvedMoldingCalculator />;
}
