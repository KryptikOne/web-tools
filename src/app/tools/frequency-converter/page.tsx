import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("frequency-converter");

export default function FrequencyConverterPage() {
	return <UnitConverterHub initialTab="frequency" />;
}
