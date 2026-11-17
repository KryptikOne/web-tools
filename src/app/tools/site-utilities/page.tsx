import { toolMetadata } from "@/config/seo";
import SiteUtilities from "@/features/site-utilities/SiteUtilities";

export const metadata = toolMetadata("site-utilities");

export default function SiteUtilitiesPage() {
	return <SiteUtilities />;
}
