import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("unit-converter");

export default function UnitConverterPage() {
	return <UnitConverterHub initialTab="length" />;
}
