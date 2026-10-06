import { toolMetadata } from "@/config/seo";
import ToolLayout from "@/components/ToolLayout/ToolLayout";
import FileSizeCalculator from "@/features/file-size-calculator/FileSizeCalculator";
import { CalculatorIcon } from "@heroicons/react/24/outline";

export const metadata = toolMetadata("file-size-calculator");

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
