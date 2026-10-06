import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("pressure-converter");

export default function PressureConverterPage() {
	return <UnitConverterHub initialTab="pressure" />;
}
