import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("volume-converter");

export default function VolumeConverterPage() {
	return <UnitConverterHub initialTab="volume" />;
}
