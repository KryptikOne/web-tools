import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("angle-converter");

export default function AngleConverterPage() {
	return <UnitConverterHub initialTab="angle" />;
}
