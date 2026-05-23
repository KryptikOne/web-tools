import ToolLayout from "@/components/ToolLayout/ToolLayout";
import UlidGenerator from "@/features/ulid-generator/UlidGenerator";
import { getToolById } from "@/config/tools-registry";

export const metadata = {
	title: "ULID Generator - Web Tools",
	description:
		"Generate sortable Universally Unique Lexicographically Sortable Identifiers (ULIDs) in bulk, with monotonic mode and timestamp decoder.",
};

export default function UlidGeneratorPage() {
	const tool = getToolById("ulid-generator")!;
	return (
		<ToolLayout title={tool.name} description={tool.description}>
			<UlidGenerator />
		</ToolLayout>
	);
}
