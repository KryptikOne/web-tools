import { toolMetadata } from "@/config/seo";
import TankCalculator from "@/features/tank-calculator/TankCalculator";

export const metadata = toolMetadata("tank-calculator");

export default function TankCalculatorPage() {
	return <TankCalculator />;
}
