import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("kitchen-converter");

export default function KitchenConverterPage() {
	return <UnitConverterHub initialTab="kitchen" />;
}
