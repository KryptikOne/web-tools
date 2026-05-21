import ToolLayout from "@/components/ToolLayout/ToolLayout";
import UlidGenerator from "@/features/ulid-generator/UlidGenerator";

export const metadata = {
	title: "ULID Generator - Web Tools",
	description:
		"Generate sortable Universally Unique Lexicographically Sortable Identifiers (ULIDs) in bulk, with monotonic mode and timestamp decoder.",
};

export default function UlidGeneratorPage() {
	return (
		<ToolLayout>
			<UlidGenerator />
		</ToolLayout>
	);
}
