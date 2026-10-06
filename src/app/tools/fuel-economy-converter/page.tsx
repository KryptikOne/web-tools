import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("fuel-economy-converter");

export default function FuelEconomyConverterPage() {
	return <UnitConverterHub initialTab="fuel" />;
}
