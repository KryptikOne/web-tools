import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("power-converter");

export default function PowerConverterPage() {
	return <UnitConverterHub initialTab="power" />;
}
