import { toolMetadata } from "@/config/seo";
import TimeDurationCalculator from "@/features/time-duration-calculator/TimeDurationCalculator";

export const metadata = toolMetadata("time-duration-calculator");

export default function TimeDurationCalculatorPage() {
	return <TimeDurationCalculator />;
}
