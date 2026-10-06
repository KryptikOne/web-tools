import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("weight-converter");

export default function WeightConverterPage() {
	return <UnitConverterHub initialTab="weight" />;
}
