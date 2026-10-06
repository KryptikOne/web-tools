import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("data-storage-converter");

export default function DataStorageConverterPage() {
	return <UnitConverterHub initialTab="data" />;
}
