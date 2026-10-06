import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("temperature-converter");

export default function TemperatureConverterPage() {
	return <UnitConverterHub initialTab="temperature" />;
}
