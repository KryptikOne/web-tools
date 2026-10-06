import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("distance-converter");

export default function DistanceConverterPage() {
	return <UnitConverterHub initialTab="length" />;
}
