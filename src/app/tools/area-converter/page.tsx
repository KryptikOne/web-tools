import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("area-converter");

export default function AreaConverterPage() {
	return <UnitConverterHub initialTab="area" />;
}
