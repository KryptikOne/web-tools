import { Metadata } from "next";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import FileSizeCalculator from "@/features/file-size-calculator/FileSizeCalculator";
import { CalculatorIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
	title: "File Size Calculator | Web Tools",
	description:
		"Convert between file size units (bytes, KB, MB, GB, TB, PB) with binary and decimal modes. Plan storage capacity and explore common file size references.",
};

export default function FileSizeCalculatorPage() {
	return (
		<ToolLayout
			title="File Size Calculator"
			description="Convert file sizes, plan storage capacity, and explore common references."
			icon={<CalculatorIcon className="w-6 h-6" />}
		>
			<FileSizeCalculator />
		</ToolLayout>
	);
}
