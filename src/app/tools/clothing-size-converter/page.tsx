import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("clothing-size-converter");

export default function ClothingSizeConverterPage() {
	return <UnitConverterHub initialTab="clothing" />;
}
