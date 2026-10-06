import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("energy-converter");

export default function EnergyConverterPage() {
	return <UnitConverterHub initialTab="energy" />;
}
