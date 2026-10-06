import { toolMetadata } from "@/config/seo";
import TimezoneConverter from "@/features/timezone-converter/TimezoneConverter";

export const metadata = toolMetadata("timezone-converter");

export default function TimezoneConverterPage() {
	return <TimezoneConverter />;
}
