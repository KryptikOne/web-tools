import { toolMetadata } from "@/config/seo";
import RecipeTablePage from "@/features/recipe-table/RecipeTablePage";

export const metadata = toolMetadata("recipe-table");

export default function RecipeTableRoute() {
	return <RecipeTablePage />;
}
