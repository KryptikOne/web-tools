import { toolMetadata } from "@/config/seo";
import UnitConverterHub from "@/features/unit-converter/UnitConverterHub";

export const metadata = toolMetadata("speed-converter");

export default function SpeedConverterPage() {
	return <UnitConverterHub initialTab="speed" />;
}
