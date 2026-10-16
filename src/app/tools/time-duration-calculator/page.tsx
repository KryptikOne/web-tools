import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("time-duration-calculator");

export default function TimeDurationCalculatorPage() {
	return <UnitConverterHub initialTab="time" />;
}
