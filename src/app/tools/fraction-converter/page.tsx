import { toolMetadata } from "@/config/seo";
import FractionConverter from "@/features/fraction-converter/FractionConverter";

export const metadata = toolMetadata("fraction-converter");

export default function FractionConverterPage() {
	return <FractionConverter />;
}
